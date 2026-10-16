-- =========================================================
-- Supabase Schema Migration: Add reply support to comments table
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- =========================================================

-- 1. Add parent_id column if not exists
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS parent_id BIGINT REFERENCES public.comments(id) ON DELETE CASCADE;

-- 2. Create index for fast lookups of replies
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);
