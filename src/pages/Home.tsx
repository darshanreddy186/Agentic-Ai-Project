import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase, DiaryEntry, UserProfile } from '../lib/supabase';
import { Calendar, TrendingUp, MessageCircle, Lightbulb, BookOpen, Users, Sparkles } from 'lucide-react';

export function Home() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEntries: 0,
    streakDays: 0
  });

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const [profileRes, summaryRes, allEntriesRes] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('user_ai_summaries').select('recommendations').eq('user_id', user.id).maybeSingle(),
        supabase.from('diary_entries').select('created_at', { count: 'exact' }).eq('user_id', user.id)
      ]);

      setProfile(profileRes.data);
      
      const allEntries = allEntriesRes.data || [];
      const totalEntries = allEntriesRes.count || 0;
      
      if (totalEntries > 0) {
        const streakDays = calculateStreakDays(allEntries);
        setStats({ totalEntries, streakDays });
      }

      const summaryData = summaryRes.data;
      if (summaryData && summaryData.recommendations && summaryData.recommendations.length > 0) {
        setRecommendations(summaryData.recommendations);
      } else {
        setRecommendations(["Write your first diary entry to get personalized recommendations!"]);
      }

    } catch (error: any) {
      console.error('Error loading user data:', error.message);
      setRecommendations(["Could not load recommendations."]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreakDays = (entries: Pick<DiaryEntry, 'created_at'>[]): number => {
    if (entries.length === 0) return 0;
    const uniqueDays = [...new Set(entries.map(e => new Date(e.created_at).toDateString()))];
    uniqueDays.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    if (uniqueDays.length === 0) return 0;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) return 0;
    let streak = 1;
    for (let i = 0; i < uniqueDays.length - 1; i++) {
      const currentDate = new Date(uniqueDays[i]);
      const prevDate = new Date(uniqueDays[i+1]);
      const diffDays = Math.round((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) streak++;
      else break;
    }
    return streak;
  };

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
    <div className="max-w-6xl mx-auto space-y-8 p-4 md:p-0">
      <div className="bg-gradient-to-r from-blue-500 to-green-500 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back{profile?.display_name ? `, ${profile.display_name}` : ''}!</h1>
            <p className="text-blue-100">Ready to continue your wellness journey today?</p>
          </div>
          <div className="hidden md:block"><Sparkles className="w-16 h-16 text-blue-200" /></div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg"><BookOpen className="w-6 h-6 text-blue-600" /></div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Entries</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalEntries}</p>
            </div>
          </div>
        </div>
        <a href="/ai-chat" className="bg-white rounded-lg p-6 shadow-md border border-gray-100 hover:bg-gray-50 transition-all">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg"><MessageCircle className="w-6 h-6 text-purple-600" /></div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">AI Chat</p>
              <p className="text-xl font-bold text-gray-900">Talk to Gemini</p>
            </div>
          </div>
        </a>
        <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg"><TrendingUp className="w-6 h-6 text-orange-600" /></div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Writing Streak</p>
              <p className="text-2xl font-bold text-gray-900">{stats.streakDays} days</p>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
        <div className="flex items-center mb-4">
          <div className="p-2 bg-purple-100 rounded-lg"><Lightbulb className="w-5 h-5 text-purple-600" /></div>
          <h2 className="ml-3 text-xl font-semibold text-gray-900">Personalized Recommendations</h2>
        </div>
        <div className="space-y-3">
          {recommendations.map((rec, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
              <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
              {parseRecommendation(rec)}
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <a href="/diary" className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105 block">
          <div className="flex items-center">
            <BookOpen className="w-8 h-8 mr-4" />
            <div>
              <h3 className="text-lg font-semibold">Write in Diary</h3>
              <p className="text-blue-100">Express your thoughts and feelings</p>
            </div>
          </div>
        </a>
        <a href="/community" className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105 block">
          <div className="flex items-center">
            <Users className="w-8 h-8 mr-4" />
            <div>
              <h3 className="text-lg font-semibold">Community Support</h3>
              <p className="text-green-100">Connect with others anonymously</p>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
}