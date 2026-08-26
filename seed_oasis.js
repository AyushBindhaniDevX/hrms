const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
const crypto = require('crypto');

function uuidv4() {
  return crypto.randomUUID();
}

// Connect to remote supabase using anon key
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Key in .env file (EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY required)");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const OASIS_ORG_ID = '190b952b-df91-4011-8e48-a5e02fad80fe';

// Seed data arrays
const firstNames = ['Aarav', 'Vihaan', 'Aditya', 'Rohan', 'Karan', 'Arjun', 'Kabir', 'Aryan', 'Ishaan', 'Shaurya', 'Diya', 'Ananya', 'Myra', 'Kavya', 'Sana', 'Aarohi', 'Riya', 'Mira', 'Neha', 'Priya', 'Amit', 'Sunil', 'Raj', 'Vikram', 'Anil', 'Sanjay', 'Pooja', 'Sneha', 'Geeta', 'Swati'];
const lastNames = ['Sharma', 'Verma', 'Gupta', 'Singh', 'Kumar', 'Patel', 'Das', 'Joshi', 'Chopra', 'Rao', 'Yadav', 'Reddy', 'Chauhan', 'Nair', 'Mehta', 'Thakur', 'Garg', 'Rajput', 'Mishra', 'Pandey'];
const departments = ['Engineering', 'Sales', 'Marketing', 'Human Resources', 'Support', 'Product', 'Finance'];
const designations = ['Software Engineer', 'Senior Developer', 'Sales Executive', 'Marketing Manager', 'HR Specialist', 'Support Representative', 'Product Manager', 'Accountant'];

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seedOasis() {
  console.log("Starting Seed Script for Oasis Org: " + OASIS_ORG_ID);

  // Ensure organization exists
  await supabase.from('organizations').upsert({
    id: OASIS_ORG_ID,
    name: 'Oasis HRMS',
    slug: 'oasis',
    package_type: 'gold'
  });

  // Ensure departments exist
  const deptIds = [];
  for (const deptName of departments) {
    const { data } = await supabase.from('departments').upsert({
      id: uuidv4(),
      organization_id: OASIS_ORG_ID,
      name: deptName
    }).select('id').single();
    if (data) deptIds.push(data.id);
  }

  if (deptIds.length === 0) {
    console.error("Failed to create departments. Check RLS policies.");
    process.exit(1);
  }

  // Generate 50 employees
  const newProfiles = [];
  const newEmployees = [];

  for (let i = 1; i <= 50; i++) {
    const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
    const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
    const fullName = `${fn} ${ln}`;
    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@oasis.com`;
    const phone = `+9198${getRandomInt(10000000, 99999999)}`;
    const empCode = `OAS-${String(i).padStart(3, '0')}`;
    const basicSalary = getRandomInt(30, 150) * 1000;
    
    // Auth User mapping (dummy mapping for seed)
    const uid = uuidv4();
    
    newProfiles.push({
      id: uid,
      organization_id: OASIS_ORG_ID,
      full_name: fullName,
      email: email,
      phone: phone,
      role: 'employee',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    newEmployees.push({
      profile_id: uid,
      employee_code: empCode,
      department_id: deptIds[Math.floor(Math.random() * deptIds.length)],
      designation: designations[Math.floor(Math.random() * designations.length)],
      basic_salary: basicSalary,
      employment_status: 'active',
      joining_date: randomDate(new Date(2022, 0, 1), new Date()).toISOString().split('T')[0],
    });
  }

  console.log(`Inserting ${newProfiles.length} profiles...`);
  const { error: profileErr } = await supabase.from('profiles').upsert(newProfiles);
  if (profileErr) console.error("Error inserting profiles:", profileErr);

  console.log(`Inserting ${newEmployees.length} employees...`);
  const { error: empErr } = await supabase.from('employees').upsert(newEmployees);
  if (empErr) console.error("Error inserting employees:", empErr);

  console.log("Seed Completed! Oasis Organization is populated with 50 employees.");
}

seedOasis().catch(console.error);
