/* eslint-disable */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase Admin credentials in .env.local");
  process.exit(1);
}

// Instantiate the Supabase client with the Service Role key for admin rights
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function provisionOperatorAccount() {
  const targetEmail = 'ajirtgloryemieje@gmail.com';
  const targetPassword = 'Password123!';
  
  console.log(`[Admin] Initiating provisioning sequence for: ${targetEmail}`);
  
  const { data, error } = await supabase.auth.admin.createUser({
    email: targetEmail,
    password: targetPassword,
    email_confirm: true // Auto-confirm the account so they can log in immediately
  });

  if (error) {
    console.error("[Admin] Provisioning Failed:", error.message);
  } else {
    console.log("[Admin] Success: Operator profile created.", data.user?.id);
    console.log("Credentials provisioned:");
    console.log(`Email: ${targetEmail}`);
    console.log(`Password: ${targetPassword}`);
  }
}

provisionOperatorAccount();
