-- ================================================================================================
-- Part 1: Table Creation
-- This section creates all the necessary tables for your application.
-- ================================================================================================

-- Table for user diary entries
CREATE TABLE IF NOT EXISTS public.diary_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  mood_score integer CHECK (mood_score >= 1 AND mood_score <= 10),
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
COMMENT ON TABLE public.diary_entries IS 'Stores individual diary entries for each user.';

-- Table for community discussion posts
CREATE TABLE IF NOT EXISTS public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  is_anonymous boolean DEFAULT true,
  category text DEFAULT 'general',
  created_at timestamptz DEFAULT now()
);
COMMENT ON TABLE public.community_posts IS 'Stores posts made by users in the community section.';

-- Table for responses to community posts
CREATE TABLE IF NOT EXISTS public.community_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.community_posts ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  content text NOT NULL,
  is_anonymous boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
COMMENT ON TABLE public.community_responses IS 'Stores replies to posts in the community section.';

-- Table for user profile information
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name text,
  age_range text CHECK (age_range IN ('13-15', '16-18', '19-24')),
  preferred_activities text[] DEFAULT '{}',
  wellness_goals text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
COMMENT ON TABLE public.user_profiles IS 'Stores additional non-auth information for users.';

-- **NEW**: Table for storing image metadata linked to diary entries
CREATE TABLE IF NOT EXISTS public.memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  diary_entry_id uuid REFERENCES public.diary_entries(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  context text,
  mood text,
  created_at timestamptz DEFAULT now()
);
COMMENT ON TABLE public.memories IS 'Stores user-generated memories linked to diary entries and images.';


-- ================================================================================================
-- Part 2: Row Level Security (RLS)
-- This section enables RLS and creates policies to protect your data.
-- Users will only be able to access and manage their own records.
-- ================================================================================================

-- Enable RLS for all tables
ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

-- Policies for diary_entries
CREATE POLICY "Users can manage their own diary entries" ON public.diary_entries
  FOR ALL USING (auth.uid() = user_id);

-- Policies for community_posts
CREATE POLICY "Allow authenticated read access to all posts" ON public.community_posts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage their own posts" ON public.community_posts
  FOR ALL USING (auth.uid() = user_id);

-- Policies for community_responses
CREATE POLICY "Allow authenticated read access to all responses" ON public.community_responses
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage their own responses" ON public.community_responses
  FOR ALL USING (auth.uid() = user_id);

-- Policies for user_profiles
CREATE POLICY "Users can view all profiles" ON public.user_profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage their own profile" ON public.user_profiles
  FOR ALL USING (auth.uid() = id);

-- Policies for memories
CREATE POLICY "Users can manage their own memories" ON public.memories
  FOR ALL USING (auth.uid() = user_id);


-- ================================================================================================
-- Part 3: Storage Bucket and Policies
-- This section creates the storage bucket for images and sets its security rules.
-- ================================================================================================

-- Create a public bucket for diary images.
-- 'public: true' allows file access via URL, but RLS policies below will secure uploads/deletes.
INSERT INTO storage.buckets (id, name, public)
VALUES ('diary_images', 'diary_images', true)
ON CONFLICT (id) DO NOTHING; -- Prevents error if script is run again.

-- Policies for the 'diary_images' storage bucket
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'diary_images');

CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'diary_images');

CREATE POLICY "Allow individual user updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (auth.uid() = owner)
WITH CHECK (bucket_id = 'diary_images');

CREATE POLICY "Allow individual user deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (auth.uid() = owner);