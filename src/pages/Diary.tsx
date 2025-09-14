import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase, DiaryEntry } from '../lib/supabase'
import { geminiAI } from '../lib/gemini'
import { 
  Plus, 
  Calendar, 
  MessageCircle, 
  Send, 
  BookOpen,
  Smile,
  Meh,
  Frown,
  Sparkles,
  TrendingUp
} from 'lucide-react'

export function Diary() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    mood_score: 5,
    tags: [] as string[]
  })
  const [chatQuery, setChatQuery] = useState('')
  const [chatResponse, setChatResponse] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  useEffect(() => {
    if (user) {
      loadEntries()
    }
  }, [user])

  const loadEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('diary_entries')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setEntries(data || [])
    } catch (error) {
      console.error('Error loading entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data, error } = await supabase
        .from('diary_entries')
        .insert([
          {
            user_id: user!.id,
            title: formData.title,
            content: formData.content,
            mood_score: formData.mood_score,
            tags: formData.tags
          }
        ])
        .select()
        .single()

      if (error) throw error

      setEntries([data, ...entries])
      setFormData({ title: '', content: '', mood_score: 5, tags: [] })
      setShowForm(false)
    } catch (error) {
      console.error('Error saving entry:', error)
    }
  }

  const handleChatQuery = async () => {
    if (!chatQuery.trim() || entries.length === 0) return
    
    setChatLoading(true)
    setChatResponse('')
    try {
      const entryContents = entries.map(entry => `Title: ${entry.title}\nContent: ${entry.content}\nMood: ${entry.mood_score}/10\nDate: ${entry.created_at}`)
      const response = await geminiAI.analyzeDiaryEntries(entryContents, chatQuery)
      setChatResponse(response)
      setChatQuery('')
    } catch (error) {
      console.error('Error getting AI response:', error)
      setChatResponse('Sorry, I encountered an error. Please try again.')
    } finally {
      setChatLoading(false)
    }
  }

  const getMoodIcon = (score: number) => {
    if (score >= 7) return <Smile className="w-5 h-5 text-green-500" />
    if (score >= 4) return <Meh className="w-5 h-5 text-yellow-500" />
    return <Frown className="w-5 h-5 text-red-500" />
  }

  const getMoodColor = (score: number) => {
    if (score >= 7) return 'bg-green-100 text-green-800'
    if (score >= 4) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-md border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Personal Diary</h1>
            <p className="text-gray-600">Express your thoughts, track your mood, and reflect on your journey</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowChat(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat with AI</span>
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Entry</span>
            </button>
          </div>
        </div>
      </div>

      {/* New Entry Form */}
      {showForm && (
        <div className="bg-white rounded-lg p-6 shadow-md border border-blue-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">New Diary Entry</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="How are you feeling today?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your thoughts
              </label>
              <textarea
                required
                rows={6}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Write about your day, feelings, or anything on your mind..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mood Score (1-10)
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.mood_score}
                  onChange={(e) => setFormData({ ...formData, mood_score: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <div className="flex items-center space-x-2">
                  {getMoodIcon(formData.mood_score)}
                  <span className="font-medium">{formData.mood_score}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Entry
              </button>
            </div>
          </form>
        </div>
      )}

      {/* AI Chat */}
      {showChat && (
        <div className="bg-white rounded-lg p-6 shadow-md border border-purple-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
              Chat with AI Assistant
            </h2>
            <button
              onClick={() => setShowChat(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={chatQuery}
                onChange={(e) => setChatQuery(e.target.value)}
                placeholder="Ask me anything about your diary entries or mental wellness..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                onKeyPress={(e) => e.key === 'Enter' && handleChatQuery()}
              />
              <button
                onClick={handleChatQuery}
                disabled={chatLoading || !chatQuery.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {chatLoading && (
              <div className="flex items-center space-x-2 text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                <span>AI is thinking...</span>
              </div>
            )}

            {chatResponse && (
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-gray-800 whitespace-pre-wrap">{chatResponse}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Entries List */}
      <div className="space-y-6">
        {entries.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md border border-blue-100">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No entries yet</h3>
            <p className="text-gray-600 mb-4">Start your wellness journey by writing your first diary entry</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Write First Entry
            </button>
          </div>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="bg-white rounded-lg p-6 shadow-md border border-blue-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-semibold text-gray-900">{entry.title}</h3>
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMoodColor(entry.mood_score)}`}>
                    {getMoodIcon(entry.mood_score)}
                    <span className="ml-1">{entry.mood_score}/10</span>
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{entry.content}</p>
              {entry.tags && entry.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {entry.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}