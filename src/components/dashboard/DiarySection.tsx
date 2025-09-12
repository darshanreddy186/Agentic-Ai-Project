import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, DiaryEntry } from '../../lib/supabase';
import { analyzeMood } from '../../lib/gemini';
import { PlusCircle, Heart, Smile, Meh, Frown, Calendar, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { format } from 'date-fns';

interface DiarySectionProps {
  diaryEntries: DiaryEntry[];
  onNewEntry: () => void;
  onAchievementUnlocked: () => void;
}

export function DiarySection({ diaryEntries, onNewEntry, onAchievementUnlocked }: DiarySectionProps) {
  const { user } = useUser();
  const [isWriting, setIsWriting] = useState(false);
  const [newEntry, setNewEntry] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSubmitEntry = async () => {
    if (!user || !newEntry.trim()) return;

    setIsAnalyzing(true);
    
    try {
      // Analyze mood with AI
      const { score, analysis } = await analyzeMood(newEntry);

      // Save to database
      await supabase.from('diary_entries').insert({
        user_id: user.id,
        content: newEntry,
        mood_score: score,
        ai_analysis: analysis
      });

      // Check for achievements
      const entryCount = diaryEntries.length + 1;
      if (entryCount === 1) {
        await supabase.from('achievements').insert({
          user_id: user.id,
          badge_type: 'first_entry',
          title: 'First Steps! 🌱',
          description: 'Wrote your very first diary entry'
        });
        confetti();
        onAchievementUnlocked();
      } else if (entryCount === 7) {
        await supabase.from('achievements').insert({
          user_id: user.id,
          badge_type: 'week_streak',
          title: 'One Week Strong! 💪',
          description: 'Completed 7 diary entries'
        });
        confetti();
        onAchievementUnlocked();
      }

      setNewEntry('');
      setIsWriting(false);
      onNewEntry();
    } catch (error) {
      console.error('Error saving diary entry:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getMoodEmoji = (score?: number) => {
    if (!score) return <Meh className="w-5 h-5" />;
    if (score >= 8) return <Smile className="w-5 h-5 text-green-500" />;
    if (score >= 6) return <Meh className="w-5 h-5 text-yellow-500" />;
    return <Frown className="w-5 h-5 text-red-500" />;
  };

  return (
    <div className="space-y-6">
      {/* New Entry Button */}
      {!isWriting && (
        <motion.button
          onClick={() => setIsWriting(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-3xl flex items-center justify-center gap-3 font-medium text-lg shadow-lg hover:shadow-xl transition-all"
        >
          <PlusCircle className="w-6 h-6" />
          Write in your diary today ✨
        </motion.button>
      )}

      {/* Writing Interface */}
      <AnimatePresence>
        {isWriting && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20"
          >
            <div className="flex items-center gap-3 mb-6">
              <Heart className="w-6 h-6 text-pink-500" />
              <h2 className="text-xl font-bold text-gray-800">What's on your mind? 💭</h2>
            </div>
            
            <textarea
              value={newEntry}
              onChange={(e) => setNewEntry(e.target.value)}
              placeholder="Express yourself freely... Your thoughts, feelings, experiences, or anything else you'd like to share! 🌸"
              className="w-full h-40 p-4 border-2 border-purple-200 rounded-2xl focus:border-purple-500 focus:outline-none resize-none text-gray-700"
            />
            
            <div className="flex gap-3 mt-6">
              <motion.button
                onClick={handleSubmitEntry}
                disabled={!newEntry.trim() || isAnalyzing}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-2xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Sparkles className="w-5 h-5 animate-spin" />
                    Analyzing with AI...
                  </>
                ) : (
                  'Save Entry'
                )}
              </motion.button>
              
              <motion.button
                onClick={() => {
                  setIsWriting(false);
                  setNewEntry('');
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-2xl font-medium"
              >
                Cancel
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Diary Entries */}
      <div className="space-y-4">
        {diaryEntries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 text-gray-500"
          >
            <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Your diary is waiting for your first story! ✨</p>
          </motion.div>
        ) : (
          diaryEntries.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/20"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-purple-500" />
                  <span className="text-gray-600 font-medium">
                    {format(new Date(entry.created_at), 'MMMM dd, yyyy')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {getMoodEmoji(entry.mood_score)}
                  <span className="text-sm text-gray-500">
                    Mood: {entry.mood_score}/10
                  </span>
                </div>
              </div>
              
              <p className="text-gray-700 mb-4 leading-relaxed">{entry.content}</p>
              
              {entry.ai_analysis && (
                <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span className="text-purple-700 font-medium text-sm">AI Insight</span>
                  </div>
                  <p className="text-purple-600 text-sm">{entry.ai_analysis}</p>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}