import { motion } from 'framer-motion';
import { Trophy, Award, Star, Heart, Zap, Target } from 'lucide-react';
import { Achievement } from '../../lib/supabase';

interface AchievementBadgesProps {
  achievements: Achievement[];
}

export function AchievementBadges({ achievements }: AchievementBadgesProps) {
  const getBadgeIcon = (badgeType: string) => {
    switch (badgeType) {
      case 'welcome': return Star;
      case 'first_entry': return Heart;
      case 'week_streak': return Zap;
      case 'month_streak': return Trophy;
      default: return Award;
    }
  };

  const getBadgeColor = (badgeType: string) => {
    switch (badgeType) {
      case 'welcome': return 'from-yellow-400 to-orange-400';
      case 'first_entry': return 'from-pink-400 to-rose-400';
      case 'week_streak': return 'from-purple-400 to-indigo-400';
      case 'month_streak': return 'from-green-400 to-emerald-400';
      default: return 'from-blue-400 to-cyan-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20"
    >
      <h3 className="text-xl font-bold text-gray-800 mb-6 text-center flex items-center justify-center gap-2">
        <Trophy className="w-6 h-6 text-yellow-500" />
        Your Achievements
      </h3>
      
      {achievements.length === 0 ? (
        <div className="text-center py-8">
          <Target className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm">
            Start your journey to unlock amazing achievements! 🎯
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {achievements.slice(0, 3).map((achievement, index) => {
            const Icon = getBadgeIcon(achievement.badge_type);
            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-2xl bg-gradient-to-r ${getBadgeColor(
                  achievement.badge_type
                )} text-white`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-8 h-8" />
                  <div>
                    <h4 className="font-bold text-sm">{achievement.title}</h4>
                    <p className="text-xs opacity-90">{achievement.description}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
          
          {achievements.length > 3 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center p-3 bg-gray-100 rounded-2xl"
            >
              <p className="text-sm text-gray-600">
                +{achievements.length - 3} more achievements! 🎉
              </p>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
}