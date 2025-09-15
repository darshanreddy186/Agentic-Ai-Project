// src/pages/ai-chat.tsx

import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Send } from 'lucide-react';

export function AIChat() {
  const [messages, setMessages] = useState([
    { text: "Hello! I'm your personal AI assistant. How can I help you today?", sender: 'ai' }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const location = useLocation();
  const navigate = useNavigate();

  // This effect runs once when the component loads
  useEffect(() => {
    // Check if an initial message was passed from the home page
    if (location.state?.initialMessage) {
      const initialMessage = location.state.initialMessage;
      
      // Add the user's message and trigger the AI response
      setMessages(prev => [...prev, { text: initialMessage, sender: 'user' }]);
      simulateAIResponse(initialMessage); // Pass the message to the simulation

      // Clear the state from the location object to prevent re-triggering
      navigate(location.pathname, { replace: true, state: {} });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);
  
  // Updated to receive a message for context, though the response is still simulated
  const simulateAIResponse = (userMessage: string) => {
    setTimeout(() => {
      const aiResponse = `This is a simulated streaming response to your message: "${userMessage}". In a real app, Gemini would provide a contextual reply here.`;
      setMessages(prev => [...prev, { text: '', sender: 'ai' }]);
      
      let i = 0;
      const interval = setInterval(() => {
        setMessages(prev => {
          const lastMsgIndex = prev.length - 1;
          const updatedMessages = [...prev];
          updatedMessages[lastMsgIndex] = { ...updatedMessages[lastMsgIndex], text: aiResponse.substring(0, i + 1) };
          return updatedMessages;
        });
        i++;
        if (i >= aiResponse.length) {
          clearInterval(interval);
        }
      }, 20); // Speed of the streaming effect
    }, 500);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (trimmedInput === '') return;
    
    setMessages(prev => [...prev, { text: trimmedInput, sender: 'user' }]);
    setInput('');
    simulateAIResponse(trimmedInput);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-150px)] max-w-4xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100">
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex flex-col space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`rounded-lg px-4 py-2 max-w-lg break-words transition-opacity duration-300 ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'}`}
              >
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
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          <button
            type="submit"
            className="p-3 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-full shadow-md hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
            disabled={!input.trim()}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};