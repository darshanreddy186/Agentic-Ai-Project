import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Loader } from 'lucide-react';

export function PersonalizedRecommendations() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('user_ai_summaries')
        .select('recommendations')
        .eq('user_id', user.id)
        .single();
      
      if (data?.recommendations && data.recommendations.length > 0) {
        setRecommendations(data.recommendations);
      } else {
        // Provide default recommendations if none exist for the user yet
        setRecommendations([
          "Take a few deep breaths, focusing on the sensation of the air.",
          "Write down three things you are grateful for today.",
          "Spend a few minutes listening to a favorite calming song."
        ]);
      }
      
      setLoading(false);
    };

    fetchRecommendations();
  }, [user]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex items-center justify-center min-h-[200px]">
        <Loader className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
      <div 
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="text-xl font-bold text-gray-800">Personalized Recommendations</h2>
        <svg 
          className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {isOpen && (
        <ul className="mt-4 space-y-3 text-gray-600">
          {recommendations.map((rec, index) => (
            <li key={index} className="flex items-start">
              <span className="text-purple-500 mr-3 mt-1">&#9679;</span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}