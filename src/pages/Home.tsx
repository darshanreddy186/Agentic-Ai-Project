import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase, DiaryEntry, UserProfile } from '../lib/supabase';
import { Calendar, TrendingUp, Heart, Lightbulb, BookOpen, Users, Sparkles } from 'lucide-react';

// NO MORE GEMINI AI ON THE HOME PAGE - IT'S MUCH FASTER NOW!

export function Home() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recentEntries, setRecentEntries] = useState<DiaryEntry[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEntries: 0,
    avgMoodScore: 0,
    streakDays: 0
  });

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  // --- UPDATED: `loadUserData` is now much simpler and faster ---
  const loadUserData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const [profileRes, entriesRes, summaryRes, allEntriesRes] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('diary_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
        // We only need the recommendations column now!
        supabase.from('user_ai_summaries').select('recommendations').eq('user_id', user.id).maybeSingle(),
        supabase.from('diary_entries').select('created_at, mood_score', { count: 'exact' }).eq('user_id', user.id)
      ]);

      setProfile(profileRes.data);
      setRecentEntries(entriesRes.data || []);
      
      const allEntries = allEntriesRes.data || [];
      const totalEntries = allEntriesRes.count || 0;
      
      if (totalEntries > 0) {
        const avgMoodScore = allEntries.reduce((sum, entry) => sum + entry.mood_score, 0) / totalEntries;
        const streakDays = calculateStreakDays(allEntries);
        setStats({ totalEntries, avgMoodScore: Math.round(avgMoodScore * 10) / 10, streakDays });
      }

      // Directly set recommendations from the database
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

  const getMoodColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-50';
    if (score >= 6) return 'text-yellow-600 bg-yellow-50';
    if (score >= 4) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // --- JSX is simplified as we no longer need a separate `recsLoading` state ---
  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4 md:p-0">
      <div className="bg-gradient-to-r from-blue-500 to-green-500 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div><h1 className="text-3xl font-bold mb-2">Welcome back{profile?.display_name ? `, ${profile.display_name}` : ''}!</h1><p className="text-blue-100">Ready to continue your wellness journey today?</p></div>
          <div className="hidden md:block"><Sparkles className="w-16 h-16 text-blue-200" /></div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100"><div className="flex items-center"><div className="p-3 bg-blue-100 rounded-lg"><BookOpen className="w-6 h-6 text-blue-600" /></div><div className="ml-4"><p className="text-sm text-gray-600">Total Entries</p><p className="text-2xl font-bold text-gray-900">{stats.totalEntries}</p></div></div></div>
        <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100"><div className="flex items-center"><div className="p-3 bg-green-100 rounded-lg"><Heart className="w-6 h-6 text-green-600" /></div><div className="ml-4"><p className="text-sm text-gray-600">Average Mood</p><p className="text-2xl font-bold text-gray-900">{stats.avgMoodScore > 0 ? `${stats.avgMoodScore}/10` : 'N/A'}</p></div></div></div>
        <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100"><div className="flex items-center"><div className="p-3 bg-orange-100 rounded-lg"><TrendingUp className="w-6 h-6 text-orange-600" /></div><div className="ml-4"><p className="text-sm text-gray-600">Writing Streak</p><p className="text-2xl font-bold text-gray-900">{stats.streakDays} days</p></div></div></div>
      </div>
      <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
        <div className="flex items-center mb-4"><div className="p-2 bg-purple-100 rounded-lg"><Lightbulb className="w-5 h-5 text-purple-600" /></div><h2 className="ml-3 text-xl font-semibold text-gray-900">Personalized Recommendations</h2></div>
        <div className="space-y-3">{recommendations.map((rec, index) => (<div key={index} className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg"><div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div><p className="text-gray-700 flex-1">{rec}</p></div>))}</div>
      </div>
      {recentEntries.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center"><Calendar className="w-5 h-5 mr-2 text-blue-600" />Recent Journal Entries</h2>
          <div className="space-y-4">{recentEntries.map((entry) => (<div key={entry.id} className="border-l-4 border-blue-200 pl-4 py-2"><div className="flex items-center justify-between mb-1"><h3 className="font-medium text-gray-900">{entry.title}</h3><div className={`px-2 py-1 rounded text-xs font-medium ${getMoodColor(entry.mood_score)}`}>Mood: {entry.mood_score}/10</div></div><p className="text-gray-600 text-sm line-clamp-2" dangerouslySetInnerHTML={{ __html: entry.content.substring(0, 200) + '...' }} /><p className="text-xs text-gray-400 mt-1">{new Date(entry.created_at).toLocaleDateString()}</p></div>))}</div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <a href="/diary" className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105 block"><div className="flex items-center"><BookOpen className="w-8 h-8 mr-4" /><div><h3 className="text-lg font-semibold">Write in Diary</h3><p className="text-blue-100">Express your thoughts and feelings</p></div></div></a>
        <a href="/community" className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105 block"><div className="flex items-center"><Users className="w-8 h-8 mr-4" /><div><h3 className="text-lg font-semibold">Community Support</h3><p className="text-green-100">Connect with others anonymously</p></div></div></a>
      </div>
    </div>
  );
}