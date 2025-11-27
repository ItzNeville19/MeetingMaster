import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const currentMetadata = user.publicMetadata as Record<string, any>;

    // Check if user has Pro tier
    const tier = currentMetadata?.subscription?.tier || 'free';
    if (tier !== 'pro') {
      return NextResponse.json({ error: 'Pro subscription required' }, { status: 403 });
    }

    // Generate new API key
    const apiKey = `lifeos_${uuidv4().replace(/-/g, '')}`;

    // Save API key to metadata
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...currentMetadata,
        apiKey: {
          key: apiKey,
          createdAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({ success: true, apiKey });
  } catch (error) {
    console.error('Generate API key error:', error);
    return NextResponse.json({ error: 'Failed to generate API key' }, { status: 500 });
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
      apiKey: metadata.apiKey || null,
    });
  } catch (error) {
    console.error('Get API key error:', error);
    return NextResponse.json({ error: 'Failed to get API key' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const currentMetadata = user.publicMetadata as Record<string, any>;

    // Remove API key
    const { apiKey, ...restMetadata } = currentMetadata;
    await client.users.updateUserMetadata(userId, {
      publicMetadata: restMetadata,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete API key error:', error);
    return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 });
  }
}

