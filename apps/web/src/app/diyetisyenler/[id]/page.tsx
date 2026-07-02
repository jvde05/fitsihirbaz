import type { Metadata } from "next";
import type { DietitianPublicSummary } from "@fit-sihirbaz/shared";
import { fetchTrpcQuery } from "@/lib/trpc-server";
import { DiyetisyenProfilView } from "./DiyetisyenProfilView";

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const dietitian = await fetchTrpcQuery<DietitianPublicSummary>("dietitians.getPublicProfile", { id: params.id });
  if (!dietitian) {
    return { title: "Diyetisyen" };
  }

  const name = `${dietitian.firstName} ${dietitian.lastName}`;
  const description =
    dietitian.bio?.slice(0, 160) ?? `${name}${dietitian.title ? ` — ${dietitian.title}` : ""} | Fit Sihirbaz`;

  return {
    title: name,
    description,
    openGraph: { title: name, description, type: "profile" },
  };
}

export default function DiyetisyenProfilPage() {
  return <DiyetisyenProfilView />;
}
