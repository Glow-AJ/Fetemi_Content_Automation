/* eslint-disable */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
  console.log(`Connecting to: ${supabaseUrl}`);
  console.log(`Testing auth for: ajirtgloryemieje@gmail.com`);
  
  // Use a dummy password just to see if we hit a valid user or network error
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'ajirtgloryemieje@gmail.com',
    password: 'Password123!',
  });

  if (error) {
    console.error("AUTH ERROR:", error);
  } else {
    console.log("AUTH SUCCESS for:", data.user?.email);
  }
}

testAuth();
