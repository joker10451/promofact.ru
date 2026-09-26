import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/admin",
          "/api/",
          "/stats/",
          "/*?*q=",
          "/*?*search=",
          "/*?*sort=",
          "/*?*filter=",
          "/*?*",
        ],
      },
      {
        userAgent: [
          "Bytespider",
          "GPTBot",
          "ChatGPT-User",
          "ClaudeBot",
          "Anthropic-AI",
          "PetalBot",
          "AhrefsBot",
          "SemrushBot",
          "DotBot",
          "MJ12bot",
          "BLEXBot",
          "DataForSeoBot",
        ],
        disallow: ["/"],
      },
    ],
    sitemap: [
      `${SITE_URL}/sitemap.xml`,
      `${SITE_URL}/sitemap-images.xml`,
    ],
    host: SITE_URL,
  };
}
