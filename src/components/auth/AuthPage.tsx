import React from 'react';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { Heart, Sparkles, Star, Flower } from 'lucide-react';
import { useState } from 'react';

export function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-indigo-100 relative overflow-hidden">
      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 5, 0]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute top-20 left-20"
        >
          <Heart className="w-8 h-8 text-pink-300" />
        </motion.div>
        
        <motion.div
          animate={{ 
            y: [0, 15, 0],
            rotate: [0, -5, 0]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute top-40 right-32"
        >
          <Star className="w-6 h-6 text-yellow-300" />
        </motion.div>
        
        <motion.div
          animate={{ 
            y: [0, -10, 0],
            rotate: [0, 10, 0]
          }}
          transition={{ 
            duration: 5, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute bottom-32 left-32"
        >
          <Flower className="w-10 h-10 text-purple-300" />
        </motion.div>
        
        <motion.div
          animate={{ 
            y: [0, 20, 0],
            rotate: [0, -8, 0]
          }}
          transition={{ 
            duration: 3.5, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 0.5
          }}
          className="absolute bottom-20 right-20"
        >
          <Sparkles className="w-7 h-7 text-indigo-300" />
        </motion.div>
      </div>

      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="flex flex-col lg:flex-row items-center gap-12 max-w-6xl w-full">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex-1 text-center lg:text-left"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 200, 
                damping: 10,
                delay: 0.3
              }}
              className="inline-block mb-6"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full blur-xl opacity-30"
                />
                <div className="relative bg-white/80 backdrop-blur-sm p-6 rounded-full">
                  <Sparkles className="w-16 h-16 text-purple-500" />
                </div>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-5xl lg:text-6xl font-bold text-gray-800 mb-6"
            >
              Welcome to{' '}
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                MindBloom
              </span>
              <span className="text-4xl">🌸</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="text-xl text-gray-600 mb-8 leading-relaxed max-w-2xl"
            >
              Your personal space for mental wellness, growth, and self-discovery. 
              Join a supportive community where your thoughts matter and your journey is celebrated. ✨
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl"
            >
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="text-2xl mb-2">📖</div>
                <h3 className="font-semibold text-gray-800 mb-1">Daily Journaling</h3>
                <p className="text-sm text-gray-600">Express yourself freely with AI-powered insights</p>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="text-2xl mb-2">🤖</div>
                <h3 className="font-semibold text-gray-800 mb-1">AI Companion</h3>
                <p className="text-sm text-gray-600">Get personalized support and guidance</p>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="text-2xl mb-2">🎮</div>
                <h3 className="font-semibold text-gray-800 mb-1">Gamified Growth</h3>
                <p className="text-sm text-gray-600">Track progress with achievements and rewards</p>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="text-2xl mb-2">💝</div>
                <h3 className="font-semibold text-gray-800 mb-1">Safe Community</h3>
                <p className="text-sm text-gray-600">Connect anonymously with supportive peers</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Auth Section */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex-shrink-0"
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20 min-w-[400px]">
              {/* Toggle Buttons */}
              <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
                <button
                  onClick={() => setIsSignUp(false)}
                  className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all ${
                    !isSignUp
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setIsSignUp(true)}
                  className={`flex-1 py-3 px-6 rounded-xl font-medium transition-all ${
                    isSignUp
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Clerk Components */}
              <div className="clerk-container">
                {isSignUp ? (
                  <SignUp 
                    appearance={{
                      elements: {
                        rootBox: "w-full",
                        card: "bg-transparent shadow-none",
                        headerTitle: "text-2xl font-bold text-gray-800",
                        headerSubtitle: "text-gray-600",
                        socialButtonsBlockButton: "bg-white border-2 border-gray-200 hover:border-purple-300 text-gray-700 rounded-xl",
                        formButtonPrimary: "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl",
                        formFieldInput: "rounded-xl border-2 border-gray-200 focus:border-purple-400",
                        footerActionLink: "text-purple-600 hover:text-purple-700"
                      }
                    }}
                    redirectUrl="/onboarding"
                  />
                ) : (
                  <SignIn 
                    appearance={{
                      elements: {
                        rootBox: "w-full",
                        card: "bg-transparent shadow-none",
                        headerTitle: "text-2xl font-bold text-gray-800",
                        headerSubtitle: "text-gray-600",
                        socialButtonsBlockButton: "bg-white border-2 border-gray-200 hover:border-purple-300 text-gray-700 rounded-xl",
                        formButtonPrimary: "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl",
                        formFieldInput: "rounded-xl border-2 border-gray-200 focus:border-purple-400",
                        footerActionLink: "text-purple-600 hover:text-purple-700"
                      }
                    }}
                    redirectUrl="/dashboard"
                  />
                )}
              </div>
            </div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="mt-6 text-center"
            >
              <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Secure & Private</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>GDPR Compliant</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>Youth Focused</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}