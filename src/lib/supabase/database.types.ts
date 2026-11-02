export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type BookingStatus =
  | "awaiting_deposit"
  | "deposit_under_review"
  | "confirmed"
  | "completed"
  | "cancelled";

export type PaymentStatus =
  | "deposit_pending"
  | "deposit_submitted"
  | "deposit_confirmed"
  | "deposit_rejected"
  | "fully_paid";

export type AdminRole =
  | "super_admin"
  | "tour_manager"
  | "concierge_agent"
  | "finance";

export type CustomTripStatus =
  | "new"
  | "under_review"
  | "contacted"
  | "itinerary_in_progress"
  | "proposal_sent"
  | "revision_requested"
  | "accepted"
  | "converted"
  | "lost"
  | "quoted"
  | "archived";

export type CustomTripPriority = "low" | "normal" | "high" | "urgent";

export type ProposalStatus =
  | "draft"
  | "published"
  | "revision_requested"
  | "accepted"
  | "declined"
  | "converted"
  | "superseded";

export type DepositProofReviewStatus = "pending" | "accepted" | "rejected";

export type ReminderChannel = "whatsapp" | "email" | "sms";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          preferred_locale: "en" | "ar";
          created_at: string;
          updated_at: string;
          welcome_email_sent_at?: string | null;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          preferred_locale?: "en" | "ar";
          created_at?: string;
          updated_at?: string;
          welcome_email_sent_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          preferred_locale?: "en" | "ar";
          created_at?: string;
          updated_at?: string;
          welcome_email_sent_at?: string | null;
        };
        Relationships: [];
      };
      admin_users: {
        Row: {
          id: string;
          role: AdminRole;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          role?: AdminRole;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          role?: AdminRole;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          title_en: string;
          title_ar: string;
          category: string;
          duration: string;
          indicative_price: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          title_en: string;
          title_ar: string;
          category: string;
          duration: string;
          indicative_price: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          title_en?: string;
          title_ar?: string;
          category?: string;
          duration?: string;
          indicative_price?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          booking_ref: string;
          customer_id: string | null;
          service_id: string;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          departure_date: string | null;
          time_window: string | null;
          pax_count: number;
          pickup_location: string | null;
          booking_status: BookingStatus;
          payment_status: PaymentStatus;
          deposit_required: number;
          deposit_paid: number;
          balance_due: number;
          total_price?: number;
          currency: string;
          upload_token: string;
          notes: string | null;
          admin_notes: string | null;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          completed_at?: string | null;
          completed_by?: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_ref: string;
          customer_id?: string | null;
          service_id: string;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          departure_date?: string | null;
          time_window?: string | null;
          pax_count?: number;
          pickup_location?: string | null;
          booking_status?: BookingStatus;
          payment_status?: PaymentStatus;
          deposit_required?: number;
          deposit_paid?: number;
          balance_due?: number;
          total_price?: number;
          currency?: string;
          upload_token?: string;
          notes?: string | null;
          admin_notes?: string | null;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          booking_ref?: string;
          customer_id?: string | null;
          service_id?: string;
          customer_name?: string;
          customer_email?: string;
          customer_phone?: string;
          departure_date?: string | null;
          time_window?: string | null;
          pax_count?: number;
          pickup_location?: string | null;
          booking_status?: BookingStatus;
          payment_status?: PaymentStatus;
          deposit_required?: number;
          deposit_paid?: number;
          balance_due?: number;
          total_price?: number;
          currency?: string;
          upload_token?: string;
          notes?: string | null;
          admin_notes?: string | null;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      booking_participants: {
        Row: {
          id: string;
          booking_id: string;
          upload_token: string | null;
          full_name: string;
          passport_or_qatar_id: string | null;
          special_dietary: string | null;
          is_child: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          upload_token?: string | null;
          full_name: string;
          passport_or_qatar_id?: string | null;
          special_dietary?: string | null;
          is_child?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          upload_token?: string | null;
          full_name?: string;
          passport_or_qatar_id?: string | null;
          special_dietary?: string | null;
          is_child?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      custom_trip_requests: {
        Row: {
          id: string;
          request_ref: string;
          customer_id: string | null;
          guest_name: string;
          email: string;
          phone: string;
          destinations: string[] | null;
          experiences: string[] | null;
          party_size: string | null;
          timeframe: string | null;
          budget_range: string | null;
          special_requests: string | null;
          status: CustomTripStatus;
          priority: CustomTripPriority;
          assigned_to: string | null;
          assigned_at: string | null;
          follow_up_date: string | null;
          preferred_locale: "en" | "ar";
          adults: number;
          children: number;
          accommodation_preference: string | null;
          transport_preference: string | null;
          converted_booking_id: string | null;
          converted_at: string | null;
          converted_by: string | null;
          lost_reason: string | null;
          admin_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          request_ref: string;
          customer_id?: string | null;
          guest_name: string;
          email: string;
          phone: string;
          destinations?: string[] | null;
          experiences?: string[] | null;
          party_size?: string | null;
          timeframe?: string | null;
          budget_range?: string | null;
          special_requests?: string | null;
          status?: CustomTripStatus;
          priority?: CustomTripPriority;
          assigned_to?: string | null;
          assigned_at?: string | null;
          follow_up_date?: string | null;
          preferred_locale?: "en" | "ar";
          adults?: number;
          children?: number;
          accommodation_preference?: string | null;
          transport_preference?: string | null;
          converted_booking_id?: string | null;
          converted_at?: string | null;
          converted_by?: string | null;
          lost_reason?: string | null;
          admin_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          request_ref?: string;
          customer_id?: string | null;
          guest_name?: string;
          email?: string;
          phone?: string;
          destinations?: string[] | null;
          experiences?: string[] | null;
          party_size?: string | null;
          timeframe?: string | null;
          budget_range?: string | null;
          special_requests?: string | null;
          status?: CustomTripStatus;
          priority?: CustomTripPriority;
          assigned_to?: string | null;
          assigned_at?: string | null;
          follow_up_date?: string | null;
          preferred_locale?: "en" | "ar";
          adults?: number;
          children?: number;
          accommodation_preference?: string | null;
          transport_preference?: string | null;
          converted_booking_id?: string | null;
          converted_at?: string | null;
          converted_by?: string | null;
          lost_reason?: string | null;
          admin_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      deposit_proofs: {
        Row: {
          id: string;
          booking_id: string;
          upload_token: string | null;
          storage_path: string;
          file_name: string;
          mime_type: string;
          file_size: number;
          uploaded_at: string;
          review_status: DepositProofReviewStatus;
          rejection_reason: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          payment_method: string;
          custom_payment_method: string | null;
          amount_submitted: number;
          admin_confirmed_amount: number | null;
          transaction_ref: string | null;
          payment_date: string | null;
          customer_notes: string | null;
          bucket_id: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          upload_token?: string | null;
          storage_path: string;
          file_name: string;
          mime_type: string;
          file_size: number;
          uploaded_at?: string;
          review_status?: DepositProofReviewStatus;
          rejection_reason?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          payment_method?: string;
          custom_payment_method?: string | null;
          amount_submitted?: number;
          admin_confirmed_amount?: number | null;
          transaction_ref?: string | null;
          payment_date?: string | null;
          customer_notes?: string | null;
          bucket_id?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          upload_token?: string | null;
          storage_path?: string;
          file_name?: string;
          mime_type?: string;
          file_size?: number;
          uploaded_at?: string;
          review_status?: DepositProofReviewStatus;
          rejection_reason?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          payment_method?: string;
          custom_payment_method?: string | null;
          amount_submitted?: number;
          admin_confirmed_amount?: number | null;
          transaction_ref?: string | null;
          payment_date?: string | null;
          customer_notes?: string | null;
          bucket_id?: string;
        };
        Relationships: [];
      };
      booking_reminders: {
        Row: {
          id: string;
          booking_id: string;
          channel: ReminderChannel;
          recipient: string;
          message_snapshot: string;
          sent_by: string | null;
          sent_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          channel: ReminderChannel;
          recipient: string;
          message_snapshot: string;
          sent_by?: string | null;
          sent_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          channel?: ReminderChannel;
          recipient?: string;
          message_snapshot?: string;
          sent_by?: string | null;
          sent_at?: string;
        };
        Relationships: [];
      };
      articles: {
        Row: {
          id: string;
          slug: string;
          title_en: string;
          title_ar: string;
          excerpt_en: string;
          excerpt_ar: string;
          content_en: string;
          content_ar: string;
          category: string;
          cover_image: string | null;
          author_name: string;
          reading_time_minutes: number;
          is_published: boolean;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title_en: string;
          title_ar: string;
          excerpt_en: string;
          excerpt_ar: string;
          content_en: string;
          content_ar: string;
          category: string;
          cover_image?: string | null;
          author_name?: string;
          reading_time_minutes?: number;
          is_published?: boolean;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title_en?: string;
          title_ar?: string;
          excerpt_en?: string;
          excerpt_ar?: string;
          content_en?: string;
          content_ar?: string;
          category?: string;
          cover_image?: string | null;
          author_name?: string;
          reading_time_minutes?: number;
          is_published?: boolean;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      booking_payments: {
        Row: {
          id: string;
          booking_id: string;
          payment_type: "deposit" | "balance" | "full" | "refund";
          amount: number;
          currency: string;
          payment_method: "bank_transfer" | "jazzcash" | "easypaisa" | "cash_office" | "cash" | "credit_card" | "pos_terminal" | "cheque" | "other";
          transaction_reference: string | null;
          proof_id: string | null;
          notes: string | null;
          recorded_by: string | null;
          recorded_at: string;
          custom_payment_method: string | null;
          amount_submitted: number | null;
          payment_date: string | null;
          verification_status: "pending" | "confirmed" | "rejected";
          rejection_reason: string | null;
        };
        Insert: {
          id?: string;
          booking_id: string;
          payment_type: "deposit" | "balance" | "full" | "refund";
          amount: number;
          currency?: string;
          payment_method?: "bank_transfer" | "jazzcash" | "easypaisa" | "cash_office" | "cash" | "credit_card" | "pos_terminal" | "cheque" | "other";
          transaction_reference?: string | null;
          proof_id?: string | null;
          notes?: string | null;
          recorded_by?: string | null;
          recorded_at?: string;
          custom_payment_method?: string | null;
          amount_submitted?: number | null;
          payment_date?: string | null;
          verification_status?: "pending" | "confirmed" | "rejected";
          rejection_reason?: string | null;
        };
        Update: {
          id?: string;
          booking_id?: string;
          payment_type?: "deposit" | "balance" | "full" | "refund";
          amount?: number;
          currency?: string;
          payment_method?: "bank_transfer" | "jazzcash" | "easypaisa" | "cash_office" | "cash" | "credit_card" | "pos_terminal" | "cheque" | "other";
          transaction_reference?: string | null;
          proof_id?: string | null;
          notes?: string | null;
          recorded_by?: string | null;
          recorded_at?: string;
          custom_payment_method?: string | null;
          amount_submitted?: number | null;
          payment_date?: string | null;
          verification_status?: "pending" | "confirmed" | "rejected";
          rejection_reason?: string | null;
        };
        Relationships: [];
      };
      booking_timeline: {
        Row: {
          id: string;
          booking_id: string;
          event_type: string;
          from_status: string | null;
          to_status: string | null;
          title_en: string;
          title_ar: string;
          description_en: string | null;
          description_ar: string | null;
          actor_id: string | null;
          actor_role: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          event_type: string;
          from_status?: string | null;
          to_status?: string | null;
          title_en: string;
          title_ar: string;
          description_en?: string | null;
          description_ar?: string | null;
          actor_id?: string | null;
          actor_role?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          event_type?: string;
          from_status?: string | null;
          to_status?: string | null;
          title_en?: string;
          title_ar?: string;
          description_en?: string | null;
          description_ar?: string | null;
          actor_id?: string | null;
          actor_role?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      customer_notifications: {
        Row: {
          id: string;
          booking_id: string;
          notification_type: string;
          channel: "email" | "whatsapp" | "sms";
          recipient: string;
          status: "staged" | "sent" | "failed" | "skipped";
          subject: string | null;
          idempotency_key: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          notification_type: string;
          channel?: "email" | "whatsapp" | "sms";
          recipient: string;
          status?: "staged" | "sent" | "failed" | "skipped";
          subject?: string | null;
          idempotency_key: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          notification_type?: string;
          channel?: "email" | "whatsapp" | "sms";
          recipient?: string;
          status?: "staged" | "sent" | "failed" | "skipped";
          subject?: string | null;
          idempotency_key?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      custom_trip_timeline: {
        Row: {
          id: string;
          inquiry_id: string;
          event_type: string;
          title_en: string;
          title_ar: string;
          description_en: string | null;
          description_ar: string | null;
          actor_id: string | null;
          actor_name: string | null;
          actor_role: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          inquiry_id: string;
          event_type: string;
          title_en: string;
          title_ar: string;
          description_en?: string | null;
          description_ar?: string | null;
          actor_id?: string | null;
          actor_name?: string | null;
          actor_role?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          inquiry_id?: string;
          event_type?: string;
          title_en?: string;
          title_ar?: string;
          description_en?: string | null;
          description_ar?: string | null;
          actor_id?: string | null;
          actor_name?: string | null;
          actor_role?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Relationships: [];
      };
      custom_trip_messages: {
        Row: {
          id: string;
          inquiry_id: string;
          sender_type: "admin" | "customer" | "concierge" | "system";
          sender_name: string;
          sender_id: string | null;
          channel: "portal" | "email" | "whatsapp" | "internal_note";
          message: string;
          is_internal: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          inquiry_id: string;
          sender_type: "admin" | "customer" | "concierge" | "system";
          sender_name: string;
          sender_id?: string | null;
          channel?: "portal" | "email" | "whatsapp" | "internal_note";
          message: string;
          is_internal?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          inquiry_id?: string;
          sender_type?: "admin" | "customer" | "concierge" | "system";
          sender_name?: string;
          sender_id?: string | null;
          channel?: "portal" | "email" | "whatsapp" | "internal_note";
          message?: string;
          is_internal?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      custom_proposals: {
        Row: {
          id: string;
          proposal_ref: string;
          inquiry_id: string;
          customer_id: string | null;
          guest_token: string;
          token_expires_at: string;
          version: number;
          status: ProposalStatus;
          title_en: string;
          title_ar: string;
          summary_en: string | null;
          summary_ar: string | null;
          valid_until: string;
          currency: string;
          pricing_breakdown: Record<string, unknown>;
          total_price: number;
          deposit_required: number;
          balance_due: number;
          itinerary_days: Record<string, unknown>[];
          inclusions_en: string[];
          inclusions_ar: string[];
          exclusions_en: string[];
          exclusions_ar: string[];
          terms_en: string | null;
          terms_ar: string | null;
          customer_notes: string | null;
          internal_notes: string | null;
          customer_feedback: string | null;
          customer_action_at: string | null;
          converted_booking_id: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          proposal_ref: string;
          inquiry_id: string;
          customer_id?: string | null;
          guest_token?: string;
          token_expires_at?: string;
          version?: number;
          status?: ProposalStatus;
          title_en: string;
          title_ar: string;
          summary_en?: string | null;
          summary_ar?: string | null;
          valid_until: string;
          currency?: string;
          pricing_breakdown?: Record<string, unknown>;
          total_price?: number;
          deposit_required?: number;
          balance_due?: number;
          itinerary_days?: Record<string, unknown>[];
          inclusions_en?: string[];
          inclusions_ar?: string[];
          exclusions_en?: string[];
          exclusions_ar?: string[];
          terms_en?: string | null;
          terms_ar?: string | null;
          customer_notes?: string | null;
          internal_notes?: string | null;
          customer_feedback?: string | null;
          customer_action_at?: string | null;
          converted_booking_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          proposal_ref?: string;
          inquiry_id?: string;
          customer_id?: string | null;
          guest_token?: string;
          token_expires_at?: string;
          version?: number;
          status?: ProposalStatus;
          title_en?: string;
          title_ar?: string;
          summary_en?: string | null;
          summary_ar?: string | null;
          valid_until?: string;
          currency?: string;
          pricing_breakdown?: Record<string, unknown>;
          total_price?: number;
          deposit_required?: number;
          balance_due?: number;
          itinerary_days?: Record<string, unknown>[];
          inclusions_en?: string[];
          inclusions_ar?: string[];
          exclusions_en?: string[];
          exclusions_ar?: string[];
          terms_en?: string | null;
          terms_ar?: string | null;
          customer_notes?: string | null;
          internal_notes?: string | null;
          customer_feedback?: string | null;
          customer_action_at?: string | null;
          converted_booking_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cms_site_settings: {
        Row: {
          id: string;
          site_title_en: string;
          site_title_ar: string;
          site_tagline_en: string;
          site_tagline_ar: string;
          site_description_en: string;
          site_description_ar: string;
          contact_email: string;
          contact_phone: string;
          contact_whatsapp: string;
          contact_address_en: string;
          contact_address_ar: string;
          social_instagram: string | null;
          social_facebook: string | null;
          social_twitter: string | null;
          social_linkedin: string | null;
          seo_og_image: string | null;
          seo_canonical_url: string | null;
          footer_about_en: string | null;
          footer_about_ar: string | null;
          deposit_default_percentage: number;
          payment_bank_transfer_instructions_en: string | null;
          payment_bank_transfer_instructions_ar: string | null;
          payment_jazzcash_instructions_en: string | null;
          payment_jazzcash_instructions_ar: string | null;
          payment_easypaisa_instructions_en: string | null;
          payment_easypaisa_instructions_ar: string | null;
          payment_cash_office_instructions_en: string | null;
          payment_cash_office_instructions_ar: string | null;
          payment_other_instructions_en: string | null;
          payment_other_instructions_ar: string | null;
          updated_at: string | null;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          site_title_en?: string;
          site_title_ar?: string;
          site_tagline_en?: string;
          site_tagline_ar?: string;
          site_description_en?: string;
          site_description_ar?: string;
          contact_email?: string;
          contact_phone?: string;
          contact_whatsapp?: string;
          contact_address_en?: string;
          contact_address_ar?: string;
          social_instagram?: string | null;
          social_facebook?: string | null;
          social_twitter?: string | null;
          social_linkedin?: string | null;
          seo_og_image?: string | null;
          seo_canonical_url?: string | null;
          footer_about_en?: string | null;
          footer_about_ar?: string | null;
          deposit_default_percentage?: number;
          payment_bank_transfer_instructions_en?: string | null;
          payment_bank_transfer_instructions_ar?: string | null;
          payment_jazzcash_instructions_en?: string | null;
          payment_jazzcash_instructions_ar?: string | null;
          payment_easypaisa_instructions_en?: string | null;
          payment_easypaisa_instructions_ar?: string | null;
          payment_cash_office_instructions_en?: string | null;
          payment_cash_office_instructions_ar?: string | null;
          payment_other_instructions_en?: string | null;
          payment_other_instructions_ar?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          site_title_en?: string;
          site_title_ar?: string;
          site_tagline_en?: string;
          site_tagline_ar?: string;
          site_description_en?: string;
          site_description_ar?: string;
          contact_email?: string;
          contact_phone?: string;
          contact_whatsapp?: string;
          contact_address_en?: string;
          contact_address_ar?: string;
          social_instagram?: string | null;
          social_facebook?: string | null;
          social_twitter?: string | null;
          social_linkedin?: string | null;
          seo_og_image?: string | null;
          seo_canonical_url?: string | null;
          footer_about_en?: string | null;
          footer_about_ar?: string | null;
          deposit_default_percentage?: number;
          payment_bank_transfer_instructions_en?: string | null;
          payment_bank_transfer_instructions_ar?: string | null;
          payment_jazzcash_instructions_en?: string | null;
          payment_jazzcash_instructions_ar?: string | null;
          payment_easypaisa_instructions_en?: string | null;
          payment_easypaisa_instructions_ar?: string | null;
          payment_cash_office_instructions_en?: string | null;
          payment_cash_office_instructions_ar?: string | null;
          payment_other_instructions_en?: string | null;
          payment_other_instructions_ar?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      cms_homepage_sections: {
        Row: {
          id: string;
          section_key: string;
          title_en: string | null;
          title_ar: string | null;
          subtitle_en: string | null;
          subtitle_ar: string | null;
          content_en: string | null;
          content_ar: string | null;
          media_url: string | null;
          cta_primary_label_en: string | null;
          cta_primary_label_ar: string | null;
          cta_primary_url: string | null;
          cta_secondary_label_en: string | null;
          cta_secondary_label_ar: string | null;
          cta_secondary_url: string | null;
          metadata: Json;
          display_order: number;
          is_enabled: boolean;
          updated_at: string | null;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          section_key: string;
          title_en?: string | null;
          title_ar?: string | null;
          subtitle_en?: string | null;
          subtitle_ar?: string | null;
          content_en?: string | null;
          content_ar?: string | null;
          media_url?: string | null;
          cta_primary_label_en?: string | null;
          cta_primary_label_ar?: string | null;
          cta_primary_url?: string | null;
          cta_secondary_label_en?: string | null;
          cta_secondary_label_ar?: string | null;
          cta_secondary_url?: string | null;
          metadata?: Json;
          display_order?: number;
          is_enabled?: boolean;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          section_key?: string;
          title_en?: string | null;
          title_ar?: string | null;
          subtitle_en?: string | null;
          subtitle_ar?: string | null;
          content_en?: string | null;
          content_ar?: string | null;
          media_url?: string | null;
          cta_primary_label_en?: string | null;
          cta_primary_label_ar?: string | null;
          cta_primary_url?: string | null;
          cta_secondary_label_en?: string | null;
          cta_secondary_label_ar?: string | null;
          cta_secondary_url?: string | null;
          metadata?: Json;
          display_order?: number;
          is_enabled?: boolean;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      cms_pages: {
        Row: {
          id: string;
          slug: string;
          title_en: string;
          title_ar: string;
          excerpt_en: string | null;
          excerpt_ar: string | null;
          content_en: string;
          content_ar: string;
          hero_image: string | null;
          meta_title_en: string | null;
          meta_title_ar: string | null;
          meta_description_en: string | null;
          meta_description_ar: string | null;
          status: "draft" | "published" | "archived";
          published_at: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          title_en: string;
          title_ar: string;
          excerpt_en?: string | null;
          excerpt_ar?: string | null;
          content_en: string;
          content_ar: string;
          hero_image?: string | null;
          meta_title_en?: string | null;
          meta_title_ar?: string | null;
          meta_description_en?: string | null;
          meta_description_ar?: string | null;
          status?: "draft" | "published" | "archived";
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          slug?: string;
          title_en?: string;
          title_ar?: string;
          excerpt_en?: string | null;
          excerpt_ar?: string | null;
          content_en?: string;
          content_ar?: string;
          hero_image?: string | null;
          meta_title_en?: string | null;
          meta_title_ar?: string | null;
          meta_description_en?: string | null;
          meta_description_ar?: string | null;
          status?: "draft" | "published" | "archived";
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Relationships: [];
      };
      cms_faqs: {
        Row: {
          id: string;
          category: string;
          question_en: string;
          question_ar: string;
          answer_en: string;
          answer_ar: string;
          display_order: number;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category?: string;
          question_en: string;
          question_ar: string;
          answer_en: string;
          answer_ar: string;
          display_order?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category?: string;
          question_en?: string;
          question_ar?: string;
          answer_en?: string;
          answer_ar?: string;
          display_order?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cms_testimonials: {
        Row: {
          id: string;
          customer_name: string;
          customer_title_en: string | null;
          customer_title_ar: string | null;
          content_en: string;
          content_ar: string;
          rating: number;
          avatar_url: string | null;
          display_order: number;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_name: string;
          customer_title_en?: string | null;
          customer_title_ar?: string | null;
          content_en: string;
          content_ar: string;
          rating?: number;
          avatar_url?: string | null;
          display_order?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_name?: string;
          customer_title_en?: string | null;
          customer_title_ar?: string | null;
          content_en?: string;
          content_ar?: string;
          rating?: number;
          avatar_url?: string | null;
          display_order?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cms_navigation: {
        Row: {
          id: string;
          location: "header" | "footer_quick_links" | "footer_experiences" | "footer_legal";
          label_en: string;
          label_ar: string;
          url: string;
          display_order: number;
          is_visible: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          location?: "header" | "footer_quick_links" | "footer_experiences" | "footer_legal";
          label_en: string;
          label_ar: string;
          url: string;
          display_order?: number;
          is_visible?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          location?: "header" | "footer_quick_links" | "footer_experiences" | "footer_legal";
          label_en?: string;
          label_ar?: string;
          url?: string;
          display_order?: number;
          is_visible?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cms_media: {
        Row: {
          id: string;
          filename: string;
          storage_path: string;
          public_url: string;
          mime_type: string;
          file_size: number;
          title_en: string | null;
          title_ar: string | null;
          alt_en: string | null;
          alt_ar: string | null;
          category: "hero" | "destinations" | "experiences" | "editorial" | "banners" | "general";
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          filename: string;
          storage_path: string;
          public_url: string;
          mime_type: string;
          file_size: number;
          title_en?: string | null;
          title_ar?: string | null;
          alt_en?: string | null;
          alt_ar?: string | null;
          category?: "hero" | "destinations" | "experiences" | "editorial" | "banners" | "general";
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          filename?: string;
          storage_path?: string;
          public_url?: string;
          mime_type?: string;
          file_size?: number;
          title_en?: string | null;
          title_ar?: string | null;
          alt_en?: string | null;
          alt_ar?: string | null;
          category?: "hero" | "destinations" | "experiences" | "editorial" | "banners" | "general";
          uploaded_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_super_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      get_booking_by_token: {
        Args: {
          p_upload_token: string;
        };
        Returns: {
          id: string;
          booking_ref: string;
          service_id: string;
          departure_date: string | null;
          booking_status: BookingStatus;
          payment_status: PaymentStatus;
          deposit_required: number;
          deposit_paid: number;
          balance_due: number;
          currency: string;
          created_at: string;
        }[];
      };
    };
    Enums: {
      booking_status: BookingStatus;
      payment_status: PaymentStatus;
      admin_role: AdminRole;
      custom_trip_status: CustomTripStatus;
      custom_trip_priority: CustomTripPriority;
      proposal_status: ProposalStatus;
      deposit_proof_review_status: DepositProofReviewStatus;
      reminder_channel: ReminderChannel;
    };
  };
}
