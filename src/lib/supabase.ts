import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
)

export type DiaryEntry = {
  id: string
  user_id: string
  title: string
  content: string
  mood_score: number
  tags: string[]
  created_at: string
  updated_at: string
}

export type CommunityPost = {
  id: string
  user_id: string
  title: string
  content: string
  is_anonymous: boolean
  category: string
  created_at: string
}

export type CommunityResponse = {
  id: string
  post_id: string
  user_id: string
  content: string
  is_anonymous: boolean
  created_at: string
}

export type UserProfile = {
  id: string
  display_name: string | null
  age_range: string | null
  preferred_activities: string[]
  wellness_goals: string[]
  created_at: string
  updated_at: string
}