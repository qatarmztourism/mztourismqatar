import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const envPath = path.resolve(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const envVars = {};
for (const line of envContent.split(/\r?\n/)) {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) envVars[m[1].trim()] = m[2].trim().replace(/^["'](.*)["']$/, "$1");
}

const client = createClient(envVars["NEXT_PUBLIC_SUPABASE_URL"], envVars["SUPABASE_SERVICE_ROLE_KEY"]);

async function checkTables() {
  const knownTables = [
    "services", "bookings", "admin_users", "deposit_proofs", 
    "booking_payments", "custom_trip_requests", "cms_site_settings",
    "cms_pages", "cms_homepage_sections", "cms_navigation", "cms_faqs", "cms_testimonials"
  ];
  
  for (const table of knownTables) {
    const { data, error } = await client.from(table).select("*").limit(1);
    if (error) {
      console.log(`Table [${table}]: NOT FOUND or ERROR:`, error.message);
    } else {
      console.log(`Table [${table}]: EXISTS (rows: ${data ? data.length : 0})`);
    }
  }
}

checkTables().then(() => process.exit(0)).catch(console.error);
