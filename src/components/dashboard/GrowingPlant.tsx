import { motion } from 'framer-motion';
import { Leaf } from 'lucide-react';

interface GrowingPlantProps {
  growth: number; // 0-100
}

export function GrowingPlant({ growth }: GrowingPlantProps) {
  const getPlantStage = (growth: number) => {
    if (growth < 20) return { emoji: '🌱', stage: 'Seedling', message: 'Just getting started!' };
    if (growth < 40) return { emoji: '🌿', stage: 'Sprout', message: 'Growing stronger!' };
    if (growth < 60) return { emoji: '🌾', stage: 'Young Plant', message: 'Making great progress!' };
    if (growth < 80) return { emoji: '🌳', stage: 'Strong Tree', message: 'Flourishing beautifully!' };
    return { emoji: '🌸', stage: 'Blooming Tree', message: 'Fully bloomed and thriving!' };
  };

  const plant = getPlantStage(growth);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20"
    >
      <h3 className="text-xl font-bold text-gray-800 mb-6 text-center flex items-center justify-center gap-2">
        <Leaf className="w-6 h-6 text-green-500" />
        Your Growth Journey
      </h3>
      
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 10 }}
          className="text-8xl mb-4"
        >
          {plant.emoji}
        </motion.div>
        
        <h4 className="text-lg font-bold text-gray-800 mb-2">{plant.stage}</h4>
        <p className="text-gray-600 text-sm">{plant.message}</p>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{growth}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${growth}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="bg-gradient-to-r from-green-400 to-emerald-500 h-3 rounded-full"
          />
        </div>
      </div>
      
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Keep writing to help your plant grow! 🌱✨
        </p>
      </div>
    </motion.div>
  );
}