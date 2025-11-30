# 🚀 Supabase Setup - Almost Done!

## ✅ What's Already Done

1. ✅ Supabase project created: `fepsychyznukimmxqshj`
2. ✅ URL added to `.env.local`: `https://fepsychyznukimmxqshj.supabase.co`
3. ✅ SQL schema file ready: `supabase-schema.sql`
4. ✅ Test endpoint created: `/api/test-supabase`

## 📝 What You Need to Do (2 Steps)

### Step 1: Add Your Full Anon Key

1. Open `.env.local` in your editor
2. Find this line:
   ```
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlcHN5Y2h5em51a2ltbXhxc2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzY0MDAsImV4cCI6MjA1MDU1MjQwMH0.YourFullKeyHere
   ```
3. Replace `YourFullKeyHere` with your **FULL** anon key from Supabase
   - Go to: https://supabase.com/dashboard/project/fepsychyznukimmxqshj/settings/api
   - Click "Reveal" next to "anon public" key
   - Copy the ENTIRE key (should be 200+ characters)
   - Paste it to replace `YourFullKeyHere`
4. Save the file

### Step 2: Run the SQL Schema

1. Open SQL Editor: https://supabase.com/dashboard/project/fepsychyznukimmxqshj/sql/new
2. Open `supabase-schema.sql` file locally
3. Copy ALL contents (Cmd+A, Cmd+C)
4. Paste into the SQL Editor
5. Click **"Run"** button (or press Cmd+Enter)
6. You should see: "Success. No rows returned"

## ✅ Test It

After completing both steps:

1. **Restart your dev server:**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

2. **Test the connection:**
   - Open: http://localhost:3000/api/test-supabase
   - You should see: `{"success":true,"message":"Supabase is fully configured and working!"}`

3. **Upload a document:**
   - Go to dashboard
   - Upload a file
   - Check browser console for: `[Supabase] ✅ Report saved successfully`

## 🎉 Done!

Once you see the success message, Supabase is your primary database and everything will work perfectly!

## 🆘 Troubleshooting

### "Supabase not configured" error
- Check `.env.local` has both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Make sure the anon key is the FULL key (200+ characters)
- Restart dev server after adding variables

### "Tables not found" error
- You haven't run the SQL schema yet
- Go to SQL Editor and run `supabase-schema.sql`

### "Permission denied" error
- RLS might still be enabled
- Make sure the SQL schema has: `ALTER TABLE reports DISABLE ROW LEVEL SECURITY;`
- Re-run the SQL schema

### Still not working?
- Check: http://localhost:3000/api/test-supabase
- It will tell you exactly what's wrong and how to fix it

