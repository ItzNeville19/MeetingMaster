import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { saveUserProfileToSupabase, getUserProfileFromSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user email
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const userEmail = user.emailAddresses?.[0]?.emailAddress || '';

    // PRIMARY: Get from Supabase
    let profile = await getUserProfileFromSupabase(userId);
    
    if (profile) {
      console.log('[UserProfile] ✅ Retrieved from Supabase');
      return NextResponse.json({ profile });
    }

    // If no profile exists, return empty profile
    return NextResponse.json({ 
      profile: {
        preferences: {},
        settings: {},
        recentFiles: [],
      }
    });
  } catch (error) {
    console.error('Failed to get user profile:', error);
    return NextResponse.json(
      { error: 'Failed to get user profile' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profileData = await request.json();
    
    // Get user email
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const userEmail = user.emailAddresses?.[0]?.emailAddress || '';

    // PRIMARY: Save to Supabase
    const success = await saveUserProfileToSupabase(userId, userEmail, {
      preferences: profileData.preferences || {},
      settings: profileData.settings || {},
      recentFiles: profileData.recentFiles || [],
    });

    if (success) {
      console.log('[UserProfile] ✅ Saved to Supabase');
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Failed to save user profile' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Failed to save user profile:', error);
    return NextResponse.json(
      { error: 'Failed to save user profile' },
      { status: 500 }
    );
  }
}

