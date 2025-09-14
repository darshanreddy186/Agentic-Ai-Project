import React, { useState, useEffect, useCallback } from 'react';
import { supabase, CommunityPost, CommunityResponse } from '../lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Toaster, toast } from 'sonner';
import {
    Plus,
    MessageCircle,
    Users,
    Send,
    ArrowLeft,
    Heart,
    Shield,
    Sparkles,
    LoaderCircle, // New icon for loading state
} from 'lucide-react';

// --- AI Moderation Setup (Client-Side) ---
// WARNING: This exposes your API key to the browser. Use with caution.
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * AI-powered comment moderation running directly in the browser.
 * @param {string} content - The comment text to moderate.
 * @returns {Promise<{approved: boolean, message: string}>}
 */
async function moderateComment(content: string): Promise<{ approved: boolean; message: string }> {
    if (!GEMINI_API_KEY) {
        console.error("Gemini API key is missing. Approving comment by default.");
        // Fallback for local development if key is not set
        return { approved: true, message: "Comment posted!" };
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        const system_message = `You are an AI moderator for a safe space community where people share personal struggles. Your job is to analyze comments for harmful content.

        CLASSIFICATION RULES:
        - REJECT any comment that is dismissive, judgmental, gives unqualified medical advice, or is directly harmful (e.g., telling someone to self-harm).
        - APPROVE comments that are empathetic, supportive, share a related experience constructively, or ask gentle questions.

        RESPONSE FORMAT (JSON only, no markdown):
        {
          "recommendation": "approve|reject",
          "reason": "Brief explanation of your decision."
        }

        Analyze this comment and respond with JSON only:`;

        const fullPrompt = `${system_message}\n\n${content}`;
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        let responseText = response.text();
        
        const jsonString = responseText.substring(responseText.indexOf('{'), responseText.lastIndexOf('}') + 1);
        const analysis = JSON.parse(jsonString);

        if (analysis.recommendation === 'reject') {
            return {
                approved: false,
                message: "Your comment could not be posted as it violates our community safety guidelines. Please focus on being supportive.",
            };
        }

        return {
            approved: true,
            message: "Your comment was successfully posted!",
        };

    } catch (error) {
        console.error("AI moderation error:", error);
        // If the AI fails for any reason, we will reject the comment to be safe.
        return {
            approved: false,
            message: "Could not verify the comment's safety. Please try again.",
        };
    }
}


// --- TypeScript Interfaces ---
interface PostWithCommentCount extends CommunityPost {
    author_name: string | null;
    tags: string[] | null;
    comment_count: number;
}
interface CommunityResponseWithAuthor extends CommunityResponse {
    author_name: string | null;
}

// --- React Component ---
export function Community() {
    const [posts, setPosts] = useState<PostWithCommentCount[]>([]);
    const [selectedPost, setSelectedPost] = useState<PostWithCommentCount | null>(null);
    const [responses, setResponses] = useState<CommunityResponseWithAuthor[]>([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({ content: '', author_name: '', tags: '' });
    const [responseContent, setResponseContent] = useState('');
    const [responseAuthorName, setResponseAuthorName] = useState('');

    const loadPosts = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('posts')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setPosts(data || []);
        } catch (error) {
            toast.error("Failed to load community posts.");
        } finally {
            setLoading(false);
        }
    }, []);

    const loadResponses = useCallback(async (postId: string) => {
        try {
            const { data, error } = await supabase.from('comments').select('*').eq('post_id', postId).order('created_at', { ascending: true });
            if (error) throw error;
            setResponses(data || []);
        } catch (error) {
            console.error('Error loading responses:', error);
        }
    }, []);

    useEffect(() => {
        if (!selectedPost) {
            loadPosts();
        } else {
            loadResponses(selectedPost.id);
        }
    }, [selectedPost, loadPosts, loadResponses]);

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.content.trim()) return;
        setIsSubmitting(true);
        try {
            const tagArray = formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean);
            const { data, error } = await supabase.from('posts').insert([{ content: formData.content, author_name: formData.author_name || 'Anonymous', tags: tagArray }]).select().single();
            if (error) throw error;
            setPosts([data, ...posts]);
            setFormData({ content: '', author_name: '', tags: '' });
            setShowCreateForm(false);
            toast.success("Your story has been shared!");
        } catch (error) {
            toast.error("Failed to share your story.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateResponse = async () => {
        if (!responseContent.trim() || !selectedPost) return;
        setIsSubmitting(true);

        // 1. Moderate the comment using the client-side function
        const moderationResult = await moderateComment(responseContent);

        // 2. If rejected, show a message and stop.
        if (!moderationResult.approved) {
            toast.error(moderationResult.message);
            setIsSubmitting(false);
            return;
        }

        // 3. If approved, save to Supabase.
        try {
            const { data: newComment, error: insertError } = await supabase.from('comments').insert([{ post_id: selectedPost.id, content: responseContent, author_name: responseAuthorName || 'Anonymous' }]).select().single();
            if (insertError) throw insertError;

            // 4. Manually update the comment count on the post
            const { error: updateError } = await supabase.from('posts').update({ comment_count: selectedPost.comment_count + 1 }).eq('id', selectedPost.id);
            if (updateError) throw updateError;
            
            toast.success(moderationResult.message);
            setResponses([...responses, newComment]);
            setResponseContent('');
            setResponseAuthorName('');
            // Update counts in the UI for immediate feedback
            setSelectedPost({ ...selectedPost, comment_count: selectedPost.comment_count + 1 });
            setPosts(posts.map(p => p.id === selectedPost.id ? { ...p, comment_count: p.comment_count + 1 } : p));
        } catch (error) {
            console.error('Error saving response:', error);
            toast.error("Could not save your response. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatTimeAgo = (dateString: string) => new Date(dateString).toLocaleDateString();

    if (loading && posts.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <LoaderCircle className="w-12 h-12 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <Toaster richColors position="top-right" />
            {selectedPost ? (
                 <div className="max-w-4xl mx-auto space-y-6">
                 <button onClick={() => setSelectedPost(null)} className="flex items-center space-x-2 text-purple-600 hover:text-purple-800">
                     <ArrowLeft className="w-4 h-4" />
                     <span>Back to Community</span>
                 </button>
 
                 <div className="bg-white/70 backdrop-blur-sm rounded-lg p-6 shadow-md border border-purple-100">
                     <div className="flex items-start justify-between mb-4">
                         <div>
                             <div className="flex items-center space-x-3 text-sm text-gray-500 mb-2">
                                 <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                                     <span className="text-sm text-white font-medium">
                                         {selectedPost.author_name ? selectedPost.author_name[0].toUpperCase() : 'A'}
                                     </span>
                                 </div>
                                 <span className="font-medium">{selectedPost.author_name || 'Anonymous'}</span>
                                 <span>•</span>
                                 <span>{formatTimeAgo(selectedPost.created_at)}</span>
                             </div>
                             {selectedPost.tags && selectedPost.tags.length > 0 && (
                                 <div className="flex gap-2 flex-wrap mb-4">
                                     {selectedPost.tags.map((tag: string, index: number) => (
                                         <span key={index} className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700">{tag}</span>
                                     ))}
                                 </div>
                             )}
                         </div>
                     </div>
                     <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap">{selectedPost.content}</p>
                     <hr className="my-6" />
                     <div className="flex items-center gap-1 text-sm text-gray-500">
                         <MessageCircle className="w-4 h-4" />
                         <span>{selectedPost.comment_count} responses</span>
                     </div>
                 </div>
 
                 <div className="bg-white/70 backdrop-blur-sm rounded-lg p-6 shadow-md border border-purple-100">
                     <h2 className="text-lg font-semibold text-gray-900 mb-2">Add Your Response</h2>
                     <p className="text-sm text-gray-600 mb-4">Share your thoughts, support, or similar experiences. Remember to be kind and supportive.</p>
                     <div className="space-y-4">
                         <textarea value={responseContent} onChange={(e) => setResponseContent(e.target.value)} placeholder="Write a supportive response..." className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500" rows={4} />
                         <input type="text" value={responseAuthorName} onChange={(e) => setResponseAuthorName(e.target.value)} placeholder="Your name (optional - leave blank for anonymous)" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500" />
                         <div className="flex justify-end">
                             <button onClick={handleCreateResponse} disabled={!responseContent.trim() || isSubmitting} className="flex items-center justify-center w-36 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50">
                                 {isSubmitting ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4 mr-2" /><span>Post</span></>}
                             </button>
                         </div>
                     </div>
                 </div>
 
                 <div className="space-y-4">
                     {responses.length > 0 && <h3 className="text-xl font-semibold text-gray-800">Community Responses ({responses.length})</h3>}
                     {responses.length === 0 ? <p className="text-gray-500 text-center py-8">No responses yet. Be the first to offer support!</p> : responses.map((response) => (
                         <div key={response.id} className="bg-gray-50 rounded-lg p-4 border-l-4 border-purple-200">
                             <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                                 <div className="w-5 h-5 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                                     <span className="text-xs text-white font-medium">{response.author_name ? response.author_name[0].toUpperCase() : 'A'}</span>
                                 </div>
                                 <span>{response.author_name || 'Anonymous'}</span>
                                 <span>•</span>
                                 <span>{formatTimeAgo(response.created_at)}</span>
                             </div>
                             <p className="text-gray-800 whitespace-pre-wrap">{response.content}</p>
                         </div>
                     ))}
                 </div>
             </div>
            ) : (
                <div className="max-w-4xl mx-auto space-y-8">
                    <header className="text-center">
                         <div className="inline-flex items-center gap-3 mb-4">
                             <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                 <Heart className="w-6 h-6 text-white" />
                             </div>
                             <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Safe Space</h1>
                         </div>
                         <p className="text-lg text-gray-600 max-w-2xl mx-auto">A supportive community where every voice matters. Share your story, find understanding, and connect with others on similar journeys.</p>
                         <div className="flex items-center justify-center gap-6 mt-6 text-sm text-gray-500">
                             <div className="flex items-center gap-1"><Shield className="w-4 h-4" /><span>AI-Moderated</span></div>
                             <div className="flex items-center gap-1"><Users className="w-4 h-4" /><span>Anonymous Friendly</span></div>
                             <div className="flex items-center gap-1"><Sparkles className="w-4 h-4" /><span>Safe & Supportive</span></div>
                         </div>
                     </header>
 
                     <div className="text-center">
                         <button onClick={() => setShowCreateForm(!showCreateForm)} className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-lg hover:from-purple-700 hover:to-pink-700">
                             <Plus className="w-5 h-5 mr-2" />
                             <span>Share Your Story</span>
                         </button>
                     </div>
 
                     {showCreateForm && (
                         <div className="bg-white/70 backdrop-blur-sm rounded-lg p-6 shadow-md border border-purple-100">
                             <h2 className="text-2xl font-semibold text-gray-900 mb-2">Share Your Story</h2>
                             <p className="text-sm text-gray-600 mb-4">This is a safe space to express yourself. Your story might help someone else feel less alone.</p>
                             <form onSubmit={handleCreatePost} className="space-y-4">
                                 <div>
                                     <label className="block text-sm font-medium text-gray-700 mb-1">Your Story</label>
                                     <textarea required rows={6} value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500" placeholder="What's on your mind?..." />
                                 </div>
                                 <div>
                                     <label className="block text-sm font-medium text-gray-700 mb-1">Your Name (Optional)</label>
                                     <input type="text" value={formData.author_name} onChange={(e) => setFormData({ ...formData, author_name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500" placeholder="Leave blank to post anonymously" />
                                 </div>
                                 <div>
                                     <label className="block text-sm font-medium text-gray-700 mb-1">Tags (Optional, comma-separated)</label>
                                     <input type="text" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500" placeholder="e.g., anxiety, relationships, work-stress" />
                                 </div>
                                 <div className="flex justify-end space-x-3">
                                     <button type="button" onClick={() => setShowCreateForm(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
                                     <button type="submit" disabled={isSubmitting} className="flex items-center justify-center w-40 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50">
                                        {isSubmitting ? <LoaderCircle className="w-5 h-5 animate-spin" /> : 'Share Story'}
                                     </button>
                                 </div>
                             </form>
                         </div>
                     )}
 
                     <div className="space-y-6">
                         {posts.length === 0 && !showCreateForm ? (
                             <div className="text-center py-12 bg-white/70 backdrop-blur-sm rounded-lg shadow-md border-purple-100">
                                 <Heart className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                                 <h3 className="text-xl font-semibold text-gray-800 mb-2">Be the first to share</h3>
                                 <p className="text-gray-600">Your story could be exactly what someone else needs to hear today.</p>
                             </div>
                         ) : (
                             posts.map((post) => (
                                 <div key={post.id} className="bg-white/70 backdrop-blur-sm rounded-lg p-6 shadow-md border border-purple-100 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedPost(post)}>
                                     <div className="flex items-start justify-between mb-3">
                                         <div className="flex items-center space-x-2 text-sm text-gray-500">
                                             <div className="w-6 h-6 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                                                 <span className="text-xs text-white font-medium">{post.author_name ? post.author_name[0].toUpperCase() : 'A'}</span>
                                             </div>
                                             <span>{post.author_name || 'Anonymous'}</span>
                                             <span>•</span>
                                             <span>{formatTimeAgo(post.created_at)}</span>
                                         </div>
                                     </div>
                                     <p className="text-gray-800 mb-4 line-clamp-3">{post.content}</p>
                                     <div className="flex items-center justify-between text-sm text-gray-500">
                                         <div className="flex items-center space-x-1"><MessageCircle className="w-4 h-4" /><span>{post.comment_count} responses</span></div>
                                         {post.tags && post.tags.length > 0 && (
                                             <div className="flex gap-1 flex-wrap">
                                                 {(post.tags as any).slice(0, 2).map((tag: string, index: number) => (<span key={index} className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700">{tag}</span>))}
                                                 {post.tags.length > 2 && <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">+{post.tags.length - 2}</span>}
                                             </div>
                                         )}
                                     </div>
                                 </div>
                             ))
                         )}
                     </div>
                 </div>
            )}
        </div>
    );
}