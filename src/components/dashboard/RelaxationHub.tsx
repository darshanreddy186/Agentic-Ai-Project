import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wind, Waves, TreePine, Play, Pause, Volume2 } from 'lucide-react';

export function RelaxationHub() {
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [breathingActive, setBreathingActive] = useState(false);

  const soundscapes = [
    { id: 'rain', name: 'Gentle Rain', icon: Wind, color: 'from-blue-400 to-cyan-400' },
    { id: 'ocean', name: 'Ocean Waves', icon: Waves, color: 'from-teal-400 to-blue-400' },
    { id: 'forest', name: 'Forest Sounds', icon: TreePine, color: 'from-green-400 to-emerald-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Breathing Circle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 text-center"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Breathing Exercise 🌐</h2>
        
        <div className="relative flex items-center justify-center mb-8">
          <motion.div
            animate={breathingActive ? {
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.7, 0.3]
            } : { scale: 1, opacity: 0.3 }}
            transition={breathingActive ? {
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            } : {}}
            className="w-48 h-48 rounded-full bg-gradient-to-br from-purple-400 to-pink-400"
          />
          <motion.div
            animate={breathingActive ? {
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            } : { scale: 1, opacity: 0.5 }}
            transition={breathingActive ? {
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            } : {}}
            className="absolute w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500"
          />
          <motion.div
            animate={breathingActive ? {
              scale: [1, 1.1, 1],
              opacity: [0.8, 1, 0.8]
            } : { scale: 1, opacity: 0.8 }}
            transition={breathingActive ? {
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            } : {}}
            className="absolute w-16 h-16 rounded-full bg-white flex items-center justify-center text-purple-600 font-bold"
          >
            {breathingActive ? (
              <span className="text-sm">Breathe</span>
            ) : (
              <Wind className="w-8 h-8" />
            )}
          </motion.div>
        </div>
        
        <motion.button
          onClick={() => setBreathingActive(!breathingActive)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`px-8 py-3 rounded-2xl font-medium transition-all ${
            breathingActive
              ? 'bg-red-500 text-white'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
          }`}
        >
          {breathingActive ? 'Stop' : 'Start'} Breathing Exercise
        </motion.button>
        
        {breathingActive && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-gray-600"
          >
            Follow the circle: Inhale as it grows, exhale as it shrinks 🧘‍♀️
          </motion.p>
        )}
      </motion.div>

      {/* Soundscapes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20"
      >
        <h3 className="text-xl font-bold text-gray-800 mb-6 text-center flex items-center justify-center gap-2">
          <Volume2 className="w-6 h-6 text-purple-500" />
          Calming Soundscapes 🎵
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {soundscapes.map((sound) => {
            const Icon = sound.icon;
            const isActive = activeSound === sound.id;
            
            return (
              <motion.button
                key={sound.id}
                onClick={() => setActiveSound(isActive ? null : sound.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-6 rounded-2xl text-white font-medium transition-all ${
                  isActive ? 'ring-4 ring-white shadow-lg' : 'hover:shadow-lg'
                } bg-gradient-to-br ${sound.color}`}
              >
                <Icon className="w-8 h-8 mx-auto mb-3" />
                <div className="text-sm mb-3">{sound.name}</div>
                <div className="flex items-center justify-center">
                  {isActive ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                </div>
                
                {isActive && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="mt-3 h-1 bg-white/50 rounded-full"
                  />
                )}
              </motion.button>
            );
          })}
        </div>
        
        {activeSound && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-purple-50 rounded-2xl text-center"
          >
            <p className="text-purple-700 font-medium">
              Enjoy the peaceful sounds and let your mind relax 🧘‍♀️✨
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}