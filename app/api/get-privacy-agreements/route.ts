import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const { data, error } = await supabase
      .from('privacy_agreements')
      .select('*')
      .eq('user_id', userId)
      .order('agreement_date', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[Supabase] Error fetching privacy agreements:', error);
      return NextResponse.json({ error: 'Failed to fetch privacy agreements' }, { status: 500 });
    }

    // Transform Supabase format to our format
    const agreements = (data || []).map((a: any) => ({
      id: a.id,
      userId: a.user_id,
      userEmail: a.user_email,
      agreed: a.agreed,
      agreementDate: a.agreement_date,
      dontShowAgain: a.dont_show_again,
      ipAddress: a.ip_address,
      userAgent: a.user_agent,
      agreementText: a.agreement_text,
      agreementVersion: a.agreement_version,
      createdAt: a.created_at,
    }));

    return NextResponse.json({ agreements });
  } catch (error) {
    console.error('Failed to get privacy agreements:', error);
    return NextResponse.json(
      { error: 'Failed to get privacy agreements' },
      { status: 500 }
    );
  }
}

