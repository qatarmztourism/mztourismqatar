"use client";

import { useState, useEffect } from "react";
import { Locale, getDictionary } from "@/translations";
import Header from "./Header";
import HeroSection from "./HeroSection";
import QuickBookingEngine from "./QuickBookingEngine";
import ServicesSection from "./ServicesSection";
import WhyUsSection from "./WhyUsSection";
import AdvisorySection from "./AdvisorySection";
import TestimonialsSection from "./TestimonialsSection";
import ConciergeBanner from "./ConciergeBanner";
import Footer from "./Footer";
import BespokeInquiryModal from "./BespokeInquiryModal";
import BespokePlannerModal from "./BespokePlannerModal";
import ServiceDetailModal from "./ServiceDetailModal";
import FloatingWhatsAppButton from "./FloatingWhatsAppButton";
import MobileActionBar from "./MobileActionBar";
import {
  getPublicHomepageSectionsAction,
  getPublicTestimonialsAction,
} from "@/lib/server/cms-actions";
import type { Database } from "@/lib/supabase/database.types";

type CmsHomepageSectionRow = Database["public"]["Tables"]["cms_homepage_sections"]["Row"];
type CmsTestimonialRow = Database["public"]["Tables"]["cms_testimonials"]["Row"];

interface TourismHomePageProps {
  locale: Locale;
}

export default function TourismHomePage({ locale }: TourismHomePageProps) {
  const dict = getDictionary(locale);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedServiceForModal, setSelectedServiceForModal] = useState<string>("desert-safari");

  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);
  const [activeDetailServiceId, setActiveDetailServiceId] = useState<string>("desert-safari");
  const [customPlannerOpen, setCustomPlannerOpen] = useState<boolean>(false);

  const [heroSection, setHeroSection] = useState<CmsHomepageSectionRow | null>(null);
  const [whyUsSection, setWhyUsSection] = useState<CmsHomepageSectionRow | null>(null);
  const [liveTestimonials, setLiveTestimonials] = useState<CmsTestimonialRow[]>([]);

  useEffect(() => {
    getPublicHomepageSectionsAction().then((res) => {
      if (res.success && res.data) {
        const hero = res.data.find((s) => s.section_key === "hero");
        if (hero) setHeroSection(hero);
        const whyUs = res.data.find((s) => s.section_key === "why_us");
        if (whyUs) setWhyUsSection(whyUs);
      }
    });

    getPublicTestimonialsAction().then((res) => {
      if (res.success && res.data && res.data.length > 0) {
        setLiveTestimonials(res.data);
      }
    });
  }, []);

  const handleOpenModal = (serviceId?: string) => {
    if (serviceId) {
      setSelectedServiceForModal(serviceId);
    }
    setModalOpen(true);
  };

  const handleOpenDetailModal = (serviceId: string) => {
    setActiveDetailServiceId(serviceId);
    setDetailModalOpen(true);
  };

  return (
    <div
      dir={dict.dir}
      lang={locale}
      className={`min-h-screen bg-surface-container-lowest text-on-surface selection:bg-primary selection:text-on-primary ${
        locale === "ar" ? "font-arabic" : "font-body"
      }`}
    >
      {/* 1. Fixed Luxury Glass Header */}
      <Header
        dict={dict}
        currentLocale={locale}
        onOpenInquiryModal={() => handleOpenModal()}
      />

      {/* Main Content Area */}
      <main className="w-full">
        {/* 2. Hero Section */}
        <HeroSection
          dict={dict}
          currentLocale={locale}
          onOpenInquiryModal={() => handleOpenModal()}
          cmsHero={heroSection}
        />

        {/* 3. Quick Booking & Inquiry Conduit Engine */}
        <QuickBookingEngine
          dict={dict}
          currentLocale={locale}
          onOpenModalWithService={(sId) => handleOpenModal(sId)}
        />

        {/* 4. The 8 Signature Tourism Services */}
        <ServicesSection
          dict={dict}
          currentLocale={locale}
          onOpenServiceDetail={handleOpenDetailModal}
        />

        {/* 5. Why Choose MZ Tourism Qatar */}
        <WhyUsSection dict={dict} currentLocale={locale} cmsSection={whyUsSection} />

        {/* 6. Travel Advisory & FAQs */}
        <AdvisorySection dict={dict} currentLocale={locale} />

        {/* 7. Discerning Guest Testimonials */}
        <TestimonialsSection
          dict={dict}
          currentLocale={locale}
          cmsTestimonials={liveTestimonials}
        />

        {/* 8. VIP Concierge Invitation Banner */}
        <ConciergeBanner
          dict={dict}
          currentLocale={locale}
          onOpenInquiryModal={() => handleOpenModal()}
        />
      </main>

      {/* 9. Full Luxury Footer */}
      <Footer
        dict={dict}
        currentLocale={locale}
        onOpenInquiryModal={() => handleOpenModal()}
      />

      {/* 10. Interactive 5-Step Inquiry Modal */}
      <BespokeInquiryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        dict={dict}
        currentLocale={locale}
        initialServiceId={selectedServiceForModal}
        onOpenCustomPlanner={() => setCustomPlannerOpen(true)}
      />

      {/* 10b. Interactive Bespoke GCC Journey Planner */}
      <BespokePlannerModal
        isOpen={customPlannerOpen}
        onClose={() => setCustomPlannerOpen(false)}
        currentLocale={locale}
      />

      {/* 11. Interactive Detailed Service Modal with Itinerary Flow */}
      <ServiceDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        serviceId={activeDetailServiceId}
        dict={dict}
        currentLocale={locale}
      />

      {/* 12. Persistent Floating Desktop WhatsApp Conduit */}
      <FloatingWhatsAppButton currentLocale={locale} />

      {/* 13. Persistent Mobile Bottom Action Bar */}
      <MobileActionBar
        dict={dict}
        currentLocale={locale}
        onOpenInquiryModal={() => handleOpenModal()}
      />
    </div>
  );
}
