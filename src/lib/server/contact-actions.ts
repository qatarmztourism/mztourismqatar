"use server";

import crypto from "crypto";
import { z } from "zod";
import { headers } from "next/headers";
import { contactFormLimiter, newsletterLimiter, getClientIp } from "@/lib/security/rate-limit";

const contactInquirySchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name cannot exceed 100 characters")
    .regex(/^[a-zA-Z\u0600-\u06FF\s.'-]+$/, "Full name contains invalid characters"),
  phone: z
    .string()
    .trim()
    .min(6, "Phone number is too short")
    .max(25, "Phone number cannot exceed 25 characters")
    .regex(/^[0-9+\s\-()]+$/, "Phone number contains invalid characters"),
  email: z
    .string()
    .trim()
    .email("Please provide a valid email address")
    .max(120, "Email cannot exceed 120 characters")
    .optional()
    .or(z.literal("")),
  serviceId: z
    .string()
    .trim()
    .max(100, "Service identifier is too long")
    .default("desert-safari"),
  travelDate: z
    .string()
    .trim()
    .max(50, "Travel date description is too long")
    .optional()
    .or(z.literal("")),
  guestCount: z
    .string()
    .trim()
    .max(50, "Guest count description is too long")
    .optional()
    .or(z.literal("")),
  specialNotes: z
    .string()
    .trim()
    .max(1000, "Special notes cannot exceed 1000 characters")
    .optional()
    .or(z.literal("")),
  honeypot: z.string().max(0, "Automated bot submission detected"),
});

const newsletterSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please provide a valid email address")
    .max(120, "Email cannot exceed 120 characters"),
  honeypot: z.string().max(0, "Automated bot submission detected"),
});

export type ContactInquiryInput = z.infer<typeof contactInquirySchema>;

/**
 * Server-side validated contact inquiry action.
 * Enforces rate limiting, honeypot bot trap, and strict field constraints.
 */
export async function submitContactInquiryAction(rawInput: unknown) {
  try {
    // 1. Rate limiting by IP
    const headerList = await headers();
    const clientIp = getClientIp(headerList);
    const rateCheck = contactFormLimiter.check(clientIp);

    if (!rateCheck.success) {
      return {
        success: false,
        error: "Too many contact inquiries. Please wait a few minutes before trying again or reach us on WhatsApp.",
      };
    }

    // 2. Schema validation & honeypot check
    const validation = contactInquirySchema.safeParse(rawInput);
    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;
      const firstErrorMessage =
        Object.values(fieldErrors)[0]?.[0] || "Invalid contact form submission.";
      return {
        success: false,
        error: firstErrorMessage,
        fieldErrors,
      };
    }

    const data = validation.data;
    const inquiryCode = "MZ-INQ-" + crypto.randomBytes(3).toString("hex").toUpperCase();

    // 3. Sanitized return payload
    return {
      success: true,
      inquiryCode,
      sanitized: {
        fullName: data.fullName,
        phone: data.phone,
        email: data.email || null,
        serviceId: data.serviceId,
        travelDate: data.travelDate || "Flexible",
        guestCount: data.guestCount || "2 guests",
        specialNotes: data.specialNotes || "",
      },
    };
  } catch (err) {
    console.error("[Submit Contact Inquiry Error]", err);
    return {
      success: false,
      error: "An unexpected error occurred while processing your inquiry.",
    };
  }
}

/**
 * Server-side validated newsletter subscription action.
 * Enforces rate limiting, honeypot trap, and email format rules.
 */
export async function subscribeNewsletterAction(rawInput: unknown) {
  try {
    const headerList = await headers();
    const clientIp = getClientIp(headerList);
    const rateCheck = newsletterLimiter.check(clientIp);

    if (!rateCheck.success) {
      return {
        success: false,
        error: "Too many subscription attempts. Please try again later.",
      };
    }

    const validation = newsletterSchema.safeParse(rawInput);
    if (!validation.success) {
      return {
        success: false,
        error: "Please enter a valid email address.",
      };
    }

    return {
      success: true,
      message: "Thank you for subscribing to MZ Tourism Qatar editorial updates.",
    };
  } catch (err) {
    console.error("[Newsletter Subscription Error]", err);
    return {
      success: false,
      error: "An unexpected error occurred while subscribing.",
    };
  }
}
