// src/pages/ai-chat.tsx

import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Send } from 'lucide-react';
import { GoogleGenerativeAI, Content } from '@google/generative-ai';
import { supabase } from '../lib/supabase'; // Your Supabase client import path
import { useAuth } from '../hooks/useAuth'; // The correct import path for your hook

// --- Initialize the Gemini Model ---
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Define the shape of a message for our state
interface Message {
  text: string;
  sender: 'user' | 'ai';
}

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    { text: "Hello! I am your personal AI wellness assistant. How can I help you today?", sender: 'ai' }
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Effect to handle initial message passed from another page
  useEffect(() => {
    if (user && location.state?.initialMessage) {
      const initialMessage = location.state.initialMessage;
      const newMessages = [...messages, { text: initialMessage, sender: 'user' as const }];
      setMessages(newMessages);
      getAIResponse(newMessages);
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, user]);

  // Effect to auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  /**
   * Main function to get a response from the Gemini API with memory.
   * This function now includes the fix for the "First content should be 'user'" error.
   */
  const getAIResponse = async (currentMessages: Message[]) => {
    setIsSending(true);
    try {
      // Convert our message state into the format Gemini requires.
      const geminiFormattedMessages: Content[] = currentMessages
        .filter(msg => msg.text)
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }],
        }));

      // The last message is the new prompt the user just sent.
      const latestMessage = geminiFormattedMessages.pop();
      if (!latestMessage) {
        setIsSending(false);
        return;
      }

      // The rest of the messages are the conversation history.
      let history = geminiFormattedMessages;

      // --- *** ERROR FIX STARTS HERE *** ---
      // The Gemini API requires the history array to begin with a 'user' message.
      // Our chat starts with a 'model' greeting, which causes an error on the first turn.
      // This logic checks if the history is invalid (starts with 'model') and corrects it
      // by starting with an empty history for that specific first turn.
      if (history.length > 0 && history[0].role !== 'user') {
        history = [];
      }
      // --- *** ERROR FIX ENDS HERE *** ---

      const chat = model.startChat({ history });
      const result = await chat.sendMessage(latestMessage.parts);
      const response = await result.response;
      const text = response.text();
      
      const newFullConversation = [...currentMessages, { text, sender: 'ai' as const }];
      setMessages(newFullConversation);
      
      // Update summary in the background
      await updateSummaryAndRecommendations(newFullConversation);

    } catch (error) {
      console.error("Error getting AI response:", error);
      setMessages(prev => [...prev, { text: "I'm sorry, I ran into an issue. Please try again.", sender: 'ai' }]);
    } finally {
      setIsSending(false);
    }
  };

  /**
   * Analyzes the conversation and updates the user's summary and recommendations in Supabase.
   */
  const updateSummaryAndRecommendations = async (fullConversation: Message[]) => {
    if (!user || fullConversation.length < 4) return;

    try {
      const conversationText = fullConversation.map(m => `${m.sender === 'user' ? 'User' : 'AI'}: ${m.text}`).join('\n');
      const { data: summaryData } = await supabase.from('user_ai_summaries').select('aichat_summary').eq('user_id', user.id).maybeSingle();
      const oldSummary = summaryData?.aichat_summary || "This is the user's first conversation.";
      const summaryPrompt = `Update the user's wellness summary by integrating key points from the latest conversation. PREVIOUS SUMMARY: "${oldSummary}". LATEST CONVERSATION: "${conversationText}". TASK: Respond with ONLY the updated summary text.`;
      const summaryResult = await model.generateContent(summaryPrompt);
      const updatedSummary = (await summaryResult.response.text()).trim();
      const recsPrompt = `Based on this user summary, provide exactly 5 short, actionable wellness recommendations. Format as a numbered list. SUMMARY: "${updatedSummary}"`;
      const recsResult = await model.generateContent(recsPrompt);
      const recsText = await recsResult.response.text();
      const parsedRecommendations = recsText.split('\n').map(rec => rec.replace(/^\d+\.\s*/, '').trim()).filter(rec => rec.length > 5);
      await supabase.from('user_ai_summaries').upsert({
        user_id: user.id,
        aichat_summary: updatedSummary,
        recommendations: parsedRecommendations.slice(0, 5),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
    } catch (error) {
      console.error("Failed to update AI summary:", error);
    }
  };

  /**
   * Handles the form submission when the user sends a message.
   */
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (trimmedInput === '' || isSending) return;
    
    const newMessages: Message[] = [...messages, { text: trimmedInput, sender: 'user' }];
    setMessages(newMessages);
    setInput('');
    await getAIResponse(newMessages);
  };

  // If the user is not logged in, show a message instead of the chat interface.
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-150px)] text-center">
        <h2 className="text-2xl font-semibold text-gray-700">Authentication Required</h2>
        <p className="mt-2 text-gray-500">You must be logged in to use the AI Chat.</p>
        <Link to="/auth" className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600">
          Sign In or Sign Up
        </Link>
      </div>
    );
  }

  // --- JSX for the component ---
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
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSend} className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isSending ? "AI is thinking..." : "Type your message..."}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSending}
          />
          <button
            type="submit"
            className="p-3 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-full shadow-md hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
            disabled={!input.trim() || isSending}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};