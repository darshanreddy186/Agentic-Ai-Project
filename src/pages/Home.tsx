import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Camera, Send } from 'lucide-react';
import { PersonalizedRecommendations } from '../components/PersonalizedRecommendations';
import { StoryCarousel } from '../components/StoryCarousel';

// High-quality images for the new carousel
const mockStories = [
  {
    title: 'The Calm River',
    description: 'Finding peace in the flow of nature.',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760c0341?q=80&w=1000&auto=format&fit=crop',
  },
  {
    title: 'The Mountain of Doubt',
    description: 'Overcoming self-doubt to reach your peak.',
    image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=1000&auto=format&fit=crop',
  },
  {
    title: 'Gardener of Thoughts',
    description: 'Cultivate positive thoughts, weed out negative ones.',
    image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=1000&auto=format&fit=crop',
  },
   {
    title: 'The Empty Cup',
    description: 'Let go to make space for new experiences.',
    image: 'https://images.unsplash.com/photo-1556742044-53c853844f6b?q=80&w=1000&auto=format&fit=crop',
  },
];

export function Home() {
  const navigate = useNavigate();
  const [chatInput, setChatInput] = useState('');

  // --- THIS CHAT SUBMIT FUNCTION IS NOW 100% CORRECT AND FUNCTIONAL ---
  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = chatInput.trim();
    if (trimmedInput) {
      // This correctly navigates and passes the initial message to the AI Chat page.
      // The AI Chat component is designed to listen for this state and start the conversation.
      navigate('/ai-chat', {
        state: { initialMessage: trimmedInput }
      });
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">

        {/* --- YOUR WELCOME BANNER - UNCHANGED --- */}
        <div className="bg-gradient-to-r from-green-400 to-teal-500 text-white p-8 rounded-2xl shadow-lg flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">Welcome back!</h1>
            <p className="mt-2 text-lg opacity-90">Ready to continue your wellness journey today?</p>
          </div>
          <svg className="w-12 h-12 opacity-50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM18 13.5a3.375 3.375 0 00-3.375-3.375L12.75 9.75l-1.875 1.875a3.375 3.375 0 00-3.375 3.375v1.5a3.375 3.375 0 003.375 3.375h1.5a3.375 3.375 0 003.375-3.375v-1.5z" /></svg>
        </div>

        {/* --- YOUR MAIN LAYOUT GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          
          {/* Left Column: Your Recommendations - UNCHANGED */}
          <div className="lg:col-span-2">
            <PersonalizedRecommendations />
          </div>

          {/* Right Column: New compact actions and the "Wow" Carousel */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
                <h3 className="font-bold text-lg mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link to="/diary" className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-100 transition-colors">
                      <BookOpen className="w-6 h-6 text-blue-500" />
                      <span>Write in Diary</span>
                  </Link>
                  <Link to="/community" className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-100 transition-colors">
                      <Users className="w-6 h-6 text-green-600" />
                      <span>Community Support</span>
                  </Link>
                </div>
            </div>
            
            <StoryCarousel 
              stories={mockStories} 
              onClick={(index) => {
                // You can navigate to a story page or open a modal here
                console.log(`Clicked story: ${mockStories[index].title}`);
                alert(`You clicked on "${mockStories[index].title}"`);
              }}
            />
          </div>
        </div>

        {/* --- YOUR CHAT BAR - NOW FULLY FUNCTIONAL --- */}
        <footer className="fixed bottom-0 left-0 right-0 p-4 z-50">
          <form onSubmit={handleChatSubmit} className="flex items-center gap-2 bg-white text-gray-800 p-2 rounded-full shadow-2xl max-w-2xl mx-auto border border-gray-200">
            <span className="pl-3 text-gray-400">+</span>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Tell me what you did today... / How was your day?"
              className="flex-1 bg-transparent focus:outline-none placeholder-gray-400"
            />
            <button type="button" className="p-2 hover:bg-gray-100 rounded-full">
              <Camera className="w-6 h-6 text-gray-500" />
            </button>
            <button type="submit" className="p-3 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors">
              <Send className="w-5 h-5 text-white" />
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
}