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
  const res = await getPublicServiceByIdAction(id, "en");
  const service = res.data;

  if (!service) {
    return {
      title: `Service Not Found | ${siteConfig.brand.name}`,
      description: "The requested luxury tourism service was not found.",
    };
  }

  return {
    title: `${service.title} | ${siteConfig.brand.name}`,
    description: service.description,
    openGraph: {
      title: `${service.title} | ${siteConfig.brand.name}`,
      description: service.description,
      images: [{ url: service.image }],
    },
  };
}

export default async function SingleServiceEnglishPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await getPublicServiceByIdAction(id, "en");

  if (!res.success || !res.data) {
    notFound();
  }

  return <SingleServicePageView service={res.data} locale="en" />;
}
