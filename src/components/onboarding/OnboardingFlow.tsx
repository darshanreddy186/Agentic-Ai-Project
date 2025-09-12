import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';
import { Heart, Sparkles } from 'lucide-react';

interface OnboardingData {
  name: string;
  age: number;
  gender: string;
  dateOfBirth: string;
}

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { user } = useUser();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    name: '',
    age: 0,
    gender: '',
    dateOfBirth: ''
  });

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    if (!user) return;

    const avatarType = `${data.gender.toLowerCase()}_${data.age < 13 ? 'child' : data.age < 18 ? 'teen' : 'young_adult'}`;

    try {
      await supabase.from('profiles').insert({
        clerk_user_id: user.id,
        name: data.name,
        age: data.age,
        gender: data.gender,
        date_of_birth: data.dateOfBirth,
        avatar_type: avatarType
      });

      // Award first achievement
      await supabase.from('achievements').insert({
        user_id: user.id,
        badge_type: 'welcome',
        title: 'Welcome Aboard! 🎉',
        description: 'Completed your profile setup'
      });

    } catch (error) {
      console.log('Error saving profile:', error);
    }
    onComplete();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 max-w-md w-full shadow-xl border border-white/20"
      >
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="inline-block mb-4"
          >
            <Sparkles className="w-12 h-12 text-purple-500" />
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome to MindBloom! 🌸</h1>
          <p className="text-gray-600">Let's get to know you better</p>
          <div className="flex justify-center mt-4 space-x-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${
                  i <= step ? 'bg-purple-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          {step === 1 && (
            <div className="space-y-4">
              <label className="block text-gray-700 font-medium">What's your name? ✨</label>
              <input
                type="text"
                value={data.name}
                onChange={(e) => setData({ ...data, name: e.target.value })}
                className="w-full p-4 border-2 border-purple-200 rounded-2xl focus:border-purple-500 focus:outline-none transition-colors"
                placeholder="Enter your name"
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <label className="block text-gray-700 font-medium">How old are you? 🎂</label>
              <input
                type="number"
                value={data.age || ''}
                onChange={(e) => setData({ ...data, age: parseInt(e.target.value) || 0 })}
                className="w-full p-4 border-2 border-purple-200 rounded-2xl focus:border-purple-500 focus:outline-none transition-colors"
                placeholder="Enter your age"
                min="10"
                max="25"
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <label className="block text-gray-700 font-medium">Gender 🌈</label>
              <div className="grid grid-cols-2 gap-4">
                {['Male', 'Female', 'Non-binary', 'Prefer not to say'].map((gender) => (
                  <button
                    key={gender}
                    onClick={() => setData({ ...data, gender })}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      data.gender === gender
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    {gender}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <label className="block text-gray-700 font-medium">Date of Birth 📅</label>
              <input
                type="date"
                value={data.dateOfBirth}
                onChange={(e) => setData({ ...data, dateOfBirth: e.target.value })}
                className="w-full p-4 border-2 border-purple-200 rounded-2xl focus:border-purple-500 focus:outline-none transition-colors"
              />
            </div>
          )}
        </motion.div>

        <motion.button
          onClick={handleNext}
          disabled={
            (step === 1 && !data.name) ||
            (step === 2 && !data.age) ||
            (step === 3 && !data.gender) ||
            (step === 4 && !data.dateOfBirth)
          }
          className="w-full mt-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-2xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {step === 4 ? (
            <span className="flex items-center justify-center gap-2">
              Complete Setup <Heart className="w-5 h-5" />
            </span>
          ) : (
            'Next'
          )}
        </motion.button>
      </motion.div>
    </div>
  );
}