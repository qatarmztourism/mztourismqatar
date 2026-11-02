import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "connected";
  let dbLatencyMs = 0;
  let errorMsg: string | null = null;

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

  try {
    const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);
    const queryStart = Date.now();

    // 3-second timeout guard
    const queryPromise = supabase.from("services").select("id").limit(1);
    const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: { message: "Query timeout after 3000ms" } }), 3000)
    );

    const result = await Promise.race([queryPromise, timeoutPromise]);
    dbLatencyMs = Date.now() - queryStart;

    if (result.error) {
      dbStatus = "error";
      errorMsg = result.error.message;
    }
  } catch (err) {
    dbStatus = "unavailable";
    errorMsg = (err as Error).message;
  }

  const isConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const payload = {
    status: dbStatus === "connected" ? "healthy" : "degraded",
    environment: process.env.NODE_ENV || "production",
    timestamp: new Date().toISOString(),
    totalLatencyMs: Date.now() - startTime,
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
      error: errorMsg,
    },
    services: {
      supabaseConfigured: isConfigured,
      storageConfigured: true,
      authConfigured: isConfigured,
    },
    version: "2.0.0",
  };

  const statusCode = dbStatus === "connected" ? 200 : 503;

  return NextResponse.json(payload, {
    status: statusCode,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
