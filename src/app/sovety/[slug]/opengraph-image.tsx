import { ImageResponse } from "next/og";
import { loadOgFont } from "@/lib/ogFont";
import { getArticle } from "@/lib/articles";
import { articleCoverFacts } from "@/lib/articleCover";

export const alt = "Гайд по экономии — ПромоФакт";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const THEME_PALETTES = [
  { bg: "linear-gradient(135deg, #0b102b 0%, #172047 55%, #0f172a 100%)", glowA: "rgba(255, 230, 0, 0.22)", glowB: "rgba(255, 51, 75, 0.22)" },
  { bg: "linear-gradient(135deg, #111827 0%, #1e1b4b 55%, #0f172a 100%)", glowA: "rgba(56, 189, 248, 0.22)", glowB: "rgba(255, 230, 0, 0.18)" },
  { bg: "linear-gradient(135deg, #0f172a 0%, #14332b 55%, #0b1320 100%)", glowA: "rgba(16, 185, 129, 0.22)", glowB: "rgba(255, 230, 0, 0.18)" },
  { bg: "linear-gradient(135deg, #1a0f1e 0%, #2d142c 55%, #111827 100%)", glowA: "rgba(244, 63, 94, 0.24)", glowB: "rgba(251, 191, 36, 0.20)" },
];

function hashSlug(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return h;
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  const fonts = await loadOgFont();

  const title = article?.title || "Советы по экономии и промокоды";
  const facts = article ? articleCoverFacts(article.title, article.related) : { store: null, benefit: null };
  const palette = THEME_PALETTES[hashSlug(slug) % THEME_PALETTES.length];
  const badgeText = facts.benefit
    ? `Выгода ${facts.benefit}`
    : facts.store
      ? `Гид: ${facts.store.name}`
      : "Разбор и промокоды 2026";
  const fontSize = title.length > 90 ? 38 : title.length > 62 ? 44 : 50;
  const clippedTitle = title.length > 130 ? `${title.slice(0, 127)}...` : title;
  const subtitle = article?.description
    ? article.description.length > 140
      ? `${article.description.slice(0, 137)}...`
      : article.description
    : "Проверенные условия акций, пошаговые инструкции и рабочие промокоды.";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 68px",
          background: palette.bg,
          color: "#ffffff",
          fontFamily: "Golos",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-60px",
            left: "-60px",
            width: "340px",
            height: "340px",
            borderRadius: "50%",
            background: palette.glowA,
            filter: "blur(55px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: "-50px",
            bottom: "-50px",
            width: "340px",
            height: "340px",
            borderRadius: "50%",
            background: palette.glowB,
            filter: "blur(55px)",
          }}
        />

        {/* Top Row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                display: "flex",
                background: "linear-gradient(90deg, #ffe600, #ff334b)",
                padding: "8px 20px",
                borderRadius: "999px",
                fontSize: "20px",
                fontWeight: 900,
                color: "#0b102b",
                letterSpacing: "1px",
              }}
            >
              ПРОМО·ФАКТ
            </div>
            <div style={{ fontSize: "22px", color: "rgba(255,255,255,0.68)", fontWeight: 700 }}>
              Советы по экономии
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "rgba(255, 230, 0, 0.14)",
              border: "1px solid rgba(255, 230, 0, 0.45)",
              padding: "8px 18px",
              borderRadius: "999px",
              fontSize: "20px",
              color: "#ffe600",
              fontWeight: 800,
            }}
          >
            {badgeText}
          </div>
        </div>

        {/* Center Article Headline & Summary */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: "1050px" }}>
          <div
            style={{
              fontSize: `${fontSize}px`,
              fontWeight: 900,
              lineHeight: 1.15,
              color: "#ffffff",
            }}
          >
            {clippedTitle}
          </div>
          <div
            style={{
              fontSize: "24px",
              lineHeight: 1.4,
              color: "rgba(255,255,255,0.78)",
              fontWeight: 500,
            }}
          >
            {subtitle}
          </div>
        </div>

        {/* Bottom Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255,255,255,0.14)",
            paddingTop: "22px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px", fontSize: "20px", color: "#00d28c", fontWeight: 700 }}>
            <span>● Проверенные акции и условия без скрытых подвохов</span>
          </div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "rgba(255,255,255,0.85)" }}>
            promofact.ru/sovety →
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      ...(fonts ? { fonts } : {}),
    },
  );
}
