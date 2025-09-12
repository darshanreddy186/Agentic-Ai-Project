import { createClient } from '@supabase/supabase-js';

// --- Supabase Client Initialization ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL and Key must be defined in your .env file");
}

export const supabase = createClient(supabaseUrl, supabaseKey);


// --- TypeScript Types for Database Tables ---

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

// +++ ADDED THIS TYPE +++
export type Memory = {
  id: string;
  user_id: string;
  diary_entry_id: string;
  image_url: string;
  context: string;
  mood: string;
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


// --- Supabase Storage Helper Function ---

// +++ ADDED THIS FUNCTION +++
/**
 * Uploads an image file to a specified Supabase Storage bucket.
 * @param {File} file - The image file to upload.
 * @param {string} bucket - The name of the storage bucket (e.g., 'diary_images').
 * @returns {Promise<string>} - The public URL of the uploaded image.
 */
export const uploadImage = async (file: File, bucket: string): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file);

  if (uploadError) {
    console.error("Error uploading file:", uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  if (!data || !data.publicUrl) {
    throw new Error("Could not get public URL for the uploaded file.");
  }

  return data.publicUrl;
};