import { permanentRedirect } from "next/navigation";
import { getStores } from "@/lib/perfluence";

export const dynamicParams = true;
export const revalidate = 1800;

export async function generateStaticParams() {
  try {
    const stores = await getStores();
    return stores.map((s) => ({ slug: s.slug }));
  } catch {
    return [];
  }
}

export default async function PromokodyArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  permanentRedirect(`/store/${slug}`);
}
