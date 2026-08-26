const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://luwoavohvnpszoceaygu.supabase.co';
const supabaseKey = 'sb_publishable_nP8NBj6IRxPMwF4OUB9nuA_kJLEgoaP';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Testing Supabase Connection & Sign In...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'ayushbindhani001@gmail.com',
    password: 'Nanda@5152'
  });

  if (error) {
    console.log('SignIn Error Details:', JSON.stringify(error, null, 2));
  } else {
    console.log('SUCCESS! Signed in as:', data.user.email);
  }
}

run();
