import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase, CommunityResponse } from '../lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Toaster, toast } from 'sonner';
import { Plus, MessageCircle, Users, Send, ArrowLeft, Heart, Shield, Sparkles, LoaderCircle, Phone, XCircle } from 'lucide-react';

// --- AI Moderation Setup (Client-Side) ---
// WARNING: This exposes your API key to the browser. Use with extreme caution.
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    console.warn("VITE_GEMINI_API_KEY is not set. AI moderation will be disabled.");
}
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');

type ModerationCategory = 'urgent_risk' | 'harmful_instruction' | 'support_needed' | 'safe';
interface ModerationResult {
    category: ModerationCategory;
    reason: string;
    analysis: object;
}

/**
 * Universal moderation function with contextual awareness.
 * @param contentToModerate The new text to analyze.
 * @param postContext The original post's content, if available.
 * @returns A promise resolving to a ModerationResult object.
 */
async function moderateContent(contentToModerate: string, postContext: string | null = null): Promise<ModerationResult> {
    if (!GEMINI_API_KEY) return { category: 'safe', reason: 'API Key not configured.', analysis: {} };

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const system_prompt = `You are a sophisticated AI safety moderator for a mental health support community. Your job is to analyze user-submitted text for safety and intent, often with the context of an original post.

    Categories & Rules:
    1.  'urgent_risk': The user is expressing a clear, FIRST-PERSON, immediate intention to self-harm (e.g., "I am going to kill myself"). This is a cry for help from the author of the text being analyzed.
    2.  'harmful_instruction': The user is telling SOMEONE ELSE to self-harm or do something dangerous. This is a malicious command, ESPECIALLY if the original post context is about sadness or suicide (e.g., Comment: "do the same yourself" in reply to Post: "my friend committed suicide").
    3.  'support_needed': The text is safe, but the author expresses significant sadness or distress, but not an immediate crisis (e.g., "I feel so empty").
    4.  'safe': The text is supportive, neutral, or otherwise harmless.

    Analyze the content provided and respond in JSON format ONLY, with no markdown:
    {
      "category": "urgent_risk|harmful_instruction|support_needed|safe",
      "reason": "A brief explanation of your classification based on the provided context."
    }`;
    
    let fullPrompt = system_prompt;
    if (postContext) {
        fullPrompt += `\n\n[ORIGINAL POST FOR CONTEXT]:\n"${postContext}"\n\n[NEW COMMENT TO ANALYZE]:\n"${contentToModerate}"`;
    } else {
        fullPrompt += `\n\n[NEW POST TO ANALYZE]:\n"${contentToModerate}"`;
    }

    try {
        const result = await model.generateContent(fullPrompt);
        const responseText = await result.response.text();
        const jsonString = responseText.substring(responseText.indexOf('{'), responseText.lastIndexOf('}') + 1);
        const analysis = JSON.parse(jsonString);
        return { category: analysis.category, reason: analysis.reason, analysis };
    } catch (error) {
        console.error(`Moderation error:`, error);
        return { category: 'safe', reason: "AI check failed.", analysis: { error: "AI check failed" } };
    }
}

/**
 * Generates a short, empathetic message for users who seem to be struggling.
 * @param content The user's original content.
 * @returns A promise resolving to a supportive string.
 */
async function generateSupportiveMessage(content: string): Promise<string> {
    if (!GEMINI_API_KEY) return "It sounds like you're going through a lot. Please remember to be kind to yourself.";
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const prompt = `A user wrote: "${content}". Write a short, gentle, and empathetic message (1-2 sentences) acknowledging their feelings. Do not give advice. Start with "It sounds like you're going through a lot right now."`;
    try {
        const result = await model.generateContent(prompt);
        return await result.response.text();
    } catch {
        return "It sounds like you're going through a lot right now. Please remember to be kind to yourself.";
    }
}

// --- TypeScript Interfaces ---
interface Post { id: string; created_at: string; content: string; user_id: string | null; author_name: string | null; tags: string[] | null; comment_count: number; }
interface Comment extends CommunityResponse { user_id: string; author_name: string | null; parent_comment_id: string | null; replies: Comment[]; }

// --- React Component ---
export function Community() {
    const { user } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCrisisModal, setShowCrisisModal] = useState(false);
    const [postFilter, setPostFilter] = useState<'all' | 'yours'>('all');
    const [replyTo, setReplyTo] = useState<{ id: string; authorName: string } | null>(null);
    const commentInputRef = useRef<HTMLTextAreaElement>(null);
    const [postFormData, setPostFormData] = useState({ content: '', author_name: '', tags: '' });
    const [commentFormData, setCommentFormData] = useState({ content: '', author_name: '' });

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
            const commentMap = new Map(data.map(c => [c.id, { ...c, replies: [] }]));
            const threadedComments: Comment[] = [];
            for (const comment of commentMap.values()) {
                if (comment.parent_comment_id) {
                    commentMap.get(comment.parent_comment_id)?.replies.push(comment as Comment);
                } else {
                    threadedComments.push(comment as Comment);
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
        if (!postFormData.content.trim()) return;
        setIsSubmitting(true);

        const moderationResult = await moderateContent(postFormData.content);

        if (moderationResult.category === 'urgent_risk') {
            setShowCrisisModal(true);
            setIsSubmitting(false);
            return;
        }

        try {
            const tagArray = postFormData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
            const { data, error } = await supabase.from('posts').insert([{ ...postFormData, user_id: user?.id, tags: tagArray, ai_analysis: moderationResult.analysis }]).select().single();
            if (error) throw error;
            setPosts([data, ...posts]);
            setPostFormData({ content: '', author_name: '', tags: '' });
            setShowCreateForm(false);
            toast.success("Your story has been shared!");
        } catch (error) { 
            toast.error("Failed to share your story."); 
        } finally { 
            setIsSubmitting(false); 
        }
    };
    
    const handleCreateResponse = async () => {
        if (!commentFormData.content.trim() || !selectedPost || !user) return;
        setIsSubmitting(true);

        const moderationResult = await moderateContent(commentFormData.content, selectedPost.content);
        
        switch (moderationResult.category) {
            case 'urgent_risk':
                setShowCrisisModal(true);
                setIsSubmitting(false);
                break;
            case 'harmful_instruction':
                toast.error("Harmful or instructional comments are not permitted.", { icon: <XCircle className="text-red-500" /> });
                setIsSubmitting(false);
                break;
            case 'support_needed':
                const supportMessage = await generateSupportiveMessage(commentFormData.content);
                toast(
                    <div><p className='font-bold'>AI Peace of Mind</p><p>{supportMessage}</p></div>, {
                        duration: 10000,
                        action: { label: 'Post Anyway', onClick: () => proceedWithPosting(moderationResult.analysis) },
                        onDismiss: () => setIsSubmitting(false),
                        onAutoClose: () => setIsSubmitting(false)
                    }
                );
                break;
            case 'safe':
                await proceedWithPosting(moderationResult.analysis);
                break;
            default:
                setIsSubmitting(false);
        }
    };
    
    const proceedWithPosting = async (ai_analysis: object) => {
        if (!commentFormData.content.trim() || !selectedPost || !user) return;
        setIsSubmitting(true);

        try {
            const { data: newComment, error } = await supabase.from('comments').insert([{ post_id: selectedPost.id, content: commentFormData.content, author_name: commentFormData.author_name || 'Anonymous', user_id: user.id, parent_comment_id: replyTo?.id, ai_analysis }]).select().single();
            if (error) throw error;
            
            loadComments(selectedPost.id);
            if (!replyTo) {
                const newCount = selectedPost.comment_count + 1;
                setSelectedPost({ ...selectedPost, comment_count: newCount });
                setPosts(posts.map(p => p.id === selectedPost.id ? { ...p, comment_count: newCount } : p));
                await supabase.from('posts').update({ comment_count: newCount }).eq('id', selectedPost.id);
            }

            toast.success("Your response was posted.");
            setCommentFormData({ content: '', author_name: '' });
            setReplyTo(null);
        } catch (error) { 
            toast.error("Could not save your response."); 
        } finally { 
            setIsSubmitting(false); 
        }
    };
    
    const handleReplyClick = (comment: Comment) => {
        setReplyTo({ id: comment.id, authorName: comment.author_name || 'Anonymous' });
        commentInputRef.current?.focus();
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 p-4">
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
                                <p className='text-xs text-gray-500'>{new Date(selectedPost.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <p className="whitespace-pre-wrap text-gray-800">{selectedPost.content}</p>
                    </div>
                    <div className="space-y-4 mb-6">
                        {comments.map(comment => <CommentComponent key={comment.id} comment={comment} user={user} postAuthorId={selectedPost.user_id} onReplyClick={handleReplyClick} />)}
                    </div>
                    <div className="bg-white/70 p-4 rounded-lg shadow-md sticky bottom-4">
                        {replyTo && (
                            <p className="text-xs text-gray-600 mb-2">
                                Replying to {replyTo.authorName} <button onClick={() => setReplyTo(null)} className="font-bold ml-2 text-red-500">Cancel</button>
                            </p>
                        )}
                        <div className="flex flex-col sm:flex-row gap-2">
                           <AutoGrowTextarea ref={commentInputRef} value={commentFormData.content} onChange={(e) => setCommentFormData({...commentFormData, content: e.target.value})} placeholder="Add a comment..." className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                           <div className='flex gap-2 mt-2 sm:mt-0'>
                               <input type="text" value={commentFormData.author_name} onChange={(e) => setCommentFormData({...commentFormData, author_name: e.target.value})} placeholder="Name (Optional)" className="w-full sm:w-32 px-3 py-2 border border-gray-300 rounded-md"/>
                               <button onClick={handleCreateResponse} disabled={!commentFormData.content.trim() || isSubmitting} className="flex items-center justify-center w-24 px-4 py-2 bg-purple-600 text-white rounded-lg disabled:opacity-50">
                                   {isSubmitting ? <LoaderCircle className="w-5 h-5 animate-spin" /> : 'Post'}
                               </button>
                           </div>
                        </div>
                    </div>
                </div>
            ) : (
                // --- Community Overview ---
                <div>
                    <header className="text-center mb-8">
                        <div className="inline-flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center"><Heart className="w-6 h-6 text-white" /></div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Safe Space</h1>
                        </div>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">A supportive community where every voice matters.</p>
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
                            <h2 className="text-2xl font-semibold">Share Your Story</h2>
                            <div>
                                <label className="block text-sm font-medium mb-1">Your Story</label>
                                <textarea required rows={6} value={postFormData.content} onChange={(e) => setPostFormData({...postFormData, content: e.target.value})} className="w-full p-2 border rounded-md" placeholder="What's on your mind?..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Your Name (Optional)</label>
                                <input type="text" value={postFormData.author_name} onChange={(e) => setPostFormData({...postFormData, author_name: e.target.value})} className="w-full p-2 border rounded-md" placeholder="Leave blank to post anonymously" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Tags (Optional, comma-separated)</label>
                                <input type="text" value={postFormData.tags} onChange={(e) => setPostFormData({...postFormData, tags: e.target.value})} className="w-full p-2 border rounded-md" placeholder="e.g., anxiety, relationships" />
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button type="button" onClick={() => setShowCreateForm(false)} className="px-4 py-2">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className="flex items-center justify-center w-40 px-4 py-2 bg-purple-600 text-white rounded-lg disabled:opacity-50">
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
                        {loading ? (
                            <div className="text-center py-8"><LoaderCircle className="w-8 h-8 animate-spin mx-auto text-purple-500" /></div>
                        ) : (
                            posts.map((post) => (
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
                            ))
                        )}
                        {posts.length === 0 && !loading && <p className="text-center text-gray-500 py-8">{postFilter === 'yours' ? "You haven't shared any stories yet." : "No posts found. Be the first to share!"}</p>}
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Sub-Components ---
const CommentComponent = ({ comment, user, postAuthorId, onReplyClick }: { comment: Comment; user: any; postAuthorId: string | null; onReplyClick: (comment: Comment) => void }) => {
    const canReply = user && (user.id === postAuthorId || user.id === comment.user_id);
    return (
        <div className="flex gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-sm text-white font-medium">{comment.author_name ? comment.author_name[0].toUpperCase() : 'A'}</span>
            </div>
            <div className="flex-grow">
                <p>
                    <span className="font-semibold text-sm">{comment.author_name || 'Anonymous'}</span>
                    <span className="text-gray-700 ml-2">{comment.content}</span>
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                    <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                    {canReply && <button onClick={() => onReplyClick(comment)} className="font-semibold">Reply</button>}
                </div>
                <div className="mt-3 space-y-3 pl-6 border-l-2 border-gray-100">
                    {comment.replies?.map(reply => <CommentComponent key={reply.id} comment={reply} user={user} postAuthorId={postAuthorId} onReplyClick={onReplyClick} />)}
                </div>
            </div>
        </div>
    );
};

const AutoGrowTextarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>((props, ref) => {
    const internalRef = useRef<HTMLTextAreaElement>(null);
    React.useImperativeHandle(ref, () => internalRef.current!);
    useLayoutEffect(() => { 
        const t = internalRef.current; 
        if (t) { 
            t.style.height = 'auto'; 
            t.style.height = `${t.scrollHeight}px`; 
        }
    }, [props.value]);
    return <textarea {...props} ref={internalRef} rows={1} />;
});

const CrisisModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                    <Phone className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mt-4">Help Is Available</h3>
                <div className="mt-2 px-7 py-3">
                    <p className="text-sm text-gray-600">
                        It sounds like you are going through a difficult time. Your content was not posted, but please reach out for help. There are people who want to support you.
                    </p>
                    <div className="mt-4 space-y-2 text-left font-semibold text-red-700">
                        <p>📞 National Suicide Prevention Lifeline: 988</p>
                        <p>💬 Crisis Text Line: Text HOME to 741741</p>
                    </div>
                </div>
                <div className="mt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md">I Understand</button>
                </div>
            </div>
        </div>
    );
};