import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';

// Owner email - only this user can set subscriptions
const OWNER_EMAIL = 'neville@rayze.xyz';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tier } = await request.json();
    
    if (!['free', 'starter', 'growth', 'pro'].includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    
    // Check if user is owner - only owner can set subscription tiers
    const userEmail = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress;
    if (userEmail !== OWNER_EMAIL) {
      return NextResponse.json({ error: 'Only the owner can modify subscriptions' }, { status: 403 });
    }

    const currentMetadata = user.publicMetadata as Record<string, any>;

    // Update subscription tier
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...currentMetadata,
        subscription: {
          ...(currentMetadata.subscription || {}),
          tier,
          updatedAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({ success: true, tier });
  } catch (error) {
    console.error('Set subscription error:', error);
    return NextResponse.json({ error: 'Failed to set subscription' }, { status: 500 });
  }
}
