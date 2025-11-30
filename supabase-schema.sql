-- Supabase Database Schema for LifeØS Reports
-- Run this in your Supabase SQL Editor to create the reports table

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT DEFAULT '',
  file_size BIGINT DEFAULT 0,
  analysis JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- NOTE: Since we're using Clerk (not Supabase Auth), we need to disable RLS
-- OR create policies that work with service role key
-- For now, we'll disable RLS and handle auth in API routes (safer for Clerk)

-- Option 1: Disable RLS (Recommended for Clerk)
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;

-- Option 2: If you want RLS enabled, use service role key in API routes
-- (This requires using service role key, not anon key)

-- Privacy Agreements Table (for legal records)
CREATE TABLE IF NOT EXISTS privacy_agreements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  agreed BOOLEAN NOT NULL,
  agreement_date TIMESTAMPTZ NOT NULL,
  dont_show_again BOOLEAN DEFAULT FALSE,
  ip_address TEXT,
  user_agent TEXT,
  agreement_text TEXT NOT NULL,
  agreement_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_privacy_agreements_user_id ON privacy_agreements(user_id);

-- Create index on agreement_date for sorting
CREATE INDEX IF NOT EXISTS idx_privacy_agreements_date ON privacy_agreements(agreement_date DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE privacy_agreements ENABLE ROW LEVEL SECURITY;

-- NOTE: Since we're using Clerk (not Supabase Auth), disable RLS
-- We handle authorization in API routes using Clerk user IDs

ALTER TABLE privacy_agreements DISABLE ROW LEVEL SECURITY;

-- Note: We're using Clerk for authentication, not Supabase Auth.
-- RLS is disabled and authorization is handled in API routes.
-- This is the recommended approach when using external auth providers.

-- User Profiles Table (for cross-device sync)
CREATE TABLE IF NOT EXISTS user_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  user_email TEXT NOT NULL,
  preferences JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  recent_files JSONB DEFAULT '[]',
  last_sync_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Create index on updated_at for sorting
CREATE INDEX IF NOT EXISTS idx_user_profiles_updated_at ON user_profiles(updated_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- NOTE: Since we're using Clerk (not Supabase Auth), disable RLS
-- We handle authorization in API routes using Clerk user IDs

ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Note: User profiles store all user preferences, settings, and recent activity
-- This ensures everything syncs across devices via Supabase

