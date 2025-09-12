import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase, Profile, DiaryEntry, Achievement } from '../../lib/supabase';
import { motion } from 'framer-motion';
import { Avatar } from '../common/Avatar';
import  DiarySection  from './DiarySection';
import { MoodWheel } from './MoodWheel';
import { GrowingPlant } from './GrowingPlant';
import { AchievementBadges } from './AchievementBadges';
import { RelaxationHub } from './RelaxationHub';
import { CommunityWall } from './CommunityWall';
import { AIChat } from './AIChat';
import { BookOpen, Heart, Users, Sparkles, MessageCircle } from 'lucide-react';

interface DashboardProps {
  profile: Profile;
}

export function Dashboard({ profile }: DashboardProps) {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [plantGrowth, setPlantGrowth] = useState(0);

  useEffect(() => {
    if (user) {
      fetchDiaryEntries();
      fetchAchievements();
    }
  }, [user]);

  const fetchDiaryEntries = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('diary_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (data) {
      setDiaryEntries(data);
      setPlantGrowth(Math.min(data.length * 10, 100));
    }
  };

  const fetchAchievements = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', user.id)
      .order('earned_at', { ascending: false });
    
    if (data) {
      setAchievements(data);
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Sparkles },
    { id: 'diary', label: 'My Diary', icon: BookOpen },
    { id: 'chat', label: 'AI Chat', icon: MessageCircle },
    { id: 'relax', label: 'Relax', icon: Heart },
    { id: 'community', label: 'Community', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/80 backdrop-blur-sm border-b border-white/20 p-6"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar avatarType={profile.avatar_type} size="md" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Welcome back, {profile.name}! 🌸
              </h1>
              <p className="text-gray-600">How are you feeling today?</p>
            </div>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-2xl font-medium"
          >
            Day {diaryEntries.length + 1} of your journey ✨
          </motion.div>
        </div>
      </motion.header>

      {/* Navigation */}
      <nav className="bg-white/60 backdrop-blur-sm border-b border-white/20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex space-x-8 overflow-x-auto py-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-purple-500 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-purple-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        {activeTab === 'dashboard' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <MoodWheel onMoodSelect={(mood) => console.log('Mood selected:', mood)} />
            <GrowingPlant growth={plantGrowth} />
            <AchievementBadges achievements={achievements} />
          </motion.div>
        )}

        {activeTab === 'diary' && (
          <DiarySection
            diaryEntries={diaryEntries}
            onNewEntry={fetchDiaryEntries}
            onAchievementUnlocked={fetchAchievements}
          />
        )}

        {activeTab === 'chat' && (
          <AIChat diaryEntries={diaryEntries} />
        )}

        {activeTab === 'relax' && <RelaxationHub />}

        {activeTab === 'community' && <CommunityWall />}
      </main>
    </div>
  );
}