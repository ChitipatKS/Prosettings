-- SQL DDL Migration for Membership & Saved Settings
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Create user profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(100),
    real_name VARCHAR(150),
    is_profile_created BOOLEAN DEFAULT FALSE,
    nationality VARCHAR(100),
    country_code VARCHAR(10),
    team VARCHAR(150) DEFAULT 'Community Member',
    game_settings JSONB DEFAULT '{}'::jsonb,
    gear_ids INTEGER[] DEFAULT '{}'::integer[],
    social_links JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for user profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid duplication errors
DROP POLICY IF EXISTS "Allow public read access to profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow individual write access to own profile" ON public.user_profiles;

-- Create policies for user profiles
CREATE POLICY "Allow public read access to profiles" 
ON public.user_profiles FOR SELECT 
USING (true);

CREATE POLICY "Allow individual write access to own profile" 
ON public.user_profiles FOR ALL 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 2. Create user favorites table
CREATE TABLE IF NOT EXISTS public.user_favorites (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    player_id INTEGER REFERENCES public.players(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, player_id)
);

-- Enable RLS for user favorites
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid duplication errors
DROP POLICY IF EXISTS "Allow individual read access to own favorites" ON public.user_favorites;
DROP POLICY IF EXISTS "Allow individual write access to own favorites" ON public.user_favorites;

-- Create policies for user favorites
CREATE POLICY "Allow individual read access to own favorites" 
ON public.user_favorites FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Allow individual write access to own favorites" 
ON public.user_favorites FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. Create Trigger function to automatically create a profile for new auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, username)
  VALUES (
    new.id, 
    COALESCE(
      new.raw_user_meta_data->>'username', 
      split_part(new.email, '@', 1)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
