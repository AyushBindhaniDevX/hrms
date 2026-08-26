const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://luwoavohvnpszoceaygu.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_KEY || 'sb_publishable_nP8NBj6IRxPMwF4OUB9nuA_kJLEgoaP';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const email = 'ayushbindhani001@gmail.com';
  const password = 'Nanda@5152';
  const fullName = 'Ayush Bindhani';
  const orgId = '00000000-0000-0000-0000-000000000001';

  console.log(`Creating/Signing up admin user: ${email}...`);

  // 1. Sign up user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: 'admin',
        organization_id: orgId,
      },
    },
  });

  if (authError) {
    console.log('SignUp note:', authError.message);
  }

  // 2. Sign in to verify credentials
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    console.error('Sign In Error:', signInError.message);
  } else {
    console.log('Successfully signed in as admin:', signInData.user.email);
    const userId = signInData.user.id;

    // 3. Upsert Profile with admin role
    const now = new Date().toISOString();
    const { error: profError } = await supabase.from('profiles').upsert({
      id: userId,
      organization_id: orgId,
      full_name: fullName,
      email,
      role: 'admin',
      is_active: true,
      created_at: now,
      updated_at: now,
    });

    if (profError) {
      console.error('Profile Upsert Error:', profError.message);
    } else {
      console.log('Profile created/updated with role: ADMIN');
    }

    // 4. Ensure Employee record exists
    const { data: existingEmp } = await supabase.from('employees').select('id').eq('profile_id', userId).maybeSingle();
    if (!existingEmp) {
      const { error: empError } = await supabase.from('employees').insert({
        profile_id: userId,
        employee_code: 'ADM-001',
        designation: 'Principal Administrator',
        basic_salary: 250000,
        employment_status: 'active',
        onboarding_completed: true,
        created_at: now,
        updated_at: now,
      });
      if (empError) console.error('Employee creation error:', empError.message);
      else console.log('Employee record created: ADM-001');
    }
  }
}

main();
