import type { MetadataRoute } from "next";
import { categorySlugs, coupons, getStores } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const today = new Date();
  const lastModified = coupons.reduce(
    (max, c) => (new Date(c.expires) > max ? new Date(c.expires) : max),
    today
  );

  const home: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: today,
      changeFrequency: "daily",
      priority: 1,
    },
  ];
  const categories: MetadataRoute.Sitemap = categorySlugs.map((slug) => ({
    url: `${SITE_URL}/category/${slug}`,
    lastModified: today,
    changeFrequency: "daily",
    priority: 0.8,
  }));
  const stores: MetadataRoute.Sitemap = getStores().map((store) => ({
    url: `${SITE_URL}/store/${store.slug}`,
    lastModified,
    changeFrequency: "daily",
    priority: 0.9,
  }));

  return [...home, ...categories, ...stores];
}
