import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase, CommunityResponse } from '../lib/supabase'; // Removed CommunityPost to avoid type conflict
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Toaster, toast } from 'sonner';
import { Plus, MessageCircle, Users, ArrowLeft, Heart, Shield, Sparkles, LoaderCircle, Phone } from 'lucide-react';

// --- AI Moderation Setup (Client-Side) ---
// WARNING: This exposes your API key to the browser. Use with caution.
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

type ModerationCategory = 'urgent_risk' | 'support_needed' | 'safe';

interface ModerationResult {
    category: ModerationCategory;
    reason: string;
    analysis: object;
}

// AI function specifically for initial posts (stories)
async function moderatePostContent(content: string): Promise<ModerationResult> {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const system_prompt = `You are a sensitive AI safety moderator for a mental health support community. Your primary job is to detect imminent self-harm risk. Analyze the following post.
    
    Categories:
    1.  'urgent_risk': The user expresses a clear, immediate intention to self-harm or commit suicide. (e.g., "i am going to kill myself tonight", "i have a plan to end it all").
    2.  'safe': The user is expressing sadness, grief, or discussing past issues without immediate intent to self-harm. (e.g., "i feel so sad", "my friend committed suicide", "i used to think about suicide").
    
    Respond in JSON format only, without markdown:
    {
      "category": "urgent_risk|safe",
      "reason": "Brief explanation."
    }`;
    
    try {
        const result = await model.generateContent(`${system_prompt}\n\nPost: "${content}"`);
        const responseText = await result.response.text();
        const jsonString = responseText.substring(responseText.indexOf('{'), responseText.lastIndexOf('}') + 1);
        const analysis = JSON.parse(jsonString);
        return { category: analysis.category, reason: analysis.reason, analysis };
    } catch (error) {
        console.error("Post moderation error:", error); // FIX 1: Log the whole error
        return { category: 'safe', reason: "AI check failed, defaulting to safe.", analysis: { error: "AI check failed" } };
    }
}

// The new 3-tier AI function for comments
async function moderateCommentContent(content: string): Promise<ModerationResult> {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const system_prompt = `You are an AI moderator for a mental health support community. Analyze the following comment and classify it into one of three categories.

    Categories:
    1.  'urgent_risk': The comment itself expresses an immediate intent for self-harm.
    2.  'support_needed': The comment is safe to post, but the user seems very sad or is asking for help. The tone is melancholic or distressed but not an immediate crisis.
    3.  'safe': The comment is supportive, neutral, or shares an experience without expressing current distress.

    Respond in JSON format only, without markdown:
    {
      "category": "urgent_risk|support_needed|safe",
      "reason": "Brief explanation."
    }`;

    try {
        const result = await model.generateContent(`${system_prompt}\n\nComment: "${content}"`);
        const responseText = await result.response.text();
        const jsonString = responseText.substring(responseText.indexOf('{'), responseText.lastIndexOf('}') + 1);
        const analysis = JSON.parse(jsonString);
        return { category: analysis.category, reason: analysis.reason, analysis };
    } catch (error) {
        console.error("Comment moderation error:", error); // FIX 2: Log the whole error
        return { category: 'safe', reason: "AI check failed, defaulting to safe.", analysis: { error: "AI check failed" } };
    }
}

// AI function to generate a supportive message
async function generateSupportiveMessage(content: string): Promise<string> {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const prompt = `A user wrote this comment: "${content}". They seem to be going through a tough time. Write a short, gentle, and empathetic message (1-2 sentences) acknowledging their feelings and reminding them they are not alone. Do not give advice. Start with "It sounds like you're going through a lot right now."`;
    
    try {
        const result = await model.generateContent(prompt);
        return await result.response.text();
    } catch {
        return "It sounds like you're going through a lot right now. Please remember to be kind to yourself.";
    }
}


// --- TypeScript Interfaces ---
// FIX 3: Redefined interface to avoid conflicts with base types.
interface PostWithCommentCount {
    id: string;
    created_at: string;
    content: string;
    user_id: string | null;
    author_name: string | null;
    tags: string[] | null;
    comment_count: number;
}
interface CommentWithReplies extends CommunityResponse {
    user_id: string;
    author_name: string | null;
    parent_comment_id: string | null;
    replies: CommentWithReplies[];
}

// --- React Component ---
export function Community() {
    const { user } = useAuth();
    const [posts, setPosts] = useState<PostWithCommentCount[]>([]);
    const [selectedPost, setSelectedPost] = useState<PostWithCommentCount | null>(null);
    const [comments, setComments] = useState<CommentWithReplies[]>([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCrisisModal, setShowCrisisModal] = useState(false);

    const [postFilter, setPostFilter] = useState<'all' | 'yours'>('all');
    const [replyTo, setReplyTo] = useState<{ id: string; authorName: string } | null>(null);

    const [formData, setFormData] = useState({ content: '', author_name: '', tags: '' });
    const [responseContent, setResponseContent] = useState('');
    
    const loadPosts = useCallback(async () => {
        setLoading(true);
        let query = supabase.from('posts').select('*');
        if (postFilter === 'yours' && user) {
            query = query.eq('user_id', user.id);
        }
        query = query.order('created_at', { ascending: false });

        try {
            const { data, error } = await query;
            if (error) throw error;
            setPosts(data || []);
        } catch (error) {
            toast.error("Failed to load posts.");
        } finally {
            setLoading(false);
        }
    }, [postFilter, user]);

    const loadComments = useCallback(async (postId: string) => {
        try {
            const { data, error } = await supabase.from('comments').select('*').eq('post_id', postId).order('created_at', { ascending: true });
            if (error) throw error;

            const commentMap = new Map(data.map(comment => [comment.id, { ...comment, replies: [] }]));
            const threadedComments: CommentWithReplies[] = [];
            for (const comment of commentMap.values()) {
                if (comment.parent_comment_id) {
                    commentMap.get(comment.parent_comment_id)?.replies.push(comment);
                } else {
                    threadedComments.push(comment as CommentWithReplies);
                }
            }
            setComments(threadedComments);
        } catch (error) {
            console.error('Error loading comments:', error);
        }
    }, []);

    useEffect(() => {
        if (!selectedPost) {
            loadPosts();
        } else {
            loadComments(selectedPost.id);
        }
    }, [selectedPost, postFilter, user, loadPosts, loadComments]);

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.content.trim()) return;
        setIsSubmitting(true);

        const moderationResult = await moderatePostContent(formData.content);
        if (moderationResult.category === 'urgent_risk') {
            setShowCrisisModal(true);
            setIsSubmitting(false);
            return;
        }

        try {
            const tagArray = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
            const { data, error } = await supabase.from('posts').insert([{ content: formData.content, author_name: formData.author_name || 'Anonymous', tags: tagArray, user_id: user?.id, ai_analysis: moderationResult.analysis }]).select().single();
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
        if (!responseContent.trim() || !selectedPost || !user) {
            toast.error("You must be logged in to comment.");
            return;
        };
        setIsSubmitting(true);

        const moderationResult = await moderateCommentContent(responseContent);

        if (moderationResult.category === 'urgent_risk') {
            setShowCrisisModal(true);
            setIsSubmitting(false);
            return;
        }

        if (moderationResult.category === 'support_needed') {
            const supportMessage = await generateSupportiveMessage(responseContent);
            toast(
                <div className='flex flex-col gap-2'>
                    <p className='font-bold'>AI Peace of Mind</p>
                    <p>{supportMessage}</p>
                </div>, {
                    duration: 10000,
                    action: {
                        label: 'Post Anyway',
                        onClick: () => proceedWithPosting(),
                    },
                }
            );
            setIsSubmitting(false); // Let the user decide
            return;
        }

        await proceedWithPosting();
    };
    
    const proceedWithPosting = async () => {
        if (!responseContent.trim() || !selectedPost || !user) return;
        setIsSubmitting(true);

        try {
            const moderationResult = await moderateCommentContent(responseContent);
            const { data: newComment, error } = await supabase.from('comments').insert([{ post_id: selectedPost.id, content: responseContent, author_name: user?.email || 'Anonymous', user_id: user!.id, parent_comment_id: replyTo?.id, ai_analysis: moderationResult.analysis }]).select().single();
            if (error) throw error;

            if (!replyTo) {
                await supabase.from('posts').update({ comment_count: selectedPost.comment_count + 1 }).eq('id', selectedPost.id);
            }
            
            await loadComments(selectedPost.id);
            await loadPosts();
            toast.success("Your response was posted.");
            setResponseContent('');
            setReplyTo(null);
        } catch (error) {
            toast.error("Could not save your response.");
        } finally {
            setIsSubmitting(false);
        }
    }


    const formatTimeAgo = (dateString: string) => new Date(dateString).toLocaleDateString();

    const renderComment = (comment: CommentWithReplies, isReply: boolean = false) => (
        <div key={comment.id} className={`flex gap-3 ${isReply ? 'ml-8' : ''}`}>
            <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-sm text-white font-medium">{comment.author_name ? comment.author_name[0].toUpperCase() : 'A'}</span>
            </div>
            <div className="flex-grow">
                <p>
                    <span className="font-semibold text-sm">{comment.author_name || 'Anonymous'}</span>
                    <span className="text-gray-700 ml-2">{comment.content}</span>
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                    <span>{formatTimeAgo(comment.created_at)}</span>
                    {/* Logic to allow replying */}
                    {(user && (selectedPost?.user_id === user.id || comment.user_id === user.id)) && (
                        <button onClick={() => setReplyTo({ id: comment.id, authorName: comment.author_name || 'Anonymous' })} className="font-semibold">Reply</button>
                    )}
                </div>
                <div className="mt-2 space-y-3">
                    {comment.replies?.map(reply => renderComment(reply, true))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <Toaster richColors position="top-right" />
            <CrisisModal isOpen={showCrisisModal} onClose={() => setShowCrisisModal(false)} />

            {selectedPost ? (
                // --- Post Detail View ---
                <div>
                    <button onClick={() => setSelectedPost(null)} className="flex items-center space-x-2 text-purple-600 hover:text-purple-800 mb-4">
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Community</span>
                    </button>
                    <div className="bg-white/70 p-6 rounded-lg shadow-md mb-6">
                        <div className="flex items-center gap-3 mb-4">
                             <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-lg text-white font-medium">{selectedPost.author_name ? selectedPost.author_name[0].toUpperCase() : 'A'}</span>
                            </div>
                            <div>
                                <p className="font-semibold">{selectedPost.author_name || 'Anonymous'}</p>
                                <p className='text-xs text-gray-500'>{formatTimeAgo(selectedPost.created_at)}</p>
                            </div>
                        </div>
                        <p className="whitespace-pre-wrap text-gray-800">{selectedPost.content}</p>
                    </div>

                    <div className="space-y-4 mb-6">
                        {comments.map(comment => renderComment(comment))}
                    </div>

                    <div className="bg-white/70 p-4 rounded-lg shadow-md sticky bottom-4">
                         {replyTo && <p className="text-xs text-gray-600 mb-2">Replying to {replyTo.authorName} <button onClick={() => setReplyTo(null)} className="font-bold ml-2 text-red-500">Cancel</button></p>}
                        <div className="flex gap-2">
                           <textarea value={responseContent} onChange={(e) => setResponseContent(e.target.value)} placeholder="Add a comment..." className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500" rows={1} />
                           <button onClick={handleCreateResponse} disabled={!responseContent.trim() || isSubmitting} className="flex items-center justify-center w-24 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
                                {isSubmitting ? <LoaderCircle className="w-5 h-5 animate-spin" /> : 'Post'}
                           </button>
                        </div>
                    </div>
                </div>
            ) : (
                // --- Community Overview ---
                <div>
                    <header className="text-center mb-8">
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
                    <div className="text-center mb-4">
                        <button onClick={() => setShowCreateForm(!showCreateForm)} className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-lg">
                            <Plus className="w-5 h-5 mr-2" /> Share Your Story
                        </button>
                    </div>

                    {showCreateForm && (
                        <form onSubmit={handleCreatePost} className="space-y-4 p-6 bg-white/70 rounded-lg shadow-md mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Share Your Story</h2>
                             <p className="text-sm text-gray-600 mb-4">This is a safe space to express yourself. Your story might help someone else feel less alone.</p>
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
                    )}

                    <div className="flex justify-center border-b mb-4">
                        <button onClick={() => setPostFilter('all')} className={`px-4 py-2 ${postFilter === 'all' ? 'border-b-2 border-purple-600 font-semibold text-purple-600' : 'text-gray-500'}`}>All Posts</button>
                        {user && <button onClick={() => setPostFilter('yours')} className={`px-4 py-2 ${postFilter === 'yours' ? 'border-b-2 border-purple-600 font-semibold text-purple-600' : 'text-gray-500'}`}>Your Posts</button>}
                    </div>

                    <div className="space-y-4">
                        {loading ? <div className="text-center py-8"><LoaderCircle className="w-8 h-8 animate-spin mx-auto text-purple-500" /></div> : posts.map((post) => (
                             <div key={post.id} className="bg-white/70 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedPost(post)}>
                                 <p className="line-clamp-3 mb-4 text-gray-800">{post.content}</p>
                                 <div className="flex justify-between items-center text-sm text-gray-500">
                                     <span>By {post.author_name || 'Anonymous'}</span>
                                     <div className="flex items-center gap-2">
                                         <MessageCircle className="w-4 h-4" />
                                         <span>{post.comment_count}</span>
                                     </div>
                                 </div>
                             </div>
                        ))}
                         {posts.length === 0 && !loading && <p className="text-center text-gray-500 py-8">No posts found. Why not share your story?</p>}
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Crisis Modal Component ---
const CrisisModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                    <Phone className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">Help Is Available</h3>
                <div className="mt-2 px-7 py-3">
                    <p className="text-sm text-gray-600">
                        It sounds like you are going through a difficult time. Your story was not posted, but please reach out for help. There are people who want to support you.
                    </p>
                    <div className="mt-4 space-y-2 text-left font-semibold text-red-700">
                        <p>📞 National Suicide Prevention Lifeline: 988</p>
                        <p>💬 Crisis Text Line: Text HOME to 741741</p>
                    </div>
                </div>
                <div className="mt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md">
                        I Understand
                    </button>
                </div>
            </div>
        </div>
    );
};