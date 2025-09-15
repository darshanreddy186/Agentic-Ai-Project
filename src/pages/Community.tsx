import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase'; // Assuming CommunityResponse is also from here
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

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
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
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
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
interface Comment { id: string; created_at: string; content: string; post_id: string; user_id: string; author_name: string | null; parent_comment_id: string | null; replies: Comment[]; }

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
                if (comment.parent_comment_id && commentMap.has(comment.parent_comment_id)) {
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
            const { data, error } = await supabase.from('posts').insert([{ content: postFormData.content, author_name: postFormData.author_name || 'Anonymous', user_id: user?.id, tags: tagArray, ai_analysis: moderationResult.analysis }]).select().single();
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
    
    const proceedWithPosting = async (ai_analysis: object) => {
        if (!commentFormData.content.trim() || !selectedPost) return;
        setIsSubmitting(true);
        if(!user){
            return toast.error("You must be logged in to post a response.");
        }

        try {
            const {error } = await supabase.from('comments').insert([{ post_id: selectedPost.id, content: commentFormData.content, author_name: commentFormData.author_name || 'Anonymous', user_id: user.id, parent_comment_id: replyTo?.id, ai_analysis }]).select().single();
            if (error) throw error;
            
            loadComments(selectedPost.id);
            if (!replyTo) {
                const newCount = (selectedPost.comment_count || 0) + 1;
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

    const handleCreateResponse = async () => {
        if (!commentFormData.content.trim() || !selectedPost) return;
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
    
    const handleReplyClick = (comment: Comment) => {
        setReplyTo({ id: comment.id, authorName: comment.author_name || 'Anonymous' });
        commentInputRef.current?.focus();
    };

    const totalCommentCount = comments.reduce((acc, comment) => acc + 1 + comment.replies.length, 0);

    return (
        <div className="max-w-4xl mx-auto space-y-8 p-4 bg-purple-50/50 min-h-screen">
            <Toaster richColors position="top-right" />
            <CrisisModal isOpen={showCrisisModal} onClose={() => setShowCrisisModal(false)} />

            {selectedPost ? (
                // --- Post Detail View (NEW DESIGN) ---
                <div>
                    <button onClick={() => setSelectedPost(null)} className="flex items-center space-x-2 text-purple-600 hover:text-purple-800 mb-4 font-semibold">
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back to Community</span>
                    </button>
                    
                    {/* Original Post Card */}
                    <div className="bg-white p-5 rounded-xl shadow-sm mb-6 border border-gray-100">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-lg text-purple-700 font-bold">{selectedPost.author_name ? selectedPost.author_name[0].toUpperCase() : 'A'}</span>
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="font-bold text-gray-800">{selectedPost.author_name || 'Anonymous'}</p>
                                    <span className="text-xs font-semibold text-white bg-purple-500 px-2 py-0.5 rounded-full">Author</span>
                                </div>
                                <p className='text-xs text-gray-500'>{new Date(selectedPost.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">{selectedPost.content}</p>
                        <p className="text-sm text-gray-400 mt-4">{totalCommentCount} responses</p>
                    </div>

                    {/* Community Responses */}
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Community Responses ({totalCommentCount})</h2>
                    <div className="space-y-4 mb-6">
                        {comments.map(comment => <CommentComponent key={comment.id} comment={comment} user={user} postAuthorId={selectedPost.user_id} onReplyClick={handleReplyClick} />)}
                    </div>

                    {/* Comment Input Form */}
                    <div className="bg-white p-4 rounded-xl shadow-md sticky bottom-4 border border-gray-100">
                        {replyTo && (
                            <div className="flex justify-between items-center text-xs text-gray-600 mb-2 px-1">
                                <span>Replying to <span className="font-semibold">{replyTo.authorName}</span></span>
                                <button onClick={() => setReplyTo(null)} className="font-bold text-red-500 hover:text-red-700">Cancel</button>
                            </div>
                        )}
                        <div className="flex flex-col sm:flex-row gap-2">
                           <AutoGrowTextarea ref={commentInputRef} value={commentFormData.content} onChange={(e) => setCommentFormData({...commentFormData, content: e.target.value})} placeholder="Share your thoughts..." className="w-full px-4 py-2 bg-gray-100 border-transparent focus:border-purple-500 focus:ring-purple-500 rounded-lg transition" />
                           <div className='flex gap-2 mt-2 sm:mt-0'>
                               <input type="text" value={commentFormData.author_name} onChange={(e) => setCommentFormData({...commentFormData, author_name: e.target.value})} placeholder="Name (Optional)" className="w-full sm:w-36 px-4 py-2 bg-gray-100 border-transparent focus:border-purple-500 focus:ring-purple-500 rounded-lg transition"/>
                               <button onClick={handleCreateResponse} disabled={!commentFormData.content.trim() || isSubmitting} className="flex items-center justify-center w-full sm:w-24 px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-all">
                                   {isSubmitting ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 sm:hidden" />}
                                   <span className="hidden sm:inline">{isSubmitting ? <LoaderCircle className="w-5 h-5 animate-spin" /> : 'Post'}</span>
                               </button>
                           </div>
                        </div>
                    </div>
                </div>
            ) : (
                // --- Community Overview (NEW DESIGN) ---
                <div>
                    <header className="text-center mb-8">
                        <div className="inline-flex items-center gap-3 mb-4">
                            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                                <Heart className="w-8 h-8 text-white" />
                            </div>
                            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Safe Space</h1>
                        </div>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">A supportive community where every voice matters.</p>
                        <div className="flex items-center justify-center gap-6 mt-6 text-sm text-gray-500">
                            <div className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-purple-500" /><span>AI-Moderated</span></div>
                            <div className="flex items-center gap-1.5"><Users className="w-4 h-4 text-purple-500" /><span>Anonymous Friendly</span></div>
                            <div className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-purple-500" /><span>Safe & Supportive</span></div>
                        </div>
                    </header>
                    <div className="text-center mb-6">
                        <button onClick={() => setShowCreateForm(!showCreateForm)} className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-full shadow-lg hover:scale-105 transition-transform">
                            <Plus className="w-6 h-6 mr-2" /> Share Your Story
                        </button>
                    </div>
                    {showCreateForm && (
                        <form onSubmit={handleCreatePost} className="space-y-4 p-6 bg-white rounded-xl shadow-sm mb-8 border border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-800">Share Your Story</h2>
                            <div>
                                <textarea required rows={5} value={postFormData.content} onChange={(e) => setPostFormData({...postFormData, content: e.target.value})} className="w-full p-3 bg-gray-50 rounded-md border border-gray-200 focus:ring-purple-500 focus:border-purple-500" placeholder="What's on your mind?..." />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <input type="text" value={postFormData.author_name} onChange={(e) => setPostFormData({...postFormData, author_name: e.target.value})} className="w-full p-3 bg-gray-50 rounded-md border border-gray-200 focus:ring-purple-500 focus:border-purple-500" placeholder="Name (leave blank to post anonymously)" />
                               <input type="text" value={postFormData.tags} onChange={(e) => setPostFormData({...postFormData, tags: e.target.value})} className="w-full p-3 bg-gray-50 rounded-md border border-gray-200 focus:ring-purple-500 focus:border-purple-500" placeholder="Tags (e.g., anxiety, relationships)" />
                            </div>
                            <div className="flex justify-end space-x-3 pt-2">
                                <button type="button" onClick={() => setShowCreateForm(false)} className="px-5 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className="flex items-center justify-center w-40 px-5 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50">
                                    {isSubmitting ? <LoaderCircle className="w-5 h-5 animate-spin" /> : 'Share Story'}
                                </button>
                            </div>
                        </form>
                    )}
                    <div className="flex justify-center border-b border-gray-200 mb-6">
                        <button onClick={() => setPostFilter('all')} className={`px-4 py-2 text-sm font-semibold ${postFilter === 'all' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500 hover:text-purple-600'}`}>All Posts</button>
                        {user && <button onClick={() => setPostFilter('yours')} className={`px-4 py-2 text-sm font-semibold ${postFilter === 'yours' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500 hover:text-purple-600'}`}>Your Posts</button>}
                    </div>
                    <div className="space-y-4">
                        {loading ? (
                            <div className="text-center py-12"><LoaderCircle className="w-8 h-8 animate-spin mx-auto text-purple-500" /></div>
                        ) : (
                            posts.map((post) => (
                                <div key={post.id} className="bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-100" onClick={() => setSelectedPost(post)}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center flex-shrink-0">
                                            <span className="text-lg text-purple-700 font-bold">{post.author_name ? post.author_name[0].toUpperCase() : 'A'}</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800">{post.author_name || 'Anonymous'}</p>
                                            <p className='text-xs text-gray-500'>{new Date(post.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <p className="line-clamp-3 text-gray-700 mb-4">{post.content}</p>
                                    <div className="flex justify-end items-center text-sm text-gray-400">
                                        <div className="flex items-center gap-2">
                                            <MessageCircle className="w-4 h-4" />
                                            <span>{post.comment_count || 0} responses</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        {posts.length === 0 && !loading && <p className="text-center text-gray-500 py-12">{postFilter === 'yours' ? "You haven't shared any stories yet." : "No stories found. Be the first to share!"}</p>}
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Sub-Components (REDESIGNED) ---
const CommentComponent = ({ comment, user, postAuthorId, onReplyClick }: { comment: Comment; user: any; postAuthorId: string | null; onReplyClick: (comment: Comment) => void }) => {
    // A user can reply IF they are logged in AND (they are the original post author OR they wrote the specific comment they are replying to)
    const canReply = user && (user.id === postAuthorId || user.id === comment.user_id);
    const isAuthor = comment.user_id === postAuthorId;
    const isYou = comment.user_id === user?.id;

    return (
        <div className="flex gap-3">
            {/* Avatar */}
            <div className="w-9 h-9 bg-purple-200 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-base text-purple-700 font-bold">{comment.author_name ? comment.author_name[0].toUpperCase() : 'A'}</span>
            </div>
            <div className="flex-grow">
                {/* Comment Body */}
                <div className="bg-white p-3 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm text-gray-800">{comment.author_name || 'Anonymous'}</span>
                        {isAuthor && <span className="text-xs font-semibold text-white bg-purple-500 px-2 py-0.5 rounded-full">Author</span>}
                        {isYou && !isAuthor && <span className="text-xs font-semibold text-white bg-blue-500 px-2 py-0.5 rounded-full">You</span>}
                    </div>
                    <p className="text-gray-700">{comment.content}</p>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-4 text-xs text-gray-500 mt-1.5 pl-2">
                    <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                    {canReply && <button onClick={() => onReplyClick(comment)} className="font-semibold hover:text-purple-600">Reply</button>}
                </div>
                
                {/* Replies with connecting line */}
                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-3 space-y-3 pl-5 border-l-2 border-gray-200">
                        {comment.replies.map(reply => <CommentComponent key={reply.id} comment={reply} user={user} postAuthorId={postAuthorId} onReplyClick={onReplyClick} />)}
                    </div>
                )}
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

AutoGrowTextarea.displayName = 'AutoGrowTextarea';

const CrisisModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-2xl">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
                    <Phone className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mt-5">Help Is Available</h3>
                <div className="mt-2 px-4 py-3">
                    <p className="text-gray-600">
                        It sounds like you are going through a difficult time. Your content was not posted, but please reach out. There are people who want to support you.
                    </p>
                    <div className="mt-5 space-y-2 text-left font-semibold text-red-700 bg-red-50 p-4 rounded-lg">
                        <p>📞 National Suicide Prevention Lifeline: <span className="font-bold">988</span></p>
                        <p>💬 Crisis Text Line: Text <span className="font-bold">HOME</span> to <span className="font-bold">741741</span></p>
                    </div>
                </div>
                <div className="mt-5">
                    <button onClick={onClose} className="px-6 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-all">I Understand</button>
                </div>
            </div>
        </div>
    );
};