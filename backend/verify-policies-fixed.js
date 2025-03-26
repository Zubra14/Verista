// verify-policies-fixed.js
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Explicitly load the .env file from the current directory
const envPath = path.resolve(__dirname, '.env');
console.log(`Looking for .env file at: ${envPath}`);

if (fs.existsSync(envPath)) {
  console.log('.env file found, loading variables...');
  dotenv.config({ path: envPath });
} else {
  console.error('.env file not found at the specified path');
  process.exit(1);
}

// Log available environment variables (without sensitive values)
console.log('Environment variables loaded:');
console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_KEY exists:', !!process.env.SUPABASE_SERVICE_KEY);
console.log('SUPABASE_ANON_KEY exists:', !!process.env.SUPABASE_ANON_KEY);

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase credentials not found in environment variables');
  console.log('Available environment variables:', Object.keys(process.env).filter(key => !key.includes('KEY')));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Simple test to verify connection
async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase.from('pg_policies').select('*').limit(1);
    
    if (error) {
      console.error('Connection test failed:', error);
      return false;
    }
    
    console.log('Connection successful!');
    return true;
  } catch (err) {
    console.error('Unexpected error testing connection:', err);
    return false;
  }
}

// Main execution
async function main() {
  const connected = await testConnection();
  if (connected) {
    console.log('You can now proceed to check policies or apply changes');
  } else {
    console.log('Please verify your Supabase credentials and try again');
  }
}

main();
