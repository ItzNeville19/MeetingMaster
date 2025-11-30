# Supabase Setup Instructions - MAKE IT WORK! 🚀

## What You Need (2 Things)

1. **Supabase Project URL** - Looks like: `https://xxxxx.supabase.co`
2. **Supabase Anon Key** - A long string starting with `eyJ...`

## Step-by-Step Setup (5 minutes)

### 1. Create Supabase Account & Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name**: `lifeos` (or whatever you want)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you
5. Click "Create new project"
6. Wait 2-3 minutes for project to be ready

### 2. Get Your Credentials
1. In your Supabase project dashboard, click **Settings** (gear icon)
2. Click **API** in the left sidebar
3. You'll see:
   - **Project URL**: Copy this (looks like `https://xxxxx.supabase.co`)
   - **anon public** key: Click "Reveal" and copy this (long string)

### 3. Create the Database Tables
1. In Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy and paste the ENTIRE contents of `supabase-schema.sql`
4. Click **Run** (or press Cmd/Ctrl + Enter)
5. You should see "Success. No rows returned"

### 4. Add to Your .env.local File
Open `.env.local` (create it if it doesn't exist) and add:

```env
# Supabase (Primary Database) - REQUIRED
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Replace:**
- `https://xxxxx.supabase.co` with your actual Project URL
- `eyJ...` with your actual anon key

### 5. Restart Your Dev Server
```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

## Verify It's Working

1. Upload a document
2. Check your browser console - you should see:
   - `[Supabase] ✅ Successfully fetched X reports`
   - `[Supabase] ✅ Report saved successfully`

3. Check Supabase dashboard:
   - Go to **Table Editor** → `reports` table
   - You should see your reports!

## Troubleshooting

### "Supabase not configured" error
- Check `.env.local` file exists
- Check variables are named exactly: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart dev server after adding variables

### "relation 'reports' does not exist" error
- You didn't run the SQL schema
- Go to SQL Editor and run `supabase-schema.sql`

### "permission denied" error
- RLS (Row Level Security) might be blocking
- Go to SQL Editor and run:
  ```sql
  ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
  ALTER TABLE privacy_agreements DISABLE ROW LEVEL SECURITY;
  ```

### Still not working?
1. Check browser console for exact error
2. Check Supabase dashboard → Logs for errors
3. Make sure you're using the **anon public** key, not the service role key

## What Gets Saved to Supabase

- ✅ All compliance reports
- ✅ Privacy agreement records (legal protection)
- ✅ User data (reports linked to user IDs)

## Why Supabase?

- **Primary database** - All data goes here first
- **Fast** - PostgreSQL database
- **Reliable** - Managed by Supabase
- **Free tier** - 500MB database, 2GB bandwidth (plenty for reports)

Once configured, Supabase will be your PRIMARY database and everything will work perfectly! 🎉

