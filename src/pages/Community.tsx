import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase, CommunityPost, CommunityResponse } from '../lib/supabase'
import { 
  Plus, 
  MessageCircle, 
  Heart, 
  Users, 
  Send, 
  Filter,
  Clock,
  User
} from 'lucide-react'

export function Community() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<(CommunityPost & { response_count: number })[]>([])
  const [selectedPost, setSelectedPost] = useState<string | null>(null)
  const [responses, setResponses] = useState<CommunityResponse[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    is_anonymous: true
  })
  const [responseContent, setResponseContent] = useState('')

  const categories = [
    { value: 'all', label: 'All Posts' },
    { value: 'general', label: 'General' },
    { value: 'anxiety', label: 'Anxiety' },
    { value: 'depression', label: 'Depression' },
    { value: 'relationships', label: 'Relationships' },
    { value: 'school', label: 'School/Work' },
    { value: 'self-care', label: 'Self Care' }
  ]

  useEffect(() => {
    loadPosts()
  }, [selectedCategory])

  useEffect(() => {
    if (selectedPost) {
      loadResponses(selectedPost)
    }
  }, [selectedPost])

  const loadPosts = async () => {
    try {
      let query = supabase
        .from('community_posts')
        .select(`
          *,
          community_responses(count)
        `)
        .order('created_at', { ascending: false })

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory)
      }

      const { data, error } = await query

      if (error) throw error

      const postsWithCounts = data?.map(post => ({
        ...post,
        response_count: post.community_responses?.[0]?.count || 0
      })) || []

      setPosts(postsWithCounts)
    } catch (error) {
      console.error('Error loading posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadResponses = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('community_responses')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setResponses(data || [])
    } catch (error) {
      console.error('Error loading responses:', error)
    }
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .insert([
          {
            user_id: user!.id,
            title: formData.title,
            content: formData.content,
            category: formData.category,
            is_anonymous: formData.is_anonymous
          }
        ])
        .select()
        .single()

      if (error) throw error

      setPosts([{ ...data, response_count: 0 }, ...posts])
      setFormData({ title: '', content: '', category: 'general', is_anonymous: true })
      setShowCreateForm(false)
    } catch (error) {
      console.error('Error creating post:', error)
    }
  }

  const handleCreateResponse = async () => {
    if (!responseContent.trim() || !selectedPost) return

    try {
      const { data, error } = await supabase
        .from('community_responses')
        .insert([
          {
            post_id: selectedPost,
            user_id: user!.id,
            content: responseContent,
            is_anonymous: true
          }
        ])
        .select()
        .single()

      if (error) throw error

      setResponses([...responses, data])
      setResponseContent('')
      
      // Update post response count
      setPosts(posts.map(post => 
        post.id === selectedPost 
          ? { ...post, response_count: post.response_count + 1 }
          : post
      ))
    } catch (error) {
      console.error('Error creating response:', error)
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      general: 'bg-blue-100 text-blue-800',
      anxiety: 'bg-yellow-100 text-yellow-800',
      depression: 'bg-purple-100 text-purple-800',
      relationships: 'bg-pink-100 text-pink-800',
      school: 'bg-green-100 text-green-800',
      'self-care': 'bg-indigo-100 text-indigo-800'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return '1 day ago'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {selectedPost ? (
        // Post Detail View
        <div className="space-y-6">
          <button
            onClick={() => setSelectedPost(null)}
            className="text-blue-600 hover:text-blue-800 flex items-center space-x-2"
          >
            ← Back to Community
          </button>

          {/* Post Content */}
          {posts.find(p => p.id === selectedPost) && (
            <div className="bg-white rounded-lg p-6 shadow-md border border-blue-100">
              {(() => {
                const post = posts.find(p => p.id === selectedPost)!
                return (
                  <>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">{post.title}</h1>
                        <div className="flex items-center space-x-3 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>Anonymous</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatTimeAgo(post.created_at)}</span>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs ${getCategoryColor(post.category)}`}>
                            {post.category}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
                  </>
                )
              })()}
            </div>
          )}

          {/* Responses */}
          <div className="bg-white rounded-lg p-6 shadow-md border border-blue-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Responses ({responses.length})
            </h2>

            {/* Create Response */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <textarea
                value={responseContent}
                onChange={(e) => setResponseContent(e.target.value)}
                placeholder="Share your support, advice, or similar experience..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
                rows={3}
              />
              <div className="flex justify-end">
                <button
                  onClick={handleCreateResponse}
                  disabled={!responseContent.trim()}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Support</span>
                </button>
              </div>
            </div>

            {/* Response List */}
            <div className="space-y-4">
              {responses.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No responses yet. Be the first to offer support!
                </p>
              ) : (
                responses.map((response) => (
                  <div key={response.id} className="border-l-4 border-green-200 pl-4 py-2">
                    <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                      <User className="w-4 h-4" />
                      <span>Anonymous</span>
                      <span>•</span>
                      <span>{formatTimeAgo(response.created_at)}</span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{response.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        // Community Overview
        <div className="space-y-8">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Anonymous Community</h1>
                <p className="text-green-100">
                  Share your experiences and support others in a safe, anonymous space
                </p>
              </div>
              <Users className="w-16 h-16 text-green-200 hidden md:block" />
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus className="w-4 h-4" />
              <span>Share Your Story</span>
            </button>
          </div>

          {/* Create Post Form */}
          {showCreateForm && (
            <div className="bg-white rounded-lg p-6 shadow-md border border-green-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Share Your Story</h2>
              <form onSubmit={handleCreatePost} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                    placeholder="What's on your mind?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your story
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                    placeholder="Share your experience, ask for advice, or offer support to others..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  >
                    {categories.slice(1).map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Share Anonymously
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Posts List */}
          <div className="space-y-6">
            {posts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-md border border-green-100">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
                <p className="text-gray-600 mb-4">Be the first to share your story and start the conversation</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Share Your Story
                </button>
              </div>
            ) : (
              posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-lg p-6 shadow-md border border-blue-100 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedPost(post.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-semibold text-gray-900 pr-4">{post.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${getCategoryColor(post.category)}`}>
                      {post.category}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 mb-4 line-clamp-3">
                    {post.content.substring(0, 200)}...
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4" />
                        <span>Anonymous</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatTimeAgo(post.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.response_count} responses</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}