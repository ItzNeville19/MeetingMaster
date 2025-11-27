import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { member } = await request.json();

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const currentMetadata = user.publicMetadata as Record<string, any>;

    // Check if user has Growth or Pro tier
    const tier = currentMetadata?.subscription?.tier || 'free';
    if (tier !== 'growth' && tier !== 'pro') {
      return NextResponse.json({ error: 'Growth or Pro subscription required' }, { status: 403 });
    }

    // Get existing team members
    const existingTeam = currentMetadata.team || { members: [], pendingInvites: [] };
    const existingMembers = existingTeam.members || [];

    // Add new member
    const updatedMembers = [...existingMembers, member];

    // Update team in metadata
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...currentMetadata,
        team: {
          ...existingTeam,
          members: updatedMembers,
          updatedAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({ success: true, member });
  } catch (error) {
    console.error('Save team member error:', error);
    return NextResponse.json({ error: 'Failed to save team member' }, { status: 500 });
  }
}

