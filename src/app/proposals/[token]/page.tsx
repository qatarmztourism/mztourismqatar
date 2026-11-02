import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function DefaultProposalTokenPage({ params }: PageProps) {
  const { token } = await params;
  redirect(`/en/proposals/${token}`);
}
