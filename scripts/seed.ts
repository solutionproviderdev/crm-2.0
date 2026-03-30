import { createClient } from "@supabase/supabase-js";

// Note: To run this script, ensure you have NEXT_PUBLIC_SUPABASE_URL 
// and SUPABASE_SERVICE_ROLE_KEY set.
// Run with: npx tsx scripts/seed.ts

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing environment variables. Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.");
  console.log("Tip: Run with 'npx tsx --env-file=.env.local scripts/seed.ts'");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  console.log("🚀 Starting seed script...");

  // 1. Get Departments
  const { data: departments } = await supabase.from("departments").select("*");
  if (!departments || departments.length === 0) {
    console.error("❌ No departments found. Please run the migration SQL first.");
    return;
  }

  const adminDept = departments.find(d => d.name === 'Administration');
  const salesDept = departments.find(d => d.name === 'Sales') || departments[0];

  // 2. Get Roles
  const { data: roles } = await supabase.from("roles").select("*");
  if (!roles || roles.length === 0) {
    console.error("❌ No roles found. Please run the migration SQL first.");
    return;
  }

  const superAdminRole = roles.find(r => r.name === 'Super Admin') || roles[0];
  const salesRole = roles.find(r => r.name === 'Sales Executive') || roles[0];

  // 3. Define users to seed
  const usersToSeed = [
    {
      email: "admin@example.com",
      password: "password123",
      name: "System Admin",
      type: "Admin",
      department_id: adminDept?.id,
      role_id: superAdminRole?.id,
    },
    {
      email: "sales@example.com",
      password: "password123",
      name: "John Sales",
      type: "Operator",
      department_id: salesDept?.id,
      role_id: salesRole?.id,
    }
  ];

  for (const u of usersToSeed) {
    console.log(`👤 Seeding user: ${u.email}...`);

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { name: u.name, type: u.type }
    });

    if (authError) {
      if (authError.message.includes("already registered")) {
        console.log(`ℹ️ User ${u.email} already exists in Auth. Updating profile...`);
        const { data: listData } = await supabase.auth.admin.listUsers();
        const found = listData.users.find(aud => aud.email === u.email);
        if (found) await syncPublicProfile(found.id, u);
      } else {
        console.error(`❌ Error creating auth user ${u.email}:`, authError.message);
      }
      continue;
    }

    if (authUser.user) {
      await syncPublicProfile(authUser.user.id, u);
    }
  }

  console.log("✅ Seeding completed!");
}

async function syncPublicProfile(id: string, userData: any) {
  const { error: syncError } = await supabase
    .from("users")
    .upsert({
      id: id,
      email: userData.email,
      name: userData.name,
      type: userData.type,
      department_id: userData.department_id,
      role_id: userData.role_id,
      status: "Active",
    })
    .eq("id", id);

  if (syncError) {
    console.error(`❌ Error syncing profile for ${userData.email}:`, syncError.message);
  } else {
    console.log(`✨ Profile synced for ${userData.email}`);
  }
}

main().catch(err => {
  console.error("💥 Fatal error during seeding:", err);
  process.exit(1);
});
