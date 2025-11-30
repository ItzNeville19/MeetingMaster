import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Reports will use Firestore and local storage only.');
}

// Create Supabase client for server-side operations
export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}

// Create Supabase client for client-side operations (with user auth)
export function getSupabaseClientWithAuth(accessToken?: string) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  const client = createClient(supabaseUrl, supabaseAnonKey);
  if (accessToken) {
    client.auth.setSession({
      access_token: accessToken,
      refresh_token: '',
    } as any);
  }
  return client;
}

// Save report to Supabase (primary database)
export async function saveReportToSupabase(
  userId: string,
  reportData: {
    id: string;
    fileName: string;
    fileUrl?: string;
    analysis: any;
    createdAt: string;
  }
): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.warn('[Supabase] Not configured, skipping save');
      return false;
    }

    const { error } = await supabase
      .from('reports')
      .upsert({
        id: reportData.id,
        user_id: userId,
        file_name: reportData.fileName,
        file_url: reportData.fileUrl || '',
        analysis: reportData.analysis,
        created_at: reportData.createdAt,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
      });

    if (error) {
      console.error('[Supabase] Error saving report:', error);
      return false;
    }

    console.log('[Supabase] Report saved successfully:', reportData.id);
    return true;
  } catch (error) {
    console.error('[Supabase] Exception saving report:', error);
    return false;
  }
}

// Get reports from Supabase (primary database)
export async function getReportsFromSupabase(userId: string): Promise<any[]> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error('[Supabase] ❌ NOT CONFIGURED - Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local');
      throw new Error('Supabase not configured');
    }

    console.log('[Supabase] ✅ Attempting to fetch reports for user:', userId);
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[Supabase] ❌ Error fetching reports:', error);
      console.error('[Supabase] Error details:', JSON.stringify(error, null, 2));
      throw error; // Throw so caller knows it failed
    }
    
    console.log('[Supabase] ✅ Successfully fetched', data?.length || 0, 'reports');

    // Transform Supabase format to our report format
    const reports = (data || []).map((r: any) => ({
      id: r.id,
      fileName: r.file_name || r.fileName || `Report ${r.id.substring(0, 8)}`,
      fileUrl: r.file_url || r.fileUrl || '',
      fileSize: r.file_size || 0,
      analysis: r.analysis || {},
      createdAt: r.created_at || r.createdAt || new Date().toISOString(),
    }));

    console.log(`[Supabase] Retrieved ${reports.length} reports for user ${userId}`);
    return reports;
  } catch (error) {
    console.error('[Supabase] Exception fetching reports:', error);
    return [];
  }
}

// Get single report from Supabase
export async function getReportFromSupabase(reportId: string, userId: string): Promise<any | null> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return null;
    }

    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      console.error('[Supabase] Error fetching report:', error);
      return null;
    }

    return {
      id: data.id,
      userId: data.user_id || userId,
      fileName: data.file_name || data.fileName || `Report ${data.id.substring(0, 8)}`,
      fileUrl: data.file_url || data.fileUrl || '',
      fileSize: data.file_size || 0,
      analysis: data.analysis || {},
      createdAt: data.created_at || data.createdAt || new Date().toISOString(),
    };
  } catch (error) {
    console.error('[Supabase] Exception fetching report:', error);
    return null;
  }
}

// Save privacy agreement to Supabase (PRIMARY for legal records)
export async function savePrivacyAgreementToSupabase(
  agreementData: {
    agreementId: string;
    userId: string;
    userEmail: string;
    agreed: boolean;
    agreementDate: string;
    dontShowAgain: boolean;
    ipAddress: string;
    userAgent: string;
    agreementText: string;
    agreementVersion: string;
  }
): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.warn('[Supabase] Not configured, skipping privacy agreement save');
      return false;
    }

    const { error } = await supabase
      .from('privacy_agreements')
      .upsert({
        id: agreementData.agreementId,
        user_id: agreementData.userId,
        user_email: agreementData.userEmail,
        agreed: agreementData.agreed,
        agreement_date: agreementData.agreementDate,
        dont_show_again: agreementData.dontShowAgain,
        ip_address: agreementData.ipAddress,
        user_agent: agreementData.userAgent,
        agreement_text: agreementData.agreementText,
        agreement_version: agreementData.agreementVersion,
        created_at: agreementData.agreementDate,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
      });

    if (error) {
      console.error('[Supabase] Error saving privacy agreement:', error);
      return false;
    }

    console.log('[Supabase] Privacy agreement saved successfully:', agreementData.agreementId);
    return true;
  } catch (error) {
    console.error('[Supabase] Exception saving privacy agreement:', error);
    return false;
  }
}

// Save user profile to Supabase (for cross-device sync)
export async function saveUserProfileToSupabase(
  userId: string,
  userEmail: string,
  profileData: {
    preferences?: any;
    settings?: any;
    recentFiles?: any[];
  }
): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.warn('[Supabase] Not configured, skipping user profile save');
      return false;
    }

    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        id: `profile_${userId}`,
        user_id: userId,
        user_email: userEmail,
        preferences: profileData.preferences || {},
        settings: profileData.settings || {},
        recent_files: profileData.recentFiles || [],
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      console.error('[Supabase] Error saving user profile:', error);
      return false;
    }

    console.log('[Supabase] User profile saved successfully:', userId);
    return true;
  } catch (error) {
    console.error('[Supabase] Exception saving user profile:', error);
    return false;
  }
}

// Get user profile from Supabase (for cross-device sync)
export async function getUserProfileFromSupabase(userId: string): Promise<any | null> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return null;
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      if (error?.code !== 'PGRST116') { // PGRST116 = not found, which is OK
        console.error('[Supabase] Error fetching user profile:', error);
      }
      return null;
    }

    return {
      id: data.id,
      userId: data.user_id,
      userEmail: data.user_email,
      preferences: data.preferences || {},
      settings: data.settings || {},
      recentFiles: data.recent_files || [],
      lastSyncAt: data.last_sync_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('[Supabase] Exception fetching user profile:', error);
    return null;
  }
}
