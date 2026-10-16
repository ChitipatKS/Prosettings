-- =========================================================
-- Supabase Schema Migration: Add likes_count support to comments table
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- =========================================================

-- 1. Add likes_count column if not exists
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_comments_likes_count ON public.comments(likes_count);
