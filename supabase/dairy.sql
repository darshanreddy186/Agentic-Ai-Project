-- ========= TABLE 1: DIARY ENTRIES =========
-- Stores the main content of each daily entry.

CREATE TABLE public.diary_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  mood_score REAL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add comments for clarity
COMMENT ON TABLE public.diary_entries IS 'Stores daily diary entries for users.';
COMMENT ON COLUMN public.diary_entries.user_id IS 'Links the entry to a specific user.';
COMMENT ON COLUMN public.diary_entries.content IS 'The HTML content from the rich text editor.';


-- --- POLICIES FOR DIARY ENTRIES ---
-- 1. Enable Row Level Security on the table
ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;

-- 2. Allow users to view their own entries
CREATE POLICY "Users can view their own diary entries"
  ON public.diary_entries FOR SELECT
  USING (auth.uid() = user_id);

-- 3. Allow users to create entries for themselves
CREATE POLICY "Users can insert their own diary entries"
  ON public.diary_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4. Allow users to update their own entries
CREATE POLICY "Users can update their own diary entries"
  ON public.diary_entries FOR UPDATE
  USING (auth.uid() = user_id);

-- 5. Allow users to delete their own entries
CREATE POLICY "Users can delete their own diary entries"
  ON public.diary_entries FOR DELETE
  USING (auth.uid() = user_id);


-- ========= TABLE 2: MEMORIES =========
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
COMMENT ON COLUMN public.memories.diary_entry_id IS 'Links the memory to a specific day''s entry. Deletes if the parent entry is deleted.';
COMMENT ON COLUMN public.memories.image_url IS 'The public URL of the image from Supabase Storage.';


-- --- POLICIES FOR MEMORIES ---
-- 1. Enable Row Level Security on the table
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

-- 2. Allow users to view their own memories
CREATE POLICY "Users can view their own memories"
  ON public.memories FOR SELECT
  USING (auth.uid() = user_id);

-- 3. Allow users to create memories for themselves
CREATE POLICY "Users can insert their own memories"
  ON public.memories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4. Allow users to update their own memories
CREATE POLICY "Users can update their own memories"
  ON public.memories FOR UPDATE
  USING (auth.uid() = user_id);

-- 5. Allow users to delete their own memories
CREATE POLICY "Users can delete their own memories"
  ON public.memories FOR DELETE
  USING (auth.uid() = user_id);


========= DELETE EXISTING STORAGE POLICIES FOR 'diary_images' BUCKET =========
This section safely finds and deletes any policies you might have created before.

DO $$
DECLARE
    policy_name_to_delete TEXT;
BEGIN
    -- Loop through all policies on the storage.objects table
    FOR policy_name_to_delete IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage'
    LOOP
        -- Check if the policy definition contains the name of our bucket
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
            -- If it's related to our bucket, drop it
            EXECUTE 'DROP POLICY "' || policy_name_to_delete || '" ON storage.objects;';
            RAISE NOTICE 'Dropped policy: %', policy_name_to_delete;
        END IF;
    END LOOP;
END $$;


-- ========= CREATE NEW PUBLIC POLICIES FOR 'diary_images' BUCKET =========

-- 1. Create a policy to allow ANYONE to VIEW images in the 'diary_images' bucket.
CREATE POLICY "Public Read Access for diary_images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'diary_images' );


-- 2. Create a policy to allow ANYONE to UPLOAD images to the 'diary_images' bucket.
CREATE POLICY "Public Upload Access for diary_images"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'diary_images' );