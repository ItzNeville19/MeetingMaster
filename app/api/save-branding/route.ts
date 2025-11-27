import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const branding = await request.json();

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const currentMetadata = user.publicMetadata as Record<string, any>;

    // Check if user has Pro tier
    const tier = currentMetadata?.subscription?.tier || 'free';
    if (tier !== 'pro') {
      return NextResponse.json({ error: 'Pro subscription required' }, { status: 403 });
    }

    // Update branding settings
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...currentMetadata,
        branding: {
          companyName: branding.companyName || '',
          logoUrl: branding.logoUrl || '',
          primaryColor: branding.primaryColor || '#0071e3',
          updatedAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save branding error:', error);
    return NextResponse.json({ error: 'Failed to save branding' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const metadata = user.publicMetadata as Record<string, any>;

    return NextResponse.json({
      branding: metadata.branding || {
        companyName: '',
        logoUrl: '',
        primaryColor: '#0071e3',
      },
    });
  } catch (error) {
    console.error('Get branding error:', error);
    return NextResponse.json({ error: 'Failed to get branding' }, { status: 500 });
  }
}

