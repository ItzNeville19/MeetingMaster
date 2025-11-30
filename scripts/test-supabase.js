// Quick test script to verify Supabase connection
// Run with: node scripts/test-supabase.js

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('\n🔍 Testing Supabase Connection...\n');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅' : '❌');
  process.exit(1);
}

if (supabaseKey.includes('YourFullKeyHere') || supabaseKey.length < 100) {
  console.error('❌ Anon key appears to be incomplete!');
  console.error('   Current key length:', supabaseKey.length);
  console.error('   Expected: 200+ characters');
  console.error('\n   Please replace the placeholder in .env.local with your full anon key');
  process.exit(1);
}

console.log('✅ Credentials found');
console.log('   URL:', supabaseUrl);
console.log('   Key length:', supabaseKey.length, 'characters\n');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Test 1: Check if we can connect
    console.log('📡 Testing connection...');
    const { data, error } = await supabase
      .from('reports')
      .select('count')
      .limit(1);
    
    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
        console.error('❌ Tables not found!');
        console.error('   Error:', error.message);
        console.error('\n   📝 ACTION REQUIRED:');
        console.error('   1. Go to: https://supabase.com/dashboard/project/fepsychyznukimmxqshj/sql/new');
        console.error('   2. Copy/paste the contents of supabase-schema.sql');
        console.error('   3. Click "Run"');
        process.exit(1);
      } else if (error.code === 'PGRST301' || error.message.includes('permission') || error.message.includes('RLS')) {
        console.error('❌ Permission error (RLS might be enabled)');
        console.error('   Error:', error.message);
        console.error('\n   📝 ACTION REQUIRED:');
        console.error('   Make sure RLS is disabled in supabase-schema.sql');
        console.error('   (It should have: ALTER TABLE reports DISABLE ROW LEVEL SECURITY;)');
        process.exit(1);
      } else {
        throw error;
      }
    }
    
    console.log('✅ Connection successful!');
    console.log('✅ Tables exist and accessible\n');
    
    // Test 2: Check table structure
    console.log('📊 Checking table structure...');
    const { data: sampleData, error: sampleError } = await supabase
      .from('reports')
      .select('*')
      .limit(1);
    
    if (sampleError && !sampleError.message.includes('0 rows')) {
      console.warn('⚠️  Warning:', sampleError.message);
    } else {
      console.log('✅ Table structure looks good');
      if (sampleData && sampleData.length > 0) {
        console.log('   Found', sampleData.length, 'sample report(s)');
      } else {
        console.log('   Table is empty (this is OK for a new setup)');
      }
    }
    
    console.log('\n🎉 Supabase is fully configured and working!');
    console.log('   You can now restart your dev server: npm run dev\n');
    
  } catch (error) {
    console.error('\n❌ Connection failed!');
    console.error('   Error:', error.message);
    console.error('\n   Please check:');
    console.error('   1. Your .env.local has the correct credentials');
    console.error('   2. You ran the SQL schema in Supabase');
    console.error('   3. Your Supabase project is active');
    process.exit(1);
  }
}

testConnection();

