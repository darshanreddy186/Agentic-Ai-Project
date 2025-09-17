import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase'; // Make sure this path is correct
import { 
    BookOpen, Users, ChevronLeft, ChevronRight,
    MapPin, Phone, Mail, Twitter, Facebook, Instagram, Play, Pause,TrendingUp, RotateCcw, LoaderCircle,Sparkles, Send 
} from 'lucide-react';
import { PersonalizedRecommendations } from '../components/PersonalizedRecommendations.tsx'; // Make sure this path is correct
import { useAuth } from '../hooks/useAuth';

// --- Type Definitions ---
interface Story {
  id: string;
  title: string;
  imagelink: string;
  category: string;
}

interface DailyMotivation {
  name: string;
  quote: string;
  audiolink: string;
  imagelink: string;
  created_at: string;
}

// --- Helper Functions ---
const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds === 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// --- Child Components ---

function StoryCarousel() {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchStories = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('static_motivations')
          .select('id, title, imagelink, category')
          .limit(10);
        if (error) throw error;
        setStories(data || []);
      } catch (err: any) {
        setError("Could not fetch stories.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStories();
  }, []);
  
  useEffect(() => {
    if (stories.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev === stories.length - 1 ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(interval);
  }, [stories.length]);

  const goToNext = () => {
    if (stories.length === 0) return;
    setCurrentIndex(currentIndex === stories.length - 1 ? 0 : currentIndex + 1);
  };

  const goToPrev = () => {
    if (stories.length === 0) return;
    setCurrentIndex(currentIndex === 0 ? stories.length - 1 : currentIndex - 1);
  };

  if (isLoading) {
    return <div className="bg-white rounded-2xl shadow-lg flex items-center justify-center h-80"><LoaderCircle className="w-10 h-10 animate-spin text-indigo-500" /></div>;
  }
  
  if (error) {
    return <div className="bg-red-100/50 rounded-2xl shadow-lg flex items-center justify-center h-80 text-red-600 font-medium">{error}</div>;
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden group">
      <div className="relative h-80 overflow-hidden">
        <div className="flex transition-transform duration-700 ease-in-out h-full" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
          {stories.map((story) => (
            <Link to={`/story/${story.id}`} key={story.id} className="min-w-full h-full relative cursor-pointer block">
              <img src={story.imagelink} alt={story.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium">{story.category}</span>
                <h3 className="text-xl font-bold mt-2">{story.title}</h3>
              </div>
            </Link>
          ))}
        </div>
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); goToPrev(); }} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-all opacity-0 group-hover:opacity-100 z-10"><ChevronLeft className="w-5 h-5" /></button>
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); goToNext(); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-all opacity-0 group-hover:opacity-100 z-10"><ChevronRight className="w-5 h-5" /></button>
      </div>
    </div>
  );
}

function DailyMotivationPlayer() {
    const [motivation, setMotivation] = useState<DailyMotivation | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);
    const progressBarRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchDailyMotivation = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase.from('daily_motivation').select('*').order('created_at', { ascending: false }).limit(1).single();
                if (error) throw error;
                if (data) setMotivation(data); else throw new Error("No motivational story found for today.");
            } catch (err: any) { setError(err.message || "Failed to fetch daily motivation."); } finally { setIsLoading(false); }
        };
        fetchDailyMotivation();
    }, []);

    const togglePlayPause = () => {
        if (!audioRef.current) return;
        if (isPlaying) audioRef.current.pause(); else audioRef.current.play();
        setIsPlaying(!isPlaying);
    };
    const onTimeUpdate = () => { if (audioRef.current) setCurrentTime(audioRef.current.currentTime); };
    const onLoadedMetadata = () => { if (audioRef.current) setDuration(audioRef.current.duration); };
    const onProgressChange = () => { if (audioRef.current && progressBarRef.current) audioRef.current.currentTime = Number(progressBarRef.current.value); };
    const handleReplay = () => { if (audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play(); setIsPlaying(true); } };
    useEffect(() => { if(progressBarRef.current) progressBarRef.current.value = String(currentTime); }, [currentTime]);

    if (isLoading) return <div className="lg:col-span-2 bg-gray-200/50 backdrop-blur-sm p-8 rounded-2xl shadow-xl flex items-center justify-center h-[300px]"><LoaderCircle className="w-12 h-12 animate-spin text-indigo-500" /></div>;
    if (error || !motivation) return <div className="lg:col-span-2 bg-red-100/50 p-8 rounded-2xl shadow-xl h-[300px] text-center flex flex-col justify-center"><h3 className="text-xl font-bold text-red-700">Something Went Wrong</h3><p className="text-red-600 mt-2">{error || "Could not load today's motivation."}</p></div>;
    
    return (
        <div className="lg:col-span-2 rounded-2xl shadow-2xl overflow-hidden relative group h-[300px] border border-white/50">
            <img src={motivation.imagelink} alt={motivation.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"/>
            <div className="absolute inset-0 bg-black/60"></div>
            <div className="relative z-10 p-6 md:p-8 flex flex-col justify-between h-full text-white">
                <div>
                    <h2 className="text-sm font-bold uppercase tracking-widest text-indigo-300">Motivational Story of the Day</h2>
                    <blockquote className="mt-2"><p className="text-xl md:text-2xl font-bold italic">"{motivation.quote}"</p><cite className="block text-right mt-2 not-italic text-gray-300">- {motivation.name}</cite></blockquote>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-3 rounded-lg">
                    <audio ref={audioRef} src={motivation.audiolink} onTimeUpdate={onTimeUpdate} onLoadedMetadata={onLoadedMetadata} onEnded={() => setIsPlaying(false)} preload="metadata"/>
                    <div className="flex items-center gap-4">
                        <button onClick={togglePlayPause} className="p-2 bg-white/20 rounded-full hover:bg-white/30">{isPlaying ? <Pause className="w-6 h-6"/> : <Play className="w-6 h-6"/>}</button>
                        <span className="text-sm w-10 text-center">{formatTime(currentTime)}</span>
                        <input ref={progressBarRef} type="range" defaultValue="0" max={duration || 0} onChange={onProgressChange} className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-indigo-400" />
                        <span className="text-sm w-10 text-center">{formatTime(duration)}</span>
                        <button onClick={handleReplay} className="p-2 hover:bg-white/30 rounded-full" title="Replay"><RotateCcw className="w-5 h-5"/></button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Main Home Component ---
export function Home() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('user_profiles')
        .select('display_name, username')
        .eq('id', user.id)
        .single();
      if (data) setDisplayName(data.display_name || data.username || null);
    };
    fetchProfile();
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 relative overflow-x-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-48 h-48 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>
      <main className="relative z-10 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
            <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-8 sm:p-12 rounded-3xl shadow-2xl overflow-hidden group mb-8">
              <div className="absolute inset-0 opacity-10"><div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-pulse"></div></div>
              <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center">
                <div className="mb-6 lg:mb-0">
<h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
  Welcome back{displayName ? `, ${displayName}` : ''}! ✨
</h1>
                  <p className="text-xl sm:text-1xl opacity-90 font-light max-w-2xl">Ready to continue your wellness journey and unlock your potential today?</p>
                  <div className="mt-6 flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full"><div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div><span className="text-sm font-medium">12 days streak</span></div>
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full"><TrendingUp className="w-4 h-4" /><span className="text-sm font-medium">Progress: +25%</span></div>
                  </div>
                </div>
                <div className="relative">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500"><Sparkles className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-300 animate-spin" style={{animationDuration: '8s'}} /></div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-pink-400 to-red-400 rounded-full animate-bounce"></div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8"><PersonalizedRecommendations /><DailyMotivationPlayer /></div>
                <div className="space-y-8">
                    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/50">
                        <h3 className="font-bold text-xl mb-6 text-gray-900">Quick Actions</h3>
                        <div className="space-y-4">
                            <Link to="/diary" className="flex items-center gap-4 p-4 rounded-xl hover:bg-blue-50 border border-gray-100 hover:shadow-lg transition-all"><div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg text-white"><BookOpen className="w-5 h-5" /></div><div><span className="font-medium text-gray-900">Write in Diary</span></div></Link>
                            <Link to="/community" className="flex items-center gap-4 p-4 rounded-xl hover:bg-green-50 border border-gray-100 hover:shadow-lg transition-all"><div className="p-2 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg text-white"><Users className="w-5 h-5" /></div><div><span className="font-medium text-gray-900">Community Support</span></div></Link>
                        </div>
                    </div>
                    <StoryCarousel />
                </div>
            </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// --- UPDATED Footer Component ---
function Footer() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState<{type: 'idle' | 'success' | 'error', message: string}>({ type: 'idle', message: '' });

  // --- UPDATED Form Submission Handler ---
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormStatus({ type: 'idle', message: '' });

    // Use a more specific variable name for this endpoint
    const apiEndpoint = import.meta.env.VITE_API_FEEDBACK_ENDPOINT;

    if (!apiEndpoint) {
      console.error("VITE_API_FEEDBACK_ENDPOINT is not defined in your environment variables.");
      setFormStatus({ type: 'error', message: 'The contact form is not configured correctly.' });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // --- NEW: Simplified body to match your backend route ---
        body: JSON.stringify({
          name: name,
          email: email, // The user's email, so you can reply
          message: message,
          // Subject is optional as your backend provides a default
          subject: `New Contact Form Message from ${name}`
        }),
      });

      if (!response.ok) {
        throw new Error('Server responded with an error.');
      }

      setFormStatus({ type: 'success', message: 'Thank you! Your message has been sent.' });
      setName('');
      setEmail('');
      setMessage('');

    } catch (error) {
      console.error("Contact form submission error:", error);
      setFormStatus({ type: 'error', message: 'Something went wrong. Please try again later.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="relative bg-white/60 backdrop-blur-xl z-10 border-t border-gray-200/80 mt-12">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 text-gray-800">
          <div className="md:col-span-2 lg:col-span-1">
            <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Get in Touch</h3>
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <input type="text" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 bg-white/80 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all" required />
              <input type="email" placeholder="Your Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 bg-white/80 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all" required />
              <textarea placeholder="Your Message" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} className="w-full px-4 py-2 bg-white/80 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none transition-all" required></textarea>
              <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-purple-500/30 transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed">
                {isSubmitting ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
            {formStatus.type !== 'idle' && (
              <div className={`mt-4 text-sm p-3 rounded-lg ${formStatus.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {formStatus.message}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4 text-gray-900">Contact Us</h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start gap-3"><MapPin className="w-5 h-5 mt-1 text-indigo-500 flex-shrink-0" /><span>Pattanagere,RV University Mysore main road</span></li>
              <li className="flex items-center gap-3"><Phone className="w-5 h-5 text-indigo-500 flex-shrink-0" /><span>748-3735-082</span></li>
              <li className="flex items-center gap-3"><Mail className="w-5 h-5 text-indigo-500 flex-shrink-0" /><span>adevadiga2005@gmail.com</span></li>
            </ul>
          </div>
          <div className="md:col-span-2 lg:col-span-2">
            <div className="h-full min-h-[200px] bg-gray-200 rounded-2xl overflow-hidden shadow-lg border border-gray-200/50">
              <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3888.7544158973274!2d77.49599477484047!3d12.923499587387463!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bafad1d6f18a4b9%3A0xc6082c1a24eba0bf!2sRV%20University!5e0!3m2!1sen!2sin!4v1758047568623!5m2!1sen!2sin" width="600" height="450" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} Our Wellness App. All Rights Reserved.</p>
          <div className="flex space-x-4 mt-4 sm:mt-0">
            <a target="_blank" rel="noopener noreferrer" href="https://x.com/akshaykumar" className="text-gray-500 hover:text-indigo-600 transition-colors"><Twitter className="w-6 h-6" /></a>
            <a target="_blank" rel="noopener noreferrer" href="https://www.facebook.com/akshaykumarofficial/" className="text-gray-500 hover:text-indigo-600 transition-colors"><Facebook className="w-6 h-6" /></a>
            <a target="_blank" rel="noopener noreferrer" href="https://www.instagram.com/akshay_devadiga__04/" className="text-gray-500 hover:text-indigo-600 transition-colors"><Instagram className="w-6 h-6" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}