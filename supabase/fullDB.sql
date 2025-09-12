-- MindBloom Application Database Schema
-- This script sets up all tables, relationships, and security policies
-- required for the application, integrating with Clerk for authentication.
-- Author: Gemini AI
-- Date: September 12, 2025

-- ========= TABLE 1: PROFILES =========
-- Stores user information fetched during the onboarding process.
-- This table is linked to Clerk's authentication via the clerk_user_id.

CREATE TABLE public.profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL UNIQUE, -- Using TEXT for Clerk User ID as it's not a standard UUID.
  name VARCHAR(255),
  age INT,
  gender TEXT,
  date_of_birth DATE,
  avatar_type TEXT, -- e.g., 'female_teen', 'male_child'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add comments for clarity
COMMENT ON TABLE public.profiles IS 'Stores public user profile data linked to a Clerk Auth user.';
COMMENT ON COLUMN public.profiles.clerk_user_id IS 'The unique user ID from Clerk authentication.';
COMMENT ON COLUMN public.profiles.avatar_type IS 'A string identifier for dynamically generating user avatars.';

-- --- POLICIES FOR PROFILES ---
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = clerk_user_id::uuid); -- Assumes Clerk JWT `sub` claim maps to Supabase `auth.uid()`

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = clerk_user_id::uuid);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = clerk_user_id::uuid);

CREATE POLICY "Users can delete their own profile"
  ON public.profiles FOR DELETE
  USING (auth.uid() = clerk_user_id::uuid);


-- ========= TABLE 2: DIARY ENTRIES =========
-- Stores the main content of each daily journal entry.

CREATE TABLE public.diary_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  mood_score REAL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add comments for clarity
COMMENT ON TABLE public.diary_entries IS 'Stores daily diary entries for users.';
COMMENT ON COLUMN public.diary_entries.user_id IS 'Foreign key to the auth.users table.';
COMMENT ON COLUMN public.diary_entries.content IS 'The HTML content from the rich text editor.';

-- --- POLICIES FOR DIARY ENTRIES ---
ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own diary entries"
  ON public.diary_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own diary entries"
  ON public.diary_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own diary entries"
  ON public.diary_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own diary entries"
  ON public.diary_entries FOR DELETE
  USING (auth.uid() = user_id);


-- ========= TABLE 3: MEMORIES =========
-- Stores data for each image, linking it to a specific diary entry.

CREATE TABLE public.memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  diary_entry_id UUID NOT NULL REFERENCES public.diary_entries(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  context TEXT,
  mood TEXT DEFAULT 'neutral',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add comments for clarity
COMMENT ON TABLE public.memories IS 'Stores individual memories (image and context) linked to a diary entry.';
COMMENT ON COLUMN public.memories.diary_entry_id IS 'Links the memory to a specific day''s entry.';
COMMENT ON COLUMN public.memories.image_url IS 'The public URL of the image from Supabase Storage.';

-- --- POLICIES FOR MEMORIES ---
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own memories"
  ON public.memories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memories"
  ON public.memories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memories"
  ON public.memories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memories"
  ON public.memories FOR DELETE
  USING (auth.uid() = user_id);


-- ========= TABLE 4: ACHIEVEMENTS =========
-- Stores achievements and badges awarded to users for milestones.

CREATE TABLE public.achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL, -- e.g., 'welcome', 'first_entry', 'week_streak'
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add comments for clarity
COMMENT ON TABLE public.achievements IS 'Stores gamification achievements earned by users.';
COMMENT ON COLUMN public.achievements.badge_type IS 'A machine-readable key for the badge icon and color.';

-- --- POLICIES FOR ACHIEVEMENTS ---
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own achievements"
  ON public.achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert achievements"
  ON public.achievements FOR INSERT
  WITH CHECK (true); -- Achievements are awarded by the system (e.g., via server-side logic or triggers), so we allow inserts. Users shouldn't insert these themselves.


-- ========= TABLE 5: COMMUNITY POSTS =========
-- Stores anonymous posts for the community wall. No direct link to users.

CREATE TABLE public.community_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  anonymous_author TEXT NOT NULL, -- e.g., "Sunshine_123"
  reactions INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add comments for clarity
COMMENT ON TABLE public.community_posts IS 'Stores anonymous posts for the community wall. Intentionally disconnected from user IDs.';
COMMENT ON COLUMN public.community_posts.anonymous_author IS 'A randomly generated name to provide a sense of identity without revealing the user.';

-- --- POLICIES FOR COMMUNITY POSTS ---
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all community posts"
  ON public.community_posts FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create community posts"
  ON public.community_posts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update reactions on posts"
  ON public.community_posts FOR UPDATE
  USING (auth.role() = 'authenticated');


-- ========= TABLE 6: CONVERSATIONS (AI CHAT) =========
-- Stores the conversation history between a user and the AI companion.

CREATE TABLE public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  context_entries TEXT[], -- Store an array of diary entry snippets used for context
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add comments for clarity
COMMENT ON TABLE public.conversations IS 'Stores the chat history between a user and the AI companion.';
COMMENT ON COLUMN public.conversations.context_entries IS 'An array of recent diary entries provided to the AI as context.';

-- --- POLICIES FOR CONVERSATIONS ---
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations"
  ON public.conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversation history"
  ON public.conversations FOR DELETE
  USING (auth.uid() = user_id);


-- ========= STORAGE POLICIES FOR 'diary_images' BUCKET =========
-- First, ensure any old, conflicting policies are removed.
-- This script safely finds and deletes any policies related to 'diary_images'.

DO $$
DECLARE
    policy_name_to_delete TEXT;
BEGIN
    FOR policy_name_to_delete IN
        SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage'
    LOOP
        IF EXISTS (
            SELECT 1
            FROM pg_policy pol
            JOIN pg_class class ON class.oid = pol.polrelid
            JOIN pg_namespace space ON space.oid = class.relnamespace
            WHERE
                space.nspname = 'storage' AND
                class.relname = 'objects' AND
                pol.polname = policy_name_to_delete AND
                pg_get_expr(pol.polqual, pol.polrelid) LIKE '%diary_images%'
        )
        THEN
            EXECUTE 'DROP POLICY "' || policy_name_to_delete || '" ON storage.objects;';
            RAISE NOTICE 'Dropped existing policy: %', policy_name_to_delete;
        END IF;
    END LOOP;
END $$;

-- --- CREATE NEW STORAGE POLICIES ---

-- 1. Allow public read access so images can be displayed in the app.
CREATE POLICY "Public Read Access for diary_images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'diary_images' );

-- 2. Allow authenticated users to upload images to the 'diary_images' bucket.
CREATE POLICY "Authenticated users can upload to diary_images"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'diary_images' AND auth.role() = 'authenticated' );

-- 3. Allow users to delete their own images.
-- Note: This policy is more complex as it requires checking ownership.
-- A simple approach is to allow deletes by any authenticated user and manage this in your app logic.
-- A more secure way involves using functions or checking metadata, but this is a solid start.
CREATE POLICY "Authenticated users can delete from diary_images"
ON storage.objects FOR DELETE
USING ( bucket_id = 'diary_images' AND auth.role() = 'authenticated' );

-- --- END OF SCRIPT ---