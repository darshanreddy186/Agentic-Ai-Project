import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Profile = {
  id: string;
  clerk_user_id: string;
  name: string;
  age: number;
  gender: string;
  date_of_birth: string;
  avatar_type: string;
  created_at: string;
  updated_at: string;
};

export type DiaryEntry = {
  id: string;
  user_id: string;
  content: string;
  mood_score?: number;
  ai_analysis?: string;
  created_at: string;
};

export type Achievement = {
  id: string;
  user_id: string;
  badge_type: string;
  title: string;
  description: string;
  earned_at: string;
};

export type CommunityPost = {
  id: string;
  content: string;
  anonymous_author: string;
  reactions: number;
  created_at: string;
};

export type Conversation = {
  id: string;
  user_id: string;
  message: string;
  ai_response: string;
  context_entries?: string[];
  created_at: string;
};