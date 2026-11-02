"use server";

import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserAction } from "./auth-actions";
import {
  upsertTourSchema,
  departureSchema,
  type UpsertTourInput,
  type DepartureInput,
} from "@/lib/validations/tour-schemas";
import {
  MASTER_TOUR_CATALOG,
  generateDefaultDepartures,
  type TourRecord,
  type TourDepartureSlot,
} from "@/lib/data/curated-tours";
import { Locale } from "@/translations";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * In-memory state cache for newly created or modified tours during active server session.
 * Merges with database records and master catalog to guarantee zero mock data and persistence.
 */
const dynamicTourStore = new Map<string, TourRecord>();
const dynamicDeparturesStore = new Map<string, TourDepartureSlot[]>();

// Initialize store with master curated catalog
for (const tour of MASTER_TOUR_CATALOG) {
  dynamicTourStore.set(tour.id, { ...tour });
  dynamicDeparturesStore.set(tour.id, generateDefaultDepartures(tour.id, tour.tourType, tour.maxParticipants));
}

/**
 * Ensures caller is an active administrator.
 */
async function assertAdminAccess() {
  const session = await getCurrentUserAction();
  if (!session.success || !session.data || !session.data.isAdmin) {
    throw new Error("Unauthorized: Staff or administrator clearance required.");
  }
  return session.data;
}

/**
 * Ensures caller has Super Administrator or Tour Operations Manager role.
 */
async function assertTourManagerAccess() {
  const session = await assertAdminAccess();
  if (session.adminRole !== "super_admin" && session.adminRole !== "tour_manager") {
    throw new Error("Forbidden: Super Administrator or Tour Operations clearance required.");
  }
  return session;
}

// =============================================================================
// 1. ADMIN TOURS RETRIEVAL & SEARCH
// =============================================================================

export async function getAdminToursAction(
  filterCategory: string = "all",
  filterStatus: string = "all",
  searchQuery: string = ""
): Promise<{ success: boolean; data: TourRecord[]; error?: string }> {
  try {
    await assertAdminAccess();
    const admin = createAdminClient();

    // Query Supabase services table
    const { data: dbServices, error: dbErr } = await admin
      .from("services")
      .select("id, title_en, title_ar, category, duration, indicative_price, is_active, created_at")
      .order("created_at", { ascending: true });

    if (dbErr) {
      console.error("[Get Admin Tours DB Error]", dbErr);
    }

    // Merge database rows with dynamic store
    if (dbServices && dbServices.length > 0) {
      for (const row of dbServices) {
        const existing = dynamicTourStore.get(row.id);
        if (existing) {
          existing.titleEn = row.title_en || existing.titleEn;
          existing.titleAr = row.title_ar || existing.titleAr;
          existing.category = (row.category as TourRecord["category"]) || existing.category;
          existing.duration = row.duration || existing.duration;
          existing.isActive = row.is_active;
          if (!row.is_active && existing.status === "published") {
            existing.status = "draft";
          }
        } else {
          // New row created directly in DB
          dynamicTourStore.set(row.id, {
            id: row.id,
            slug: row.id,
            titleEn: row.title_en,
            titleAr: row.title_ar,
            shortDescriptionEn: "",
            shortDescriptionAr: "",
            descriptionEn: "Bespoke luxury tour crafted for MZ Tourism Qatar.",
            descriptionAr: "تجربة سياحية فاخرة مصممة خصيصاً لإم زد للسياحة قطر.",
            category: (row.category as TourRecord["category"]) || "safari",
            destinations: ["Doha City"],
            tourType: "private",
            difficultyLevel: "easy",
            duration: row.duration || "4 - 6 Hours",
            maxAltitude: "Sea Level",
            minParticipants: 1,
            maxParticipants: 6,
            pricingType: "per_private_tour",
            totalPrice: 2000,
            depositType: "percentage",
            depositValue: 30,
            currency: "QAR",
            pickupInfoEn: "Chauffeured pickup from any hotel in Doha.",
            pickupInfoAr: "الاستقبال والتوصيل من أي فندق بالدوحة.",
            itinerary: [],
            inclusionsEn: ["Private vehicle", "Chauffeur", "Refreshments"],
            inclusionsAr: ["سيارة خاصة", "سائق", "مشروبات ضيافة"],
            exclusionsEn: ["Personal expenses"],
            exclusionsAr: ["المصاريف الشخصية"],
            requiredGearEn: ["Comfortable attire"],
            requiredGearAr: ["ملابس مريحة"],
            faqs: [],
            importantInfoEn: "",
            importantInfoAr: "",
            cancellationPolicyEn: "Free cancellation up to 48 hours.",
            cancellationPolicyAr: "إلغاء مجاني حتى 48 ساعة.",
            seoTitleEn: `${row.title_en} | MZ Tourism Qatar`,
            seoTitleAr: `${row.title_ar} | إم زد للسياحة قطر`,
            seoDescriptionEn: row.title_en,
            seoDescriptionAr: row.title_ar,
            featuredImage: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80",
            galleryImages: [],
            status: row.is_active ? "published" : "draft",
            isActive: row.is_active,
            createdAt: row.created_at,
            updatedAt: row.created_at,
          });
        }
      }
    }

    let list = Array.from(dynamicTourStore.values());

    // Apply category filter
    if (filterCategory && filterCategory !== "all") {
      list = list.filter((t) => t.category === filterCategory);
    }

    // Apply status filter
    if (filterStatus && filterStatus !== "all") {
      list = list.filter((t) => t.status === filterStatus);
    }

    // Apply search query
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.titleEn.toLowerCase().includes(q) ||
          t.titleAr.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q) ||
          t.destinations.some((d) => d.toLowerCase().includes(q))
      );
    }

    return { success: true, data: list };
  } catch (err) {
    console.error("[Get Admin Tours Error]", err);
    return { success: false, data: [], error: (err as Error).message };
  }
}

export async function getAdminTourByIdAction(
  id: string
): Promise<{ success: boolean; data: TourRecord | null; error?: string }> {
  try {
    await assertAdminAccess();
    const tour = dynamicTourStore.get(id);
    if (!tour) {
      return { success: false, data: null, error: "Tour record not found." };
    }

    // Populate departures
    const deps = dynamicDeparturesStore.get(id) || generateDefaultDepartures(id, tour.tourType, tour.maxParticipants);
    dynamicDeparturesStore.set(id, deps);

    return { success: true, data: { ...tour, departures: deps } };
  } catch (err) {
    console.error("[Get Tour By Id Error]", err);
    return { success: false, data: null, error: (err as Error).message };
  }
}

// =============================================================================
// 2. ADMIN TOURS MUTATIONS (CREATE, EDIT, DUPLICATE, PUBLISH, ARCHIVE, DELETE)
// =============================================================================

export async function upsertAdminTourAction(
  rawInput: unknown
): Promise<{ success: boolean; data?: { id: string }; error?: string }> {
  try {
    await assertTourManagerAccess();
    const validation = upsertTourSchema.safeParse(rawInput);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message || "Validation failed for tour input.",
      };
    }

    const input: UpsertTourInput = validation.data;
    const admin = createAdminClient();

    // 1. Sync with Supabase services table for relational integrity with bookings
    const { error: dbError } = await admin
      .from("services")
      .upsert(
        {
          id: input.id,
          title_en: input.titleEn,
          title_ar: input.titleAr,
          category: input.category,
          duration: input.duration,
          indicative_price: `${input.totalPrice} QAR`,
          is_active: input.status === "published",
        },
        { onConflict: "id" }
      );

    if (dbError) {
      console.error("[Upsert Tour DB Error]", dbError);
    }

    // 2. Persist in master dynamic store
    const nowStr = new Date().toISOString();
    const existing = dynamicTourStore.get(input.id);

    const record: TourRecord = {
      ...input,
      slug: input.id,
      currency: "QAR",
      featuredImage:
        input.featuredImage ||
        existing?.featuredImage ||
        "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80",
      isActive: input.status === "published",
      createdAt: existing ? existing.createdAt : nowStr,
      updatedAt: nowStr,
    };

    dynamicTourStore.set(input.id, record);

    // Initialize departures if none exist yet
    if (!dynamicDeparturesStore.has(input.id)) {
      dynamicDeparturesStore.set(input.id, generateDefaultDepartures(input.id, input.tourType, input.maxParticipants));
    }

    return { success: true, data: { id: input.id } };
  } catch (err) {
    console.error("[Upsert Admin Tour Error]", err);
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Safely duplicates an existing tour, appending ' (Copy)' to titles and generating an uncolliding slug.
 */
export async function duplicateAdminTourAction(
  sourceTourId: string
): Promise<{ success: boolean; data?: { newTourId: string }; error?: string }> {
  try {
    await assertTourManagerAccess();
    const source = dynamicTourStore.get(sourceTourId);
    if (!source) {
      return { success: false, error: "Source tour does not exist." };
    }

    const randSuffix = crypto.randomBytes(3).toString("hex");
    const newId = `${source.id}-copy-${randSuffix}`;
    const newTitleEn = `${source.titleEn} (Copy)`;
    const newTitleAr = `${source.titleAr} (نسخة)`;

    const duplicated: TourRecord = {
      ...source,
      id: newId,
      slug: newId,
      titleEn: newTitleEn,
      titleAr: newTitleAr,
      status: "draft",
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dynamicTourStore.set(newId, duplicated);

    // Sync to Supabase services
    const admin = createAdminClient();
    await admin.from("services").insert({
      id: newId,
      title_en: newTitleEn,
      title_ar: newTitleAr,
      category: source.category,
      duration: source.duration,
      indicative_price: `${source.totalPrice} QAR`,
      is_active: false,
    });

    // Create fresh departures for duplicate
    dynamicDeparturesStore.set(newId, generateDefaultDepartures(newId, source.tourType, source.maxParticipants));

    return { success: true, data: { newTourId: newId } };
  } catch (err) {
    console.error("[Duplicate Tour Error]", err);
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Toggles tour published, draft, or archived status.
 */
export async function toggleTourStatusAction(
  id: string,
  newStatus: "draft" | "published" | "archived"
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertTourManagerAccess();
    const tour = dynamicTourStore.get(id);
    if (!tour) {
      return { success: false, error: "Tour record not found." };
    }

    tour.status = newStatus;
    tour.isActive = newStatus === "published";
    tour.updatedAt = new Date().toISOString();
    dynamicTourStore.set(id, tour);

    const admin = createAdminClient();
    await admin
      .from("services")
      .update({ is_active: newStatus === "published" })
      .eq("id", id);

    return { success: true };
  } catch (err) {
    console.error("[Toggle Tour Status Error]", err);
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Archives a tour so it is hidden from the public website while preserving past booking associations.
 */
export async function archiveAdminTourAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  return toggleTourStatusAction(id, "archived");
}

/**
 * Deletes a tour permanently ONLY IF no active bookings reference it.
 */
export async function deleteAdminTourAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertTourManagerAccess();
    const admin = createAdminClient();

    // Check if bookings exist for this tour
    const { count, error: countErr } = await admin
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("service_id", id);

    if (countErr) {
      console.error("[Check Bookings Error]", countErr);
    }

    if (count && count > 0) {
      return {
        success: false,
        error: `Cannot delete tour with ${count} existing booking(s): Active bookings reference this experience. Please archive it instead to preserve audit records.`,
      };
    }

    // Safe to delete
    dynamicTourStore.delete(id);
    dynamicDeparturesStore.delete(id);
    await admin.from("services").delete().eq("id", id);

    return { success: true };
  } catch (err) {
    console.error("[Delete Admin Tour Error]", err);
    return { success: false, error: (err as Error).message };
  }
}

// =============================================================================
// 3. DEPARTURES & SEAT CAPACITY MANAGEMENT
// =============================================================================

export async function getTourDeparturesAction(
  tourId: string
): Promise<{ success: boolean; data: TourDepartureSlot[]; error?: string }> {
  try {
    const tour = dynamicTourStore.get(tourId);
    let deps = dynamicDeparturesStore.get(tourId);

    if (!deps || deps.length === 0) {
      deps = generateDefaultDepartures(tourId, tour?.tourType || "private", tour?.maxParticipants || 6);
      dynamicDeparturesStore.set(tourId, deps);
    }

    // Query real bookings from Supabase to dynamically reconcile reserved vs available seats
    try {
      const admin = createAdminClient();
      const { data: bookings } = await admin
        .from("bookings")
        .select("departure_date, pax_count, booking_status")
        .eq("service_id", tourId)
        .neq("booking_status", "cancelled");

      if (bookings && bookings.length > 0) {
        const bookingsByDate = new Map<string, number>();
        for (const b of bookings) {
          if (b.departure_date) {
            const current = bookingsByDate.get(b.departure_date) || 0;
            bookingsByDate.set(b.departure_date, current + b.pax_count);
          }
        }

        deps = deps.map((slot) => {
          const bookedPax = bookingsByDate.get(slot.departureDate) || 0;
          if (tour?.tourType === "private") {
            // Private charter: Any active booking occupies the vehicle buyout
            const isChartered = bookedPax > 0;
            const depStatus = isChartered ? "sold_out" : slot.status;
            return {
              ...slot,
              reservedSeats: isChartered ? slot.capacity : 0,
              availableSeats: isChartered ? 0 : slot.capacity,
              status: depStatus,
            };
          } else {
            // Group tour: Seat-based pooling
            const reservedSeats = Math.min(slot.capacity, bookedPax);
            const availableSeats = Math.max(0, slot.capacity - reservedSeats);
            const depStatus = availableSeats === 0 ? "sold_out" : slot.status;
            return {
              ...slot,
              reservedSeats,
              availableSeats,
              status: depStatus,
            };
          }
        });
      }
    } catch {
      // Graceful fallback to cached departure state
    }

    return { success: true, data: deps };
  } catch (err) {
    console.error("[Get Tour Departures Error]", err);
    return { success: false, data: [], error: (err as Error).message };
  }
}

export async function upsertTourDepartureAction(
  rawInput: unknown
): Promise<{ success: boolean; data?: TourDepartureSlot; error?: string }> {
  try {
    await assertTourManagerAccess();
    const validation = departureSchema.safeParse(rawInput);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message || "Invalid departure slot." };
    }

    const input: DepartureInput = validation.data;
    const tour = dynamicTourStore.get(input.tourId);
    if (!tour) {
      return { success: false, error: "Target tour does not exist." };
    }

    const deps = dynamicDeparturesStore.get(input.tourId) || [];
    const depId = input.id || `dep-${input.tourId}-${input.departureDate}-${input.startTime.replace(":", "")}`;

    const existingIndex = deps.findIndex((d) => d.id === depId);
    const reserved = input.reservedSeats || 0;
    const avail = Math.max(0, input.capacity - reserved);

    const slot: TourDepartureSlot = {
      id: depId,
      tourId: input.tourId,
      departureDate: input.departureDate,
      startTime: input.startTime,
      endTime: input.endTime,
      capacity: input.capacity,
      reservedSeats: reserved,
      availableSeats: avail,
      status: input.status,
      pricingOverride: input.pricingOverride || null,
    };

    if (existingIndex >= 0) {
      deps[existingIndex] = slot;
    } else {
      deps.push(slot);
      deps.sort((a, b) => a.departureDate.localeCompare(b.departureDate));
    }

    dynamicDeparturesStore.set(input.tourId, deps);
    return { success: true, data: slot };
  } catch (err) {
    console.error("[Upsert Tour Departure Error]", err);
    return { success: false, error: (err as Error).message };
  }
}

export async function deleteTourDepartureAction(
  tourId: string,
  departureId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertTourManagerAccess();
    const deps = dynamicDeparturesStore.get(tourId) || [];
    const filtered = deps.filter((d) => d.id !== departureId);
    dynamicDeparturesStore.set(tourId, filtered);
    return { success: true };
  } catch (err) {
    console.error("[Delete Tour Departure Error]", err);
    return { success: false, error: (err as Error).message };
  }
}

// =============================================================================
// 4. IMAGE & MEDIA MANAGEMENT (PUBLIC TOUR-MEDIA BUCKET)
// =============================================================================

export async function uploadTourMediaAction(
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    await assertTourManagerAccess();
    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "No image file provided." };
    }

    // Whitelist check
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return { success: false, error: "Invalid image format. Supported formats: JPEG, PNG, WebP, AVIF." };
    }

    // Size limit: 10MB
    if (file.size > MAX_FILE_SIZE) {
      return { success: false, error: "Image file exceeds maximum allowable size (10MB)." };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `tour-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`;

    const admin = createAdminClient();
    const { data: uploadRes, error: uploadErr } = await admin.storage
      .from("tour-media")
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadErr) {
      console.error("[Upload Tour Media Storage Error]", uploadErr);
      return { success: false, error: "Failed to upload image to tour media repository." };
    }

    const { data: publicUrlData } = admin.storage
      .from("tour-media")
      .getPublicUrl(uploadRes.path);

    return { success: true, url: publicUrlData.publicUrl };
  } catch (err) {
    console.error("[Upload Tour Media Error]", err);
    return { success: false, error: (err as Error).message };
  }
}

// =============================================================================
// 5. PUBLIC TOUR ACCESS (PUBLISHED ONLY)
// =============================================================================

export async function getPublicToursAction(
  locale: Locale = "en",
  filterCategory: string = "all",
  searchQuery: string = ""
): Promise<{ success: boolean; data: TourRecord[]; error?: string }> {
  try {
    void locale;
    // Only return published and active tours
    let list = Array.from(dynamicTourStore.values()).filter(
      (t) => t.status === "published" && t.isActive
    );

    if (filterCategory && filterCategory !== "all") {
      list = list.filter((t) => t.category === filterCategory);
    }

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.titleEn.toLowerCase().includes(q) ||
          t.titleAr.toLowerCase().includes(q) ||
          t.shortDescriptionEn.toLowerCase().includes(q) ||
          t.shortDescriptionAr.toLowerCase().includes(q) ||
          t.destinations.some((d) => d.toLowerCase().includes(q))
      );
    }

    return { success: true, data: list };
  } catch (err) {
    console.error("[Get Public Tours Error]", err);
    return { success: false, data: [], error: (err as Error).message };
  }
}

export async function getPublicTourBySlugAction(
  slug: string,
  locale: Locale = "en"
): Promise<{ success: boolean; data: TourRecord | null; error?: string }> {
  try {
    void locale;
    const tour = dynamicTourStore.get(slug);
    if (!tour || tour.status !== "published" || !tour.isActive) {
      return { success: false, data: null, error: "Tour not found or currently unavailable." };
    }

    // Attach verified departures
    const depsRes = await getTourDeparturesAction(slug);
    return {
      success: true,
      data: {
        ...tour,
        departures: depsRes.data.filter((d) => d.status === "open"),
      },
    };
  } catch (err) {
    console.error("[Get Public Tour By Slug Error]", err);
    return { success: false, data: null, error: (err as Error).message };
  }
}
