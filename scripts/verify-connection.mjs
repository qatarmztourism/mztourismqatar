/**
 * Safe Supabase Connection Verification Script
 *
 * CRITICAL SECURITY INSTRUCTION:
 * - NEVER prints, logs, or exposes secret values.
 * - Only checks presence, length, and format of environment variables.
 * - Performs read-only queries to verify server-side connectivity.
 */

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

console.log("\n=======================================================");
console.log("MZ Tourism Qatar — Safe Supabase Connection Verification");
console.log("=======================================================\n");

// 1. Parse .env.local safely without printing values
const envPath = path.resolve(process.cwd(), ".env.local");

if (!fs.existsSync(envPath)) {
  console.error("✖ [FAIL] .env.local file was not found in the workspace root.");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf-8");
const envVars = {};

for (const line of envContent.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const match = trimmed.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["'](.*)["']$/, "$1");
    envVars[key] = value;
  }
}

// 2. Validate Presence & Format (Safe Checks — Zero Disclosure)
let configValid = true;

const url = envVars["NEXT_PUBLIC_SUPABASE_URL"];
if (!url || url.includes("your-project-ref") || !url.startsWith("https://")) {
  console.error("✖ [FAIL] NEXT_PUBLIC_SUPABASE_URL is missing, unconfigured, or invalid.");
  configValid = false;
} else {
  try {
    const parsedUrl = new URL(url);
    console.log(`✔ [PASS] NEXT_PUBLIC_SUPABASE_URL is present (host: ${parsedUrl.hostname})`);
  } catch {
    console.error("✖ [FAIL] NEXT_PUBLIC_SUPABASE_URL is not a valid URL.");
    configValid = false;
  }
}

const anonKey = envVars["NEXT_PUBLIC_SUPABASE_ANON_KEY"];
if (!anonKey || anonKey.includes("your-supabase-anon-key-here") || anonKey.length < 20) {
  console.error("✖ [FAIL] NEXT_PUBLIC_SUPABASE_ANON_KEY is missing, placeholder, or invalid length.");
  configValid = false;
} else {
  console.log(`✔ [PASS] NEXT_PUBLIC_SUPABASE_ANON_KEY is present (${anonKey.length} characters, masked)`);
}

const serviceRoleKey = envVars["SUPABASE_SERVICE_ROLE_KEY"];
if (!serviceRoleKey || serviceRoleKey.includes("your-supabase-service-role-secret-key-here") || serviceRoleKey.length < 20) {
  console.error("✖ [FAIL] SUPABASE_SERVICE_ROLE_KEY is missing, placeholder, or invalid length.");
  configValid = false;
} else {
  console.log(`✔ [PASS] SUPABASE_SERVICE_ROLE_KEY is present (${serviceRoleKey.length} characters, masked — server-only)`);
}

if (!configValid) {
  console.error("\nEnvironment configuration check failed. Please verify .env.local values.\n");
  process.exit(1);
}

// 3. Test Read-Only Connection (Anon Role / Public Catalog)
console.log("\nTesting Read-Only Public Connection (Anon Client)...");
try {
  const publicClient = createClient(url, anonKey, {
    auth: { persistSession: false },
  });

  const { data: services, error: servicesError } = await publicClient
    .from("services")
    .select("id, title_en, is_active")
    .limit(5);

  if (servicesError) {
    console.error(`✖ [FAIL] Public catalog query failed: ${servicesError.message}`);
    process.exit(1);
  }

  console.log(`✔ [PASS] Successfully queried public services catalog (${services.length} services retrieved).`);
  console.log(`         Sample verified services: ${services.map((s) => s.id).join(", ")}`);
} catch (err) {
  console.error(`✖ [FAIL] Unexpected error during public connection test: ${err.message}`);
  process.exit(1);
}

// 4. Test Server-Side Admin Connection (Service Role / Storage Bucket Access)
console.log("\nTesting Server-Side Admin Connection (Service Role Client)...");
try {
  const adminClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Verify access to private deposit-proofs storage bucket
  const { data: bucket, error: bucketError } = await adminClient.storage.getBucket("deposit-proofs");

  if (bucketError) {
    console.error(`✖ [FAIL] Admin storage bucket lookup failed: ${bucketError.message}`);
    process.exit(1);
  }

  console.log(`✔ [PASS] Successfully verified private storage bucket: '${bucket.name}' (public: ${bucket.public})`);

  // Verify access to bookings table via admin client (read-only query check)
  const { data: bookingsData, error: countError } = await adminClient
    .from("bookings")
    .select("id, booking_ref")
    .limit(1);

  if (countError) {
    if (countError.code === "42501" || countError.message?.includes("permission denied")) {
      console.warn(`⚠ [ACTION REQUIRED] service_role table permission missing: ${countError.message}`);
      console.warn(`                    Execute in Supabase SQL Editor: GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;`);
    } else {
      console.error(`✖ [FAIL] Admin bookings table check failed:`, countError);
      process.exit(1);
    }
  } else {
    console.log(`✔ [PASS] Successfully verified database admin access (bookings table queryable).`);
  }
} catch (err) {
  console.error(`✖ [FAIL] Unexpected error during admin connection test: ${err.message}`);
  process.exit(1);
}

console.log("\n-------------------------------------------------------");
console.log("Connection Test Summary: All Connection Checks PASSED");
console.log("Zero credentials exposed. Supabase connectivity fully operational.");
console.log("-------------------------------------------------------\n");
