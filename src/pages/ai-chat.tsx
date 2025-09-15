// src/pages/ai-chat.tsx

import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Send, Loader } from 'lucide-react'; // Added Loader icon
import { GoogleGenerativeAI, Content } from '@google/generative-ai';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

// --- Initialize the Gemini Model ---
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

interface Message {
  text: string;
  sender: 'user' | 'ai';
}

// A new component for the "AI is thinking" visual indicator
const ThinkingIndicator = () => (
  <div className="flex justify-start">
    <div className="rounded-lg px-4 py-2 max-w-lg bg-gray-100 text-gray-800 flex items-center space-x-2">
      <Loader className="w-5 h-5 animate-spin" />
      <span>AI is thinking...</span>
    </div>
  </div>
);

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isAwaitingResponse, setIsAwaitingResponse] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true); // State for loading initial chat history
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // --- NEW: Effect to load persistent chat history on component mount ---
  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) {
        setInitialLoading(false);
        return;
      }

      // Fetch the last 10 messages to show 5 exchanges
      const { data, error } = await supabase
        .from('chat_messages')
        .select('role, content')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true }) // Get them in the correct order
        .limit(10); 

      if (error) {
        console.error("Error fetching chat history:", error);
      } else if (data && data.length > 0) {
        // The first message should always be the AI's greeting if history is empty
        setMessages(data.map(msg => ({
          text: msg.content,
          sender: msg.role === 'model' ? 'ai' : 'user'
        })));
      } else {
        // If no history, add the initial greeting
        setMessages([{ text: "Hello! I am your personal AI wellness assistant. How can I help you today?", sender: 'ai' }]);
      }
      setInitialLoading(false);
    };

    fetchHistory();
  }, [user]); // Run only when the user object is available

  // Auto-scroll effect
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAwaitingResponse]); // Trigger on new messages AND when thinking indicator appears/disappears

  // Main function to get AI response with retry logic
  const getAIResponse = async (currentMessages: Message[]) => {
    setIsAwaitingResponse(true);
    const maxRetries = 3;
    let delay = 2000;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const geminiFormattedMessages: Content[] = currentMessages.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }],
        }));
        
        const latestMessage = geminiFormattedMessages.pop();
        if (!latestMessage) return;
        
        let history = geminiFormattedMessages;
        if (history.length > 0 && history[0].role !== 'user') history = [];

        const chat = model.startChat({ history });
        const result = await chat.sendMessage(latestMessage.parts);
        const text = (await result.response.text()).trim();

        // --- NEW: Save AI's response to the database ---
        if (user) {
          await supabase.from('chat_messages').insert({ user_id: user.id, role: 'model', content: text });
        }
        
        setMessages(prev => [...prev, { text, sender: 'ai' as const }]);
        await updateSummaryAndRecommendations([...currentMessages, { text, sender: 'ai' as const }]);
        setIsAwaitingResponse(false);
        return;

      } catch (error: any) {
        if (error.message && error.message.includes('503')) {
          if (attempt === maxRetries - 1) {
            setMessages(prev => [...prev, { text: "The AI is currently busy. Please try sending your message again in a few moments.", sender: 'ai' }]);
            break; // Exit loop
          }
          console.warn(`Model overloaded. Retrying... (Attempt ${attempt + 1})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
        } else {
          console.error("Error getting AI response:", error);
          setMessages(prev => [...prev, { text: "I'm sorry, I ran into an unexpected issue. Please try again.", sender: 'ai' }]);
          break; // Exit loop
        }
      }
    }
    setIsAwaitingResponse(false);
  };

  // --- IMPROVED: Function to update recommendations ---
  const updateSummaryAndRecommendations = async (fullConversation: Message[]) => {
    if (!user || fullConversation.length < 4) return;
    try {
      const conversationText = fullConversation.map(m => `${m.sender}: ${m.text}`).join('\n');
      const { data: summaryData } = await supabase.from('user_ai_summaries').select('aichat_summary').eq('user_id', user.id).maybeSingle();
      const oldSummary = summaryData?.aichat_summary || "This is the user's first conversation.";
      const summaryPrompt = `Update the user's wellness summary by integrating key points from the latest conversation. PREVIOUS SUMMARY: "${oldSummary}". LATEST CONVERSATION: "${conversationText}". TASK: Respond with ONLY the updated summary text.`;
      const summaryResult = await model.generateContent(summaryPrompt);
      const updatedSummary = (await summaryResult.response.text()).trim();
      
      // IMPROVED PROMPT: More specific instructions to avoid preamble.
      const recsPrompt = `Based on this summary, provide exactly 5 short, actionable wellness recommendations. Do NOT include any introductory phrases like "Here are..." or "Sure, here are...". Begin the first recommendation directly. SUMMARY: "${updatedSummary}"`;
      const recsResult = await model.generateContent(recsPrompt);
      const recsText = await recsResult.response.text();
      
      // IMPROVED PARSING: Filter out useless introductory lines just in case.
      const parsedRecommendations = recsText.split('\n')
        .map(rec => rec.replace(/^\d+\.\s*/, '').trim())
        .filter(rec => rec.length > 5 && !rec.toLowerCase().startsWith("here are"));

      await supabase.from('user_ai_summaries').upsert({
        user_id: user.id, aichat_summary: updatedSummary, recommendations: parsedRecommendations.slice(0, 5), updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
    } catch (error) {
      console.error("Failed to update AI summary:", error);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (trimmedInput === '' || isAwaitingResponse) return;
    
    const newMessages = [...messages, { text: trimmedInput, sender: 'user' as const }];
    setMessages(newMessages);
    setInput('');
    
    // --- NEW: Save user's message to the database immediately ---
    if (user) {
        await supabase.from('chat_messages').insert({ user_id: user.id, role: 'user', content: trimmedInput });
    }

    await getAIResponse(newMessages);
  };

  if (initialLoading) {
    return <div className="flex items-center justify-center h-full"><Loader className="w-8 h-8 animate-spin" /></div>;
  }

  if (!user) {
    return <div className="flex flex-col items-center justify-center h-[calc(100vh-150px)] text-center">
        <h2 className="text-2xl font-semibold text-gray-700">Authentication Required</h2>
        <p className="mt-2 text-gray-500">You must be logged in to use the AI Chat.</p>
        <Link to="/auth" className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600">Sign In or Sign Up</Link>
      </div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-150px)] max-w-4xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100">
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex flex-col space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`rounded-lg px-4 py-2 max-w-lg break-words ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {/* --- NEW: Show the thinking indicator when awaiting a response --- */}
          {isAwaitingResponse && <ThinkingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSend} className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            // --- CHANGED: Input is NO LONGER disabled while sending ---
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="p-3 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-full shadow-md hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
            // --- CHANGED: Button is disabled to prevent multiple submissions ---
            disabled={!input.trim() || isAwaitingResponse}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};