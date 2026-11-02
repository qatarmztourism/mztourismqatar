import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SingleServicePageView from "@/components/SingleServicePageView";
import { siteConfig } from "@/config/site-config";
import { getPublicServiceByIdAction } from "@/lib/server/service-actions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const res = await getPublicServiceByIdAction(id, "ar");
  const service = res.data;

  if (!service) {
    return {
      title: `الخدمة غير متوفرة | ${siteConfig.brand.nameAr}`,
      description: "الخدمة أو الجولة السياحية المطلوبة غير متوفرة حالياً.",
    };
  }

  return {
    title: `${service.title} | ${siteConfig.brand.nameAr}`,
    description: service.description,
    openGraph: {
      title: `${service.title} | ${siteConfig.brand.nameAr}`,
      description: service.description,
      images: [{ url: service.image }],
    },
  };
}

export default async function SingleServiceArabicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await getPublicServiceByIdAction(id, "ar");

  if (!res.success || !res.data) {
    notFound();
  }

  return <SingleServicePageView service={res.data} locale="ar" />;
}
