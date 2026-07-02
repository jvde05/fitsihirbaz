import type { Metadata } from "next";
import type { ArticleDetail } from "@fit-sihirbaz/shared";
import { fetchTrpcQuery } from "@/lib/trpc-server";
import { LiteraturDetayView } from "./LiteraturDetayView";

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const article = await fetchTrpcQuery<ArticleDetail>("articles.getBySlug", { slug: params.slug });
  if (!article) {
    return { title: "Makale" };
  }

  const description = article.body.slice(0, 160);

  return {
    title: article.title,
    description,
    openGraph: { title: article.title, description, type: "article" },
  };
}

export default function LiteraturDetayPage() {
  return <LiteraturDetayView />;
}
