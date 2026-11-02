import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendCustomerWelcomeEmail } from "@/lib/server/email-service";

/**
 * Handles the OAuth 2.0 PKCE code exchange for customer authentication.
 *
 * CRITICAL SECURITY ARCHITECTURE:
 * - Google OAuth is strictly for CUSTOMER authentication.
 * - This endpoint NEVER creates or alters records in `public.admin_users`.
 * - Administrative clearance requires explicit provisioning by the platform owner.
 * - Only the customer profile in `public.profiles` is synchronized.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const next = requestUrl.searchParams.get("next") || "/en/account";

  // Sanitize redirect target to ensure it is relative and safe (prevent open redirects)
  const safeNext =
    next.startsWith("/") && !next.startsWith("//") && !next.includes("\\")
      ? next
      : "/en/account";
  const locale = safeNext.startsWith("/ar") ? "ar" : "en";

  // 1. Handle OAuth cancellation or provider-level errors
  if (error) {
    const redirectUrl = new URL(`/${locale}/auth`, request.url);
    redirectUrl.searchParams.set("error", error);
    if (errorDescription) {
      redirectUrl.searchParams.set("error_description", errorDescription);
    }
    return NextResponse.redirect(redirectUrl);
  }

  // 2. Exchange authorization code for authenticated session
  if (code) {
    try {
      const supabase = await createServerSupabase();
      const { data, error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError || !data.user) {
        console.error("[OAuth Callback Exchange Error]", exchangeError);
        const redirectUrl = new URL(`/${locale}/auth`, request.url);
        redirectUrl.searchParams.set(
          "error",
          exchangeError?.message || "Failed to exchange authorization code."
        );
        return NextResponse.redirect(redirectUrl);
      }

      const user = data.user;
      const fullName =
        (user.user_metadata?.full_name as string) ||
        (user.user_metadata?.name as string) ||
        null;
      const email = user.email || "";

      // 3. Automatically create or update customer record in public.profiles
      // SECURITY AUDIT: Only public.profiles is touched. public.admin_users is NEVER touched.
      try {
        const admin = createAdminClient();
        await admin.from("profiles").upsert(
          {
            id: user.id,
            email: email,
            full_name: fullName,
            preferred_locale: locale,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );
      } catch (profileErr) {
        console.warn("[OAuth Customer Profile Notice]", profileErr);
      }

      // 4. Dispatch prestige text-only welcome email strictly once upon first registration
      try {
        await sendCustomerWelcomeEmail({
          userId: user.id,
          email,
          fullName: fullName || "Valued Guest",
          locale,
        });
      } catch (welcomeErr) {
        console.warn("[OAuth Welcome Email Notice]", welcomeErr);
      }

      // 5. Redirect customer to their account dashboard
      return NextResponse.redirect(new URL(safeNext, request.url));
    } catch (err) {
      console.error("[OAuth Handler Exception]", err);
      const redirectUrl = new URL(`/${locale}/auth`, request.url);
      redirectUrl.searchParams.set(
        "error",
        "An unexpected error occurred during Google sign in."
      );
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Fallback if no code and no error was provided
  return NextResponse.redirect(new URL(`/${locale}/auth`, request.url));
}
