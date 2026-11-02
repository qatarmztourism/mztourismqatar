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

async function checkDepositProofsSchema() {
  const { data, error } = await client.from("deposit_proofs").select("*").limit(1);
  if (error) {
    console.error("Select error:", error);
  } else {
    console.log("Deposit proofs rows:", data);
  }
}

checkDepositProofsSchema().then(() => process.exit(0)).catch(console.error);
