import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, CommunityPost } from '../../lib/supabase';
import { Heart, Plus, Send, MessageSquare, Sparkles } from 'lucide-react';

export function CommunityWall() {
  const { user } = useUser();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [newPost, setNewPost] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('community_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (data) {
      setPosts(data);
    }
  };

  const handleSubmitPost = async () => {
    if (!user || !newPost.trim()) return;

    setIsPosting(true);
    
    try {
      // Generate anonymous name (e.g., "Sunshine_123", "Moonbeam_456")
      const anonymousNames = [
        'Sunshine', 'Moonbeam', 'Starlight', 'Rainbow', 'Butterfly',
        'Blossom', 'Dreamer', 'Wanderer', 'Phoenix', 'Serenity'
      ];
      const randomName = anonymousNames[Math.floor(Math.random() * anonymousNames.length)];
      const randomNum = Math.floor(Math.random() * 999) + 1;
      const anonymousAuthor = `${randomName}_${randomNum}`;

      await supabase.from('community_posts').insert({
        content: newPost,
        anonymous_author: anonymousAuthor,
        reactions: 0
      });

      setNewPost('');
      setShowForm(false);
      fetchPosts();
    } catch (error) {
      console.error('Error posting to community:', error);
    } finally {
      setIsPosting(false);
    }
  };

  const handleReact = async (postId: string, currentReactions: number) => {
    try {
      await supabase
        .from('community_posts')
        .update({ reactions: currentReactions + 1 })
        .eq('id', postId);
      
      fetchPosts();
    } catch (error) {
      console.error('Error reacting to post:', error);
    }
  };

  const stickyNoteColors = [
    'from-yellow-200 to-yellow-300',
    'from-pink-200 to-pink-300',
    'from-blue-200 to-blue-300',
    'from-green-200 to-green-300',
    'from-purple-200 to-purple-300',
    'from-orange-200 to-orange-300',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <MessageSquare className="w-8 h-8 text-purple-500" />
          <h2 className="text-3xl font-bold text-gray-800">Community Wall 💝</h2>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Share your thoughts anonymously and connect with others on their wellness journey. 
          Your identity is protected - only your supportive words shine through! ✨
        </p>
      </motion.div>

      {/* Add New Post Button */}
      {!showForm && (
        <motion.button
          onClick={() => setShowForm(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-3xl flex items-center justify-center gap-3 font-medium text-lg shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="w-6 h-6" />
          Share something positive with the community 🌟
        </motion.button>
      )}

      {/* New Post Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20"
          >
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-6 h-6 text-purple-500" />
              <h3 className="text-xl font-bold text-gray-800">Share Your Light 🌟</h3>
            </div>
            
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Share something positive, inspiring, or supportive... Your words might be exactly what someone needs to hear today! 💜"
              className="w-full h-32 p-4 border-2 border-purple-200 rounded-2xl focus:border-purple-500 focus:outline-none resize-none text-gray-700"
              maxLength={500}
            />
            
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-gray-500">
                {newPost.length}/500 characters
              </span>
              <div className="flex gap-3">
                <motion.button
                  onClick={handleSubmitPost}
                  disabled={!newPost.trim() || isPosting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isPosting ? (
                    <>
                      <Sparkles className="w-5 h-5 animate-spin" />
                      Sharing...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Share Anonymously
                    </>
                  )}
                </motion.button>
                
                <motion.button
                  onClick={() => {
                    setShowForm(false);
                    setNewPost('');
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-2xl font-medium"
                >
                  Cancel
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Community Posts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {posts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full text-center py-12"
          >
            <MessageSquare className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">
              Be the first to share something beautiful with the community! 🌸
            </p>
          </motion.div>
        ) : (
          posts.map((post, index) => {
            const colorClass = stickyNoteColors[index % stickyNoteColors.length];
            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20, rotate: Math.random() * 10 - 5 }}
                animate={{ 
                  opacity: 1, 
                  y: 0, 
                  rotate: Math.random() * 6 - 3 
                }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ 
                  scale: 1.05, 
                  rotate: 0,
                  zIndex: 10
                }}
                className={`bg-gradient-to-br ${colorClass} p-6 rounded-2xl shadow-lg border-2 border-white/50 cursor-pointer transform transition-all duration-200 relative`}
                style={{ 
                  minHeight: '200px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1), 0 8px 25px rgba(0,0,0,0.1)'
                }}
              >
                {/* Tape effect */}
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-16 h-6 bg-white/70 rounded-sm shadow-sm border border-gray-200" />
                
                <div className="mb-4">
                  <p className="text-gray-700 leading-relaxed text-sm">
                    {post.content}
                  </p>
                </div>
                
                <div className="flex items-center justify-between mt-auto">
                  <div className="text-xs text-gray-600 font-medium">
                    ~ {post.anonymous_author}
                  </div>
                  
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReact(post.id, post.reactions);
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="flex items-center gap-1 text-red-500 hover:text-red-600 transition-colors"
                  >
                    <Heart className="w-4 h-4" />
                    <span className="text-sm font-medium">{post.reactions}</span>
                  </motion.button>
                </div>
                
                <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                  {new Date(post.created_at).toLocaleDateString()}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Community Guidelines */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-3xl p-6 border border-white/20"
      >
        <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Heart className="w-5 h-5 text-pink-500" />
          Community Guidelines 💜
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div className="space-y-2">
            <p>✨ Share positive, uplifting thoughts</p>
            <p>🤗 Be kind and supportive to others</p>
            <p>🌈 Celebrate diversity and different perspectives</p>
          </div>
          <div className="space-y-2">
            <p>🔒 Your identity remains completely anonymous</p>
            <p>💬 Focus on encouragement and hope</p>
            <p>🌱 Help others grow on their wellness journey</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}