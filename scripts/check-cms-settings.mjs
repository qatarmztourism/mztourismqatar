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

async function checkCmsSettings() {
  const { data, error } = await client.from("cms_site_settings").select("*").eq("id", "default").maybeSingle();
  if (error) {
    console.error("Query error:", error);
  } else {
    console.log("cms_site_settings record:");
    console.log(JSON.stringify(data, null, 2));
  }
}

checkCmsSettings().then(() => process.exit(0)).catch(console.error);
