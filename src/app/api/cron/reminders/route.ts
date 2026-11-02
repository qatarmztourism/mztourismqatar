import { NextRequest, NextResponse } from "next/server";
import { processDueRemindersAction } from "@/lib/server/reminder-actions";

/**
 * Secure HTTP endpoint for automated cron services (e.g. Vercel Cron, GitHub Actions, or server cron).
 * Requires authorization header Bearer <CRON_SECRET> or query param ?secret=<CRON_SECRET>.
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    let token = "";

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    } else {
      const { searchParams } = new URL(req.url);
      token = searchParams.get("secret") || "";
    }

    const configuredSecret = process.env.CRON_SECRET || process.env.REMINDER_SECRET;

    if (!configuredSecret || token !== configuredSecret) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing cron secret." },
        { status: 401 }
      );
    }

    const result = await processDueRemindersAction(token);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
