// verify-rls-policies.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase credentials not found in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPolicies() {
  try {
    console.log('Checking RLS policies...');
    
    // Query to get all policies
    const { data, error } = await supabase.rpc('get_policies');
    
    if (error) {
      console.error('Error fetching policies:', error);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('No RLS policies found');
      return;
    }
    
    // Group policies by table
    const policiesByTable = {};
    data.forEach(policy => {
      if (!policiesByTable[policy.table_name]) {
        policiesByTable[policy.table_name] = [];
      }
      policiesByTable[policy.table_name].push(policy);
    });
    
    // Display policies by table
    console.log('\n=== RLS Policies by Table ===\n');
    
    Object.keys(policiesByTable).sort().forEach(tableName => {
      console.log(`\nTable: ${tableName}`);
      console.log('-'.repeat(tableName.length + 7));
      
      policiesByTable[tableName].forEach(policy => {
        console.log(`  - ${policy.policy_name}`);
        console.log(`    Operation: ${policy.operation}`);
        console.log(`    Using expression: ${policy.using_expression}`);
        if (policy.with_check_expression && policy.with_check_expression !== policy.using_expression) {
          console.log(`    With check: ${policy.with_check_expression}`);
        }
        console.log('');
      });
    });
    
    console.log('Policy verification complete!');
  } catch (err) {
    console.error('Unexpected error checking policies:', err);
  }
}

// Create a custom RPC function to get policies if it doesn't exist
async function createPoliciesFunction() {
  try {
    const { error } = await supabase.rpc('get_policies');
    
    // If the function doesn't exist, create it
    if (error && error.message.includes('function does not exist')) {
      console.log('Creating helper function to retrieve policies...');
      
      const createFunctionSQL = `
        CREATE OR REPLACE FUNCTION get_policies()
        RETURNS TABLE (
          table_name text,
          policy_name text,
          operation text,
          roles text[],
          using_expression text,
          with_check_expression text
        ) 
        LANGUAGE SQL
        SECURITY DEFINER
        SET search_path = public
        AS $$
          SELECT
            schemaname || '.' || tablename AS table_name,
            policyname AS policy_name,
            cmd AS operation,
            roles,
            qualifier AS using_expression,
            with_check AS with_check_expression
          FROM pg_policies
          ORDER BY schemaname, tablename, policyname;
        $$;
      `;
      
      const { error: createError } = await supabase.rpc('exec_sql', { sql: createFunctionSQL });
      
      if (createError) {
        if (createError.message.includes('function "exec_sql" does not exist')) {
          console.error('Error: You need admin access to create the helper function. Please apply this manually in the Supabase dashboard SQL Editor.');
          return false;
        }
        console.error('Error creating helper function:', createError);
        return false;
      }
      
      return true;
    }
    
    return true;
  } catch (err) {
    console.error('Error setting up policy verification:', err);
    return false;
  }
}

// Main execution
async function main() {
  const functionCreated = await createPoliciesFunction();
  if (functionCreated) {
    await checkPolicies();
  } else {
    console.log('\nAlternative: Check policies through the Supabase dashboard at:');
    console.log('https://app.supabase.com/project/_/auth/policies');
  }
}

main();
