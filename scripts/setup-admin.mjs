/**
 * MZ Tourism Qatar — First Admin & Staff Provisioning Tool
 *
 * Usage:
 *   node scripts/setup-admin.mjs --list
 *   node scripts/setup-admin.mjs --promote <email> [role]
 *   node scripts/setup-admin.mjs --create <email> <password> <fullName> [role]
 */

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const envPath = path.resolve(process.cwd(), ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("✖ .env.local not found.");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf-8");
const envVars = {};
for (const line of envContent.split(/\r?\n/)) {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) envVars[m[1].trim()] = m[2].trim().replace(/^["'](.*)["']$/, "$1");
}

const supabaseUrl = envVars["NEXT_PUBLIC_SUPABASE_URL"];
const serviceKey = envVars["SUPABASE_SERVICE_ROLE_KEY"];

if (!supabaseUrl || !serviceKey) {
  console.error("✖ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "--list";

  console.log("\n=======================================================");
  console.log("MZ Tourism Qatar — Admin Provisioning & Security Setup");
  console.log("=======================================================\n");

  if (command === "--list") {
    // List existing users and admin status
    const { data: usersData, error: usersErr } = await supabase.auth.admin.listUsers();
    if (usersErr) {
      console.error("✖ Failed to list auth users:", usersErr.message);
      process.exit(1);
    }

    const { data: adminData, error: adminErr } = await supabase
      .from("admin_users")
      .select("id, role, is_active, created_at");

    if (adminErr) {
      console.error("✖ Failed to query admin_users:", adminErr.message);
      process.exit(1);
    }

    const adminMap = new Map((adminData || []).map((a) => [a.id, a]));

    console.log(`Total Registered Users in auth.users: ${usersData.users.length}`);
    console.log(`Total Active Admins in public.admin_users: ${adminData?.length || 0}\n`);

    if (usersData.users.length === 0) {
      console.log("No users found in auth.users.");
      console.log("To create your first super-admin, run:");
      console.log("  node scripts/setup-admin.mjs --create <email> <password> <fullName>\n");
      return;
    }

    for (const u of usersData.users) {
      const adminRec = adminMap.get(u.id);
      const status = adminRec
        ? `[ADMIN: ${adminRec.role.toUpperCase()}${adminRec.is_active ? " (Active)" : " (Disabled)"}]`
        : "[Customer / Guest]";
      console.log(`- ${u.email} (ID: ${u.id}) ${status}`);
    }

    if ((adminData?.length || 0) === 0) {
      console.log("\n⚠ NOTICE: No administrators currently exist in public.admin_users.");
      console.log("To promote an existing user to super-admin, run:");
      console.log(`  node scripts/setup-admin.mjs --promote ${usersData.users[0]?.email || "<email>"}\n`);
    }
  } else if (command === "--promote") {
    const targetEmail = args[1];
    const targetRole = args[2] || "super_admin";

    if (!targetEmail) {
      console.error("✖ Error: Email is required. E.g.: node scripts/setup-admin.mjs --promote admin@mztourism.qa");
      process.exit(1);
    }

    const { data: usersData, error: usersErr } = await supabase.auth.admin.listUsers();
    if (usersErr || !usersData?.users) {
      console.error("✖ Could not query users:", usersErr?.message);
      process.exit(1);
    }

    const user = usersData.users.find((u) => u.email?.toLowerCase() === targetEmail.toLowerCase());
    if (!user) {
      console.error(`✖ No user found in auth.users matching email: ${targetEmail}`);
      process.exit(1);
    }

    const { error: upsertErr } = await supabase
      .from("admin_users")
      .upsert(
        {
          id: user.id,
          role: targetRole,
          is_active: true,
        },
        { onConflict: "id" }
      );

    if (upsertErr) {
      console.error("✖ Failed to elevate user:", upsertErr.message);
      process.exit(1);
    }

    console.log(`✔ SUCCESS: User ${user.email} (${user.id}) is now elevated to ${targetRole} in public.admin_users.`);
  } else if (command === "--reset-password") {
    const targetEmail = args[1];
    const newPassword = args[2];

    if (!targetEmail || !newPassword) {
      console.error("✖ Error: Email and new password are required.");
      console.error("  Usage: node scripts/setup-admin.mjs --reset-password <email> <newPassword>");
      process.exit(1);
    }

    if (newPassword.length < 8) {
      console.error("✖ Error: Password must be at least 8 characters long for administrative clearance.");
      process.exit(1);
    }

    const { data: usersData, error: usersErr } = await supabase.auth.admin.listUsers();
    if (usersErr || !usersData?.users) {
      console.error("✖ Could not query users:", usersErr?.message);
      process.exit(1);
    }

    const user = usersData.users.find((u) => u.email?.toLowerCase() === targetEmail.toLowerCase());
    if (!user) {
      console.error(`✖ No user found in auth.users matching email: ${targetEmail}`);
      process.exit(1);
    }

    const { error: updateErr } = await supabase.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });

    if (updateErr) {
      console.error("✖ Failed to update password:", updateErr.message);
      process.exit(1);
    }

    console.log(`✔ SUCCESS: Password successfully updated for ${user.email}.`);
    console.log("  You can now log in at http://localhost:3000/en/admin with your updated credentials.");
  } else if (command === "--create") {
    const email = args[1];
    const password = args[2];
    const fullName = args[3] || "MZ Tourism Super Admin";
    const role = args[4] || "super_admin";

    if (!email || !password) {
      console.error("✖ Error: email and password are required.");
      console.error("  Usage: node scripts/setup-admin.mjs --create <email> <password> <fullName> [role]");
      process.exit(1);
    }

    const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (createErr || !newUser?.user) {
      console.error("✖ Failed to create user in auth.users:", createErr?.message);
      process.exit(1);
    }

    // Insert profile
    await supabase.from("profiles").upsert(
      {
        id: newUser.user.id,
        email,
        full_name: fullName,
        preferred_locale: "en",
      },
      { onConflict: "id" }
    );

    // Insert into admin_users
    const { error: adminErr } = await supabase.from("admin_users").upsert(
      {
        id: newUser.user.id,
        role,
        is_active: true,
      },
      { onConflict: "id" }
    );

    if (adminErr) {
      console.error("✖ Failed to add user to admin_users:", adminErr.message);
      process.exit(1);
    }

    console.log(`✔ SUCCESS: Created new ${role} administrator:`);
    console.log(`  Email: ${email}`);
    console.log(`  User ID: ${newUser.user.id}`);
  } else {
    console.log("Usage: node scripts/setup-admin.mjs [--list | --promote <email> [role] | --create <email> <password> <name> [role] | --reset-password <email> <newPassword>]");
  }
}

main();
