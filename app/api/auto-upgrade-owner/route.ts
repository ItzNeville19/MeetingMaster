import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

// Owner email - gets lifetime Pro + Dev access
const OWNER_EMAIL = 'neville@rayze.xyz';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    
    // Get user's email
    const userEmail = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress || 
                     user.emailAddresses[0]?.emailAddress;
    
    // Check if this is the owner
    if (userEmail?.toLowerCase() !== OWNER_EMAIL.toLowerCase()) {
      return NextResponse.json({ 
        success: false, 
        message: 'Not owner account' 
      });
    }

    // Get current metadata
    const currentMetadata = user.publicMetadata as Record<string, any>;
    const currentSubscription = currentMetadata.subscription || {};

    // Check if already upgraded
    if (currentSubscription.tier === 'pro' && currentSubscription.isOwner === true) {
      return NextResponse.json({ 
        success: true, 
        message: 'Already upgraded',
        tier: 'pro',
        isOwner: true
      });
    }

    // Upgrade to Pro with owner/dev access
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...currentMetadata,
        subscription: {
          tier: 'pro',
          isOwner: true,
          isDev: true,
          uploadsUsed: currentSubscription.uploadsUsed || 0,
          uploadsLimit: -1, // Unlimited
          teamMembersLimit: -1, // Unlimited
          locationsLimit: -1, // Unlimited
          upgradedAt: new Date().toISOString(),
          upgradedBy: 'owner-auto-upgrade',
        },
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Upgraded to Pro with Dev access',
      tier: 'pro',
      isOwner: true,
      isDev: true,
    });
  } catch (error) {
    console.error('Auto-upgrade error:', error);
    return NextResponse.json({ 
      error: 'Failed to upgrade account' 
    }, { status: 500 });
  }
}

// GET endpoint to check status
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    
    const userEmail = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress || 
                     user.emailAddresses[0]?.emailAddress;
    
    const isOwner = userEmail?.toLowerCase() === OWNER_EMAIL.toLowerCase();
    const subscription = user.publicMetadata?.subscription as any;
    
    return NextResponse.json({ 
      isOwner,
      tier: subscription?.tier || 'free',
      isDev: subscription?.isDev || false,
      subscription,
    });
  } catch (error) {
    console.error('Check owner status error:', error);
    return NextResponse.json({ 
      error: 'Failed to check status' 
    }, { status: 500 });
  }
}

