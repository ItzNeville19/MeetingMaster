import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { digest, alerts, locations } = await request.json();

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const currentMetadata = user.publicMetadata as Record<string, any>;

    // Update settings in metadata
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...currentMetadata,
        settings: {
          digest: digest || currentMetadata.settings?.digest,
          alerts: alerts || currentMetadata.settings?.alerts,
          locations: locations || currentMetadata.settings?.locations,
          updatedAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save settings error:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
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
      settings: metadata.settings || {
        digest: { enabled: false, frequency: 'weekly', email: '' },
        alerts: { enabled: false, email: true, riskThreshold: 7, regulatoryChanges: true },
        locations: [],
      },
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json({ error: 'Failed to get settings' }, { status: 500 });
  }
}

