# Vercel Environment Variables Setup Guide

## 🔴 CRITICAL - Required for Build to Succeed

These must be added to Vercel or the build will fail:

### 1. Clerk Authentication (REQUIRED)
- **Key**: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- **Value**: Get from https://dashboard.clerk.com → Your Application → API Keys
- **Format**: `pk_test_...` or `pk_live_...`
- **Why**: Clerk is used for authentication throughout the app

### 2. OpenAI API Key (Already Added ✅)
- **Key**: `OPENAI_API_KEY`
- **Status**: Already configured in Vercel

---

## ⚠️ IMPORTANT - Required for Features to Work

These are needed for full functionality:

### 3. Firebase Configuration
- **Key**: `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- **Value**: Your Firebase project ID (from Firebase Console)
- **Where to get**: https://console.firebase.google.com → Project Settings → General

- **Key**: `NEXT_PUBLIC_FIREBASE_API_KEY`
- **Value**: Your Firebase Web API Key
- **Where to get**: Firebase Console → Project Settings → General → Your apps → Web app config

### 4. Supabase Configuration (Primary Database)
- **Key**: `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: Your Supabase project URL
- **Where to get**: https://supabase.com/dashboard → Your Project → Settings → API

- **Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: Your Supabase anon/public key
- **Where to get**: Supabase Dashboard → Settings → API → Project API keys → anon public

---

## 🔵 OPTIONAL - For Full Functionality

These are optional but recommended:

### 5. Clerk Secret Key
- **Key**: `CLERK_SECRET_KEY`
- **Value**: From Clerk Dashboard → API Keys → Secret Key
- **Why**: Needed for server-side Clerk operations

### 6. Stripe (For Payments)
- **Key**: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- **Key**: `STRIPE_SECRET_KEY`
- **Key**: `STRIPE_WEBHOOK_SECRET`
- **Where to get**: https://dashboard.stripe.com → Developers → API keys

### 7. App URL
- **Key**: `NEXT_PUBLIC_APP_URL`
- **Value**: Your Vercel deployment URL (e.g., `https://meeting-master.vercel.app`)
- **Why**: Used for redirects and webhooks

---

## 📋 Quick Setup Steps in Vercel

1. Go to: https://vercel.com/neville-6986s-projects/meeting-master/settings/environment-variables

2. Add each variable:
   - Click "Add Another" for each new variable
   - Make sure "All Environments" is selected
   - Paste the value from your local `.env.local` file

3. Click "Save" at the bottom

4. Trigger a new deployment:
   - Go to Deployments tab
   - Click "Redeploy" on the latest deployment
   - OR push a new commit to trigger auto-deployment

---

## ✅ Verification

After adding the variables, the build should:
- ✅ Pass TypeScript checks
- ✅ Complete successfully
- ✅ Deploy to production

Your app will be live at: **meeting-master-git-main-neville-6986s-projects.vercel.app**

---

## 🔍 Where to Find Your Values

If you don't have these values, check your local `.env.local` file (it's in your project root but not committed to Git for security).

You can also get them from:
- **Clerk**: https://dashboard.clerk.com
- **Firebase**: https://console.firebase.google.com
- **Supabase**: https://supabase.com/dashboard
- **Stripe**: https://dashboard.stripe.com
- **OpenAI**: https://platform.openai.com/api-keys

