import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase, Profile } from './lib/supabase';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { Dashboard } from './components/dashboard/Dashboard';
import { AuthPage } from './components/auth/AuthPage';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

function App() {
  const { isSignedIn, user, isLoaded } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    if (isSignedIn && user) {
      checkUserProfile();
    } else {
      setIsLoadingProfile(false);
    }
  }, [isSignedIn, user]);

  const checkUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('clerk_user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      }

      setProfile(data || null);
    } catch (error) {
      console.error('Error checking profile:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleOnboardingComplete = () => {
    checkUserProfile();
  };

  // Loading state
  if (!isLoaded || isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="inline-block mb-4"
          >
            <Sparkles className="w-12 h-12 text-purple-500" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">MindBloom 🌸</h2>
          <p className="text-gray-600">Loading your wellness journey...</p>
        </motion.div>
      </div>
    );
  }

  // Not signed in - show auth page
  if (!isSignedIn) {
    return <AuthPage />;
  }

  // Signed in but no profile - show onboarding
  if (!profile) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  // Signed in with profile - show main app
  return <Dashboard profile={profile} />;
}

export default App;