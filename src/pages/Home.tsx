import React, { useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Camera, Send, ChevronLeft, ChevronRight, Sparkles, TrendingUp, Heart, Brain } from 'lucide-react';
import { PersonalizedRecommendations } from '../components/PersonalizedRecommendations.tsx'; // Make sure this path is correct

// --- Type Definitions for our data structures ---
interface Story {
  title: string;
  description: string;
  image: string;
  category: string;
  readTime: string;
}

// --- Mock Data ---
const mockStories: Story[] = [
  {
    title: 'The Calm River',
    description: 'Finding peace in the flow of nature and mindful breathing.',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760c0341?q=80&w=1000&auto=format&fit=crop',
    category: 'Mindfulness',
    readTime: '3 min'
  },
  {
    title: 'Mountain of Resilience',
    description: 'Overcoming challenges and building unshakeable confidence.',
    image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=1000&auto=format&fit=crop',
    category: 'Growth',
    readTime: '5 min'
  },
  {
    title: 'Garden of Gratitude',
    description: 'Cultivating daily practices that transform your mindset.',
    image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=1000&auto=format&fit=crop',
    category: 'Wellness',
    readTime: '4 min'
  },
  {
    title: 'Ocean of Possibilities',
    description: 'Dive deep into your potential and discover hidden strengths.',
    image: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?q=80&w=1000&auto=format&fit=crop',
    category: 'Inspiration',
    readTime: '6 min'
  },
];

// --- Components ---

// Props type for StoryCarousel
interface StoryCarouselProps {
  stories: Story[];
  onClick: (index: number) => void;
}

function StoryCarousel({ stories, onClick }: StoryCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === stories.length - 1 ? 0 : prevIndex + 1
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [stories.length, isAutoPlaying]);

  const goToNext = () => {
    setCurrentIndex(currentIndex === stories.length - 1 ? 0 : currentIndex + 1);
  };

  const goToPrev = () => {
    setCurrentIndex(currentIndex === 0 ? stories.length - 1 : currentIndex - 1);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div
      className="bg-white rounded-2xl shadow-lg overflow-hidden group"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      <div className="relative h-80 overflow-hidden">
        <div
          className="flex transition-transform duration-700 ease-in-out h-full"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {stories.map((story, index) => (
            <div
              key={index}
              className="min-w-full h-full relative cursor-pointer"
              onClick={() => onClick(index)}
            >
              <img
                src={story.image}
                alt={story.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium">
                    {story.category}
                  </span>
                  <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium">
                    {story.readTime}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2">{story.title}</h3>
                <p className="text-gray-200 text-sm line-clamp-2">{story.description}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); goToPrev(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-all opacity-0 group-hover:opacity-100"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); goToNext(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-all opacity-0 group-hover:opacity-100"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {stories.map((_, index) => (
            <button
              key={index}
              onClick={(e) => { e.stopPropagation(); goToSlide(index); }}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-500" />
          Inspiring Stories
        </h3>
        <p className="text-gray-600 text-sm">
          Swipe through curated stories that inspire growth and wellness
        </p>
      </div>
    </div>
  );
}

// --- Main Home Component ---
export function Home() {
  const navigate = useNavigate();
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = chatInput.trim();
    if (trimmedInput) {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        navigate('/ai-chat', {
          state: { initialMessage: trimmedInput }
        });
        setChatInput('');
      }, 1000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleChatSubmit(e);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-48 h-48 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-40 left-1/4 w-64 h-64 bg-gradient-to-r from-green-400/20 to-teal-400/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-8 sm:p-12 rounded-3xl shadow-2xl overflow-hidden group mb-8">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-pulse"></div>
            </div>
            
            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center">
              <div className="mb-6 lg:mb-0">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  Welcome back! ✨
                </h1>
                <p className="text-xl sm:text-2xl opacity-90 font-light max-w-2xl">
                  Ready to continue your wellness journey and unlock your potential today?
                </p>
                <div className="mt-6 flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">12 days streak</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-medium">Progress: +25%</span>
                  </div>
                </div>
              </div>
              
              <div className="relative">
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500">
                  <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-300 animate-spin" style={{animationDuration: '8s'}} />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-pink-400 to-red-400 rounded-full animate-bounce"></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-24">
            <div className="lg:col-span-2">
              <PersonalizedRecommendations />
            </div>

            <div className="space-y-8">
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/50">
                <h3 className="font-bold text-xl mb-6 text-gray-900 flex items-center gap-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                  Quick Actions
                </h3>
                <div className="space-y-4">
                  <Link 
                    to="/diary" 
                    className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 group border border-gray-100 hover:border-blue-200 hover:shadow-lg"
                  >
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg text-white group-hover:scale-110 transition-transform">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <span className="font-medium text-gray-900">Write in Diary</span>
                      <p className="text-xs text-gray-500 mt-1">Reflect on your day</p>
                    </div>
                  </Link>
                  
                  <Link 
                    to="/community" 
                    className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gradient-to-r hover:from-green-50 hover:to-teal-50 transition-all duration-300 group border border-gray-100 hover:border-green-200 hover:shadow-lg"
                  >
                    <div className="p-2 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg text-white group-hover:scale-110 transition-transform">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <span className="font-medium text-gray-900">Community Support</span>
                      <p className="text-xs text-gray-500 mt-1">Connect with others</p>
                    </div>
                  </Link>
                </div>
              </div>
              
              <StoryCarousel 
                stories={mockStories} 
                onClick={(index) => {
                  console.log(`Clicked story: ${mockStories[index].title}`);
                  alert(`Opening "${mockStories[index].title}" - ${mockStories[index].description}`);
                }}
              />
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white/90 via-white/80 to-transparent backdrop-blur-lg z-50">
            <form onSubmit={handleChatSubmit} className="relative max-w-4xl mx-auto">
              <div className="flex items-center gap-3 bg-white/90 backdrop-blur-xl text-gray-800 p-3 rounded-2xl shadow-2xl border border-white/50 hover:shadow-3xl transition-all duration-300">
                <div className="flex items-center gap-2 pl-2">
                  <div className={`w-3 h-3 rounded-full transition-colors ${isTyping ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className="text-gray-500 font-medium">AI</span>
                </div>
                
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Tell me about your day or ask me anything..."
                  className="flex-1 bg-transparent focus:outline-none placeholder-gray-500 text-gray-800 font-medium"
                  disabled={isTyping}
                />
                
                <div className="flex items-center gap-2">
                  <button 
                    type="button" 
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors group"
                    title="Add photo"
                    onClick={() => alert('Photo feature coming soon!')}
                  >
                    <Camera className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
                  </button>
                  
                  <button 
                    type="submit"
                    disabled={!chatInput.trim() || isTyping}
                    className={`p-3 rounded-xl transition-all duration-300 ${
                      chatInput.trim() && !isTyping
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105' 
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isTyping ? (
                      <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              
              {isTyping && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border border-white/50">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <span>Preparing your message...</span>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}