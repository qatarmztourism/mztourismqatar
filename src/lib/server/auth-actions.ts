"use server";

import { z } from "zod";
import { cookies, headers } from "next/headers";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { authLimiter, getClientIp } from "@/lib/security/rate-limit";
import { sendCustomerWelcomeEmail } from "./email-service";

const signInSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters").max(100),
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().trim().min(8, "Phone number is too short").max(25).optional(),
});

export async function signInAction(rawInput: unknown) {
  try {
    const validation = signInSchema.safeParse(rawInput);
    if (!validation.success) {
      return {
        success: false,
        error: "Please provide a valid email and password.",
        fieldErrors: validation.error.flatten().fieldErrors,
      };
    }

    const { email, password } = validation.data;
    const supabase = await createServerSupabase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return {
        success: false,
        error: error?.message || "Invalid email or password.",
      };
    }

    return {
      success: true,
      data: {
        userId: data.user.id,
        email: data.user.email,
      },
    };
  } catch (err) {
    console.error("[Sign In Action Error]", err);
    return { success: false, error: "An unexpected error occurred during sign in." };
  }
}

export async function signUpAction(rawInput: unknown) {
  try {
    const validation = signUpSchema.safeParse(rawInput);
    if (!validation.success) {
      return {
        success: false,
        error: "Please correct the highlighted errors.",
        fieldErrors: validation.error.flatten().fieldErrors,
      };
    }

    const { fullName, email, password, phone } = validation.data;
    const supabase = await createServerSupabase();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mztourismqatar.qa";

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${siteUrl}/en/auth`,
        data: {
          full_name: fullName,
          phone: phone || null,
        },
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    if (data.user) {
      // Create user profile record using admin client
      try {
        const admin = createAdminClient();
        await admin.from("profiles").upsert(
          {
            id: data.user.id,
            email: data.user.email || email,
            full_name: fullName,
            phone: phone || null,
            preferred_locale: "en",
          },
          { onConflict: "id" }
        );
      } catch (profileErr) {
        console.warn("[Profile Upsert Notice]", profileErr);
      }

      // Dispatch prestige text-only welcome email strictly once upon registration
      try {
        await sendCustomerWelcomeEmail({
          userId: data.user.id,
          email: data.user.email || email,
          fullName,
          locale: "en",
        });
      } catch (welcomeErr) {
        console.warn("[Welcome Email Notice]", welcomeErr);
      }
    }

    return {
      success: true,
      data: {
        userId: data.user?.id,
        email: data.user?.email,
      },
    };
  } catch (err) {
    console.error("[Sign Up Action Error]", err);
    return { success: false, error: "An unexpected error occurred during sign up." };
  }
}

export async function signOutAction() {
  try {
    const supabase = await createServerSupabase();
    await supabase.auth.signOut();
    const cookieStore = await cookies();
    cookieStore.delete("mz_staff_session");
    return { success: true };
  } catch (err) {
    console.error("[Sign Out Action Error]", err);
    return { success: false, error: "Failed to sign out." };
  }
}

export async function getCurrentUserAction() {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return { success: true, data: null };
    }

    // Retrieve profile
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name, phone, preferred_locale")
      .eq("id", user.id)
      .maybeSingle();

    // Check if user is an active administrator in public.admin_users
    // Security: Only legitimate active records in admin_users grant administrative clearance
    const { data: adminRecord } = await admin
      .from("admin_users")
      .select("role, is_active")
      .eq("id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: profile?.full_name || (user.user_metadata?.full_name as string) || "Valued Guest",
          phone: profile?.phone || (user.user_metadata?.phone as string) || "",
          preferredLocale: (profile?.preferred_locale as "en" | "ar") || "en",
        },
        isAdmin: Boolean(adminRecord),
        adminRole: adminRecord?.role || null,
        isStaffSession: false,
      },
    };
  } catch (err) {
    console.error("[Get Current User Error]", err);
    return { success: false, error: "Failed to load session." };
  }
}

/**
 * Direct administrator sign-in action with mandatory clearance verification.
 * Verifies both Supabase credentials and active status in public.admin_users.
 */
export async function adminSignInAction(rawInput: unknown) {
  try {
    const validation = signInSchema.safeParse(rawInput);
    if (!validation.success) {
      return {
        success: false,
        error: "Please enter a valid administrator email and password.",
        fieldErrors: validation.error.flatten().fieldErrors,
      };
    }

    const { email, password } = validation.data;
    const supabase = await createServerSupabase();

    // 1. Authenticate credentials via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return {
        success: false,
        error: authError?.message || "Invalid credentials. Please verify your email and password.",
      };
    }

    // 2. Interrogate public.admin_users for active clearance
    const admin = createAdminClient();
    const { data: adminRecord, error: adminErr } = await admin
      .from("admin_users")
      .select("role, is_active")
      .eq("id", authData.user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (adminErr || !adminRecord) {
      // User is authenticated in Supabase but lacks admin clearance in public.admin_users.
      // Sign them out of the admin session immediately to avoid privileged leakage.
      await supabase.auth.signOut();
      return {
        success: false,
        error:
          "Access Denied: This account is not registered in the active administrator directory (public.admin_users).",
      };
    }

    return {
      success: true,
      data: {
        userId: authData.user.id,
        email: authData.user.email,
        role: adminRecord.role,
      },
    };
  } catch (err) {
    console.error("[Admin Sign In Error]", err);
    return { success: false, error: "An unexpected error occurred during admin sign-in." };
  }
}

/**
 * Validates staff concierge desk elevation key if configured via server-only environment variable.
 * No hardcoded master passwords or backdoor passcodes exist.
 */
export async function verifyAdminPasscodeAction(passcode: string) {
  try {
    const trimmed = passcode.trim();
    const configuredKey = process.env.ADMIN_PORTAL_KEY;

    if (!configuredKey || configuredKey.length < 8) {
      return {
        success: false,
        error:
          "Passcode-based authorization is disabled. Please log in directly with your administrator email and password.",
      };
    }

    if (trimmed !== configuredKey) {
      return { success: false, error: "Invalid staff authorization key." };
    }

    // Check if user is authenticated first
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "Please sign in with your account first before elevating staff clearance.",
      };
    }

    // Elevate user in admin_users table
    const admin = createAdminClient();
    await admin.from("admin_users").upsert(
      {
        id: user.id,
        role: "concierge_agent",
        is_active: true,
      },
      { onConflict: "id" }
    );

    return { success: true };
  } catch (err) {
    console.error("[Verify Admin Passcode Error]", err);
    return { success: false, error: "Authentication failed." };
  }
}

// =============================================================================
// CUSTOMER PASSWORD RECOVERY & PROFILE MANAGEMENT
// =============================================================================

const passwordResetRequestSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  locale: z.enum(["en", "ar"]).optional().default("en"),
});

/**
 * Initiates an email password reset flow using Supabase Auth.
 * Rate-limited to prevent email flooding or enumeration.
 */
export async function requestPasswordResetAction(rawInput: unknown) {
  try {
    const headerList = await headers();
    const clientIp = getClientIp(headerList);
    const rateLimit = authLimiter.check(clientIp);

    if (!rateLimit.success) {
      return {
        success: false,
        error: "Too many requests. Please wait a few minutes before trying again.",
      };
    }

    const validation = passwordResetRequestSchema.safeParse(rawInput);
    if (!validation.success) {
      return {
        success: false,
        error: "Please enter a valid email address.",
        fieldErrors: validation.error.flatten().fieldErrors,
      };
    }

    const { email, locale } = validation.data;
    const supabase = await createServerSupabase();

    // Determine official site origin dynamically, preferring verified production domain
    const host = headerList.get("x-forwarded-host") || headerList.get("host") || "localhost:3000";
    const proto = headerList.get("x-forwarded-proto") || "http";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `${proto}://${host}`;
    const redirectUrl = `${siteUrl}/${locale}/auth?mode=reset`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      console.warn("[Password Reset Notice]", error.message);
    }

    // Always return success message to prevent account enumeration
    return {
      success: true,
      message:
        locale === "ar"
          ? "إذا كان هذا البريد مسجلاً لدينا، فقد تم إرسال رابط استعادة كلمة المرور إلى صندوق الوارد."
          : "If an account exists with this email, a password recovery link has been dispatched to your inbox.",
    };
  } catch (err) {
    console.error("[Request Password Reset Error]", err);
    return {
      success: false,
      error: "Unable to process password reset request at this time.",
    };
  }
}

const updatePasswordSchema = z.object({
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password exceeds 100 characters"),
});

/**
 * Updates the authenticated customer's password.
 * Derives user identity strictly from the verified session.
 */
export async function updateCustomerPasswordAction(rawInput: unknown) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "Authentication required to update password.",
      };
    }

    const validation = updatePasswordSchema.safeParse(rawInput);
    if (!validation.success) {
      return {
        success: false,
        error: "Password must be at least 6 characters.",
        fieldErrors: validation.error.flatten().fieldErrors,
      };
    }

    const { password } = validation.data;
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      return {
        success: false,
        error: updateError.message || "Failed to update password.",
      };
    }

    return { success: true };
  } catch (err) {
    console.error("[Update Customer Password Error]", err);
    return { success: false, error: "An unexpected error occurred." };
  }
}

const updateCustomerProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name exceeds 100 characters"),
  phone: z
    .string()
    .trim()
    .min(8, "Phone number is too short")
    .max(25, "Phone number is too long")
    .regex(/^[\d\s+\-().]+$/, "Invalid characters in phone number")
    .optional()
    .or(z.literal("")),
  preferredLocale: z.enum(["en", "ar"]).default("en"),
});

/**
 * Updates the authenticated customer's profile record in public.profiles.
 * Server derives identity from session (never trusting user-supplied ID).
 */
export async function updateCustomerProfileAction(rawInput: unknown) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "Authentication required to update profile.",
      };
    }

    const validation = updateCustomerProfileSchema.safeParse(rawInput);
    if (!validation.success) {
      return {
        success: false,
        error: "Please correct the highlighted errors.",
        fieldErrors: validation.error.flatten().fieldErrors,
      };
    }

    const { fullName, phone, preferredLocale } = validation.data;
    const admin = createAdminClient();

    const { error: profileError } = await admin.from("profiles").upsert(
      {
        id: user.id,
        email: user.email || "",
        full_name: fullName,
        phone: phone || null,
        preferred_locale: preferredLocale,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (profileError) {
      console.error("[Profile Upsert Error]", profileError);
      return { success: false, error: "Failed to update profile information." };
    }

    // Sync full_name into auth user metadata as well
    try {
      await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          phone: phone || null,
        },
      });
    } catch (metaErr) {
      console.warn("[User Metadata Sync Notice]", metaErr);
    }

    return { success: true };
  } catch (err) {
    console.error("[Update Customer Profile Unexpected Error]", err);
    return { success: false, error: "An unexpected error occurred." };
  }
}
