import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    
    if (!supabase) {
      return NextResponse.json({
        success: false,
        error: 'Supabase not configured',
        message: 'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local',
        fix: 'Add both variables to .env.local and restart the server',
      }, { status: 500 });
    }

    // Test connection by trying to query the reports table
    const { data, error } = await supabase
      .from('reports')
      .select('count')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
        return NextResponse.json({
          success: false,
          error: 'Tables not found',
          message: 'The reports table does not exist in Supabase',
          fix: 'Run the SQL schema in Supabase SQL Editor. Copy supabase-schema.sql and paste it into the SQL Editor, then click Run.',
          sqlEditorUrl: 'https://supabase.com/dashboard/project/fepsychyznukimmxqshj/sql/new',
        }, { status: 500 });
      } else if (error.code === 'PGRST301' || error.message.includes('permission') || error.message.includes('RLS')) {
        return NextResponse.json({
          success: false,
          error: 'Permission denied (RLS)',
          message: 'Row Level Security is blocking access',
          fix: 'Make sure RLS is disabled. The SQL schema should have: ALTER TABLE reports DISABLE ROW LEVEL SECURITY;',
        }, { status: 500 });
      } else {
        return NextResponse.json({
          success: false,
          error: 'Connection error',
          message: error.message,
          code: error.code,
        }, { status: 500 });
      }
    }

    // Success!
    return NextResponse.json({
      success: true,
      message: 'Supabase is fully configured and working!',
      tables: 'reports table exists and is accessible',
      nextSteps: [
        'Your Supabase setup is complete',
        'Reports will now be saved to Supabase as the primary database',
        'You can upload documents and they will be saved to Supabase',
      ],
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

