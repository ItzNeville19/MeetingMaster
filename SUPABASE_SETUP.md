# Supabase Setup Guide

## Overview
Supabase is now the **PRIMARY** database for LifeØS. All reports and privacy agreements are saved to Supabase first, with Firestore and local storage as backups.

## Setup Steps

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

### 2. Add Environment Variables
Add to your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run Database Schema
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Run the SQL from `supabase-schema.sql`

This creates:
- `reports` table (for compliance reports)
- `privacy_agreements` table (for legal records)

### 4. Disable RLS (if using Clerk auth)
Since we're using Clerk (not Supabase Auth), you may need to disable Row Level Security or adjust policies:

```sql
-- Option 1: Disable RLS (authorization handled in API routes)
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_agreements DISABLE ROW LEVEL SECURITY;

-- Option 2: Keep RLS but allow service role (recommended for production)
-- Use service role key in server-side code for admin operations
```

## Database Hierarchy

1. **PRIMARY: Supabase** - Always tried first
2. **BACKUP 1: Firestore** - Used if Supabase fails
3. **BACKUP 2: Local Storage** - Client-side backup

## Privacy Agreements

Privacy agreements are saved to:
1. **Supabase** (primary legal record)
2. **Firestore** (backup)
3. **Local files** (`/meeting-master-agreements/`) - for legal evidence

All agreements include:
- User ID and email
- IP address
- User agent
- Timestamp
- Agreement version
- "Don't show again" preference

## Testing

After setup, verify:
1. Reports save to Supabase
2. Privacy agreements save to Supabase
3. Reports appear in dashboard
4. Privacy modal shows on first visit

## Troubleshooting

If Supabase fails:
- Check environment variables
- Verify table schema is created
- Check Supabase logs
- System will automatically fall back to Firestore

