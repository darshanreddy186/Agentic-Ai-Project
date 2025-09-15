// src/pages/Home.tsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase, UserProfile } from '../lib/supabase'; // Make sure UserProfile is imported
import { Lightbulb, BookOpen, Users, Sparkles, ChevronDown, ChevronUp, Plus, Camera, Send } from 'lucide-react';

// QuickChatInput component remains exactly the same as before
const QuickChatInput = () => {
  const [input, setInput] = useState('');
  const navigate = useNavigate();

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() === '') return;

    navigate('/ai-chat', {
      state: { initialMessage: input }
    });
  };

  return (
    <form onSubmit={handleSend} className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-200">
        <div className="max-w-3xl mx-auto p-4">
            <div className="relative">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="tell me what you did today? / How was your day?"
                    className="w-full pl-12 pr-24 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <button type="button" className="absolute left-3 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-blue-600">
                    <Plus className="w-6 h-6" />
                </button>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                    <button type="button" className="p-2 text-gray-500 hover:text-blue-600">
                        <Camera className="w-6 h-6" />
                    </button>
                    <button type="submit" className="p-2.5 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-full shadow-md hover:scale-105 transition-transform">
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    </form>
  );
};

export function Home() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [recsOpen, setRecsOpen] = useState(true);
  
  // *** RESTORED: This is the original function to fetch live data from Supabase ***
  const loadUserData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch both profile and recommendations at the same time
      const [profileRes, summaryRes] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('user_ai_summaries').select('recommendations').eq('user_id', user.id).maybeSingle()
      ]);

      setProfile(profileRes.data);
      
      const summaryData = summaryRes.data;
      // Check if recommendations exist and are not empty
      if (summaryData && summaryData.recommendations && summaryData.recommendations.length > 0) {
        setRecommendations(summaryData.recommendations);
      } else {
        // Provide a default message if no recommendations are found
        setRecommendations(["Write your first diary entry to get personalized recommendations!"]);
      }

    } catch (error: any) {
      console.error('Error loading user data:', error.message);
      // Set an error message if the fetch fails
      setRecommendations(["Could not load recommendations at this time."]);
    } finally {
      setLoading(false);
    }
  };

  // *** CHANGED: We now call the live data function instead of using mock data ***
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const parseRecommendation = (rec: string) => {
    const bolded = rec.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return <p className="text-gray-700 flex-1" dangerouslySetInnerHTML={{ __html: bolded }} />;
  };
  
  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );
  }

  return (
    <div className="space-y-6 pb-24"> {/* Padding-bottom to avoid overlap with fixed chat bar */}
      <div className="bg-gradient-to-r from-blue-500 to-green-500 rounded-xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back{profile?.display_name ? `, ${profile.display_name}` : ''}!</h1>
            <p className="text-blue-100">Ready to continue your wellness journey today?</p>
          </div>
          <div className="hidden md:block"><Sparkles className="w-16 h-16 text-white/50" /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-lg p-6 shadow-md border border-gray-100">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setRecsOpen(!recsOpen)}>
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg"><Lightbulb className="w-5 h-5 text-purple-600" /></div>
              <h2 className="ml-3 text-xl font-semibold text-gray-900">Personalized Recommendations</h2>
            </div>
            {recsOpen ? <ChevronUp className="w-5 h-5 text-gray-600" /> : <ChevronDown className="w-5 h-5 text-gray-600" />}
          </div>
          {recsOpen && (
            <div className="mt-4 space-y-3">
              {recommendations.map((rec, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-purple-50/50 rounded-lg">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-1.5 flex-shrink-0"></div>
                  {parseRecommendation(rec)}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Link to="/diary" className="group block bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center">
              <BookOpen className="w-8 h-8 mr-4 group-hover:scale-110 transition-transform" />
              <div>
                <h3 className="text-lg font-semibold">Write in Diary</h3>
                <p className="text-blue-100 text-sm">Express your thoughts and feelings</p>
              </div>
            </div>
          </Link>
          <Link to="/community" className="group block bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center">
              <Users className="w-8 h-8 mr-4 group-hover:scale-110 transition-transform" />
              <div>
                <h3 className="text-lg font-semibold">Community Support</h3>
                <p className="text-green-100 text-sm">Connect with others anonymously</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
      
      <QuickChatInput />
    </div>
  );
}