import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { supabase, DiaryEntry, Conversation } from '../../lib/supabase';
import { chatWithAI } from '../../lib/gemini';
import { Send, Bot, User, Sparkles, MessageCircle } from 'lucide-react';

interface AIChatProps {
  diaryEntries: DiaryEntry[];
}

export function AIChat({ diaryEntries }: AIChatProps) {
  const { user } = useUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    
    if (data) {
      setConversations(data);
    }
  };

  const handleSendMessage = async () => {
    if (!user || !currentMessage.trim()) return;

    setIsLoading(true);
    
    try {
      // Get recent diary entries for context
      const recentEntries = diaryEntries
        .slice(0, 5)
        .map(entry => entry.content);

      // Get previous conversations for context
      const previousConversations = conversations
        .slice(-10)
        .map(conv => `User: ${conv.message}\nAI: ${conv.ai_response}`);

      // Get AI response
      const aiResponse = await chatWithAI(
        currentMessage,
        recentEntries,
        previousConversations
      );

      // Save conversation
      await supabase.from('conversations').insert({
        user_id: user.id,
        message: currentMessage,
        ai_response: aiResponse,
        context_entries: recentEntries
      });

      setCurrentMessage('');
      fetchConversations();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = [
    "How have I been feeling lately based on my diary entries?",
    "What patterns do you notice in my recent writings?",
    "Can you give me some personalized advice for managing stress?",
    "What positive things have I written about recently?",
    "Help me reflect on my emotional journey this week"
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
          <div className="flex items-center gap-3">
            <Bot className="w-8 h-8" />
            <div>
              <h2 className="text-xl font-bold">Your AI Companion 🤖✨</h2>
              <p className="opacity-90">Ask me anything about your diary or get personalized support!</p>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="h-96 overflow-y-auto p-6 space-y-4">
          {conversations.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-6">Start a conversation with your AI companion!</p>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-600 font-medium">Try asking:</p>
                {suggestedQuestions.slice(0, 3).map((question, index) => (
                  <motion.button
                    key={index}
                    onClick={() => setCurrentMessage(question)}
                    whileHover={{ scale: 1.02 }}
                    className="block w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-2xl text-sm text-purple-700 transition-colors"
                  >
                    "{question}"
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            conversations.map((conversation) => (
              <div key={conversation.id} className="space-y-4">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="max-w-xs bg-purple-500 text-white p-4 rounded-2xl rounded-br-md">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4" />
                      <span className="text-sm font-medium">You</span>
                    </div>
                    <p className="text-sm">{conversation.message}</p>
                  </div>
                </div>

                {/* AI Response */}
                <div className="flex justify-start">
                  <div className="max-w-lg bg-gray-100 p-4 rounded-2xl rounded-bl-md">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-medium text-purple-600">AI Companion</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{conversation.ai_response}</p>
                  </div>
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-lg bg-gray-100 p-4 rounded-2xl rounded-bl-md">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500 animate-spin" />
                  <span className="text-sm text-gray-500">Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="p-6 border-t border-gray-100">
          <div className="flex gap-3">
            <textarea
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about your diary entries, feelings, or get personalized advice..."
              className="flex-1 p-4 border-2 border-purple-200 rounded-2xl focus:border-purple-500 focus:outline-none resize-none"
              rows={2}
            />
            <motion.button
              onClick={handleSendMessage}
              disabled={!currentMessage.trim() || isLoading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Suggested Questions */}
      {conversations.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          {suggestedQuestions.slice(3).map((question, index) => (
            <motion.button
              key={index}
              onClick={() => setCurrentMessage(question)}
              whileHover={{ scale: 1.02 }}
              className="p-4 bg-white/60 hover:bg-white/80 rounded-2xl text-left text-sm text-gray-700 border border-white/20 transition-all"
            >
              💭 {question}
            </motion.button>
          ))}
        </motion.div>
      )}
    </div>
  );
}