import { useState } from 'react';
import { motion } from 'framer-motion';
import { Smile, Meh, Frown, Heart, Star, Sun } from 'lucide-react';

interface MoodWheelProps {
  onMoodSelect: (mood: string) => void;
}

export function MoodWheel({ onMoodSelect }: MoodWheelProps) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  const moods = [
    { name: 'Amazing', emoji: '😍', icon: Star, color: 'from-yellow-400 to-orange-400' },
    { name: 'Happy', emoji: '😊', icon: Smile, color: 'from-green-400 to-emerald-400' },
    { name: 'Good', emoji: '🙂', icon: Sun, color: 'from-blue-400 to-cyan-400' },
    { name: 'Okay', emoji: '😐', icon: Meh, color: 'from-gray-400 to-slate-400' },
    { name: 'Sad', emoji: '😢', icon: Frown, color: 'from-indigo-400 to-purple-400' },
    { name: 'Anxious', emoji: '😰', icon: Heart, color: 'from-pink-400 to-rose-400' },
  ];

  const handleMoodSelect = (mood: typeof moods[0]) => {
    setSelectedMood(mood.name);
    onMoodSelect(mood.name);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20"
    >
      <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">
        How are you feeling? 🎡
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        {moods.map((mood, index) => {
          const Icon = mood.icon;
          return (
            <motion.button
              key={mood.name}
              onClick={() => handleMoodSelect(mood)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, rotate: -180 }}
              animate={{ opacity: 1, rotate: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-2xl text-white font-medium transition-all ${
                selectedMood === mood.name
                  ? 'ring-4 ring-white shadow-lg'
                  : 'hover:shadow-lg'
              } bg-gradient-to-br ${mood.color}`}
            >
              <div className="text-2xl mb-2">{mood.emoji}</div>
              <div className="text-sm">{mood.name}</div>
            </motion.button>
          );
        })}
      </div>
      
      {selectedMood && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-purple-50 rounded-2xl text-center"
        >
          <p className="text-purple-700 font-medium">
            Thanks for sharing! Your mood has been noted. 💜
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}