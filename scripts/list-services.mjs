import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const envPath = path.resolve(process.cwd(), ".env.local");
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

const client = createClient(
  envVars["NEXT_PUBLIC_SUPABASE_URL"],
  envVars["NEXT_PUBLIC_SUPABASE_ANON_KEY"]
);

const { data, error } = await client.from("services").select("*");
if (error) {
  console.error("Error:", error);
} else {
  console.log("Total services in database:", data.length);
  console.log(JSON.stringify(data, null, 2));
}
