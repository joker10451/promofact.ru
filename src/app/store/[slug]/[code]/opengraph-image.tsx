import { ImageResponse } from "next/og";
import { getStores } from "@/lib/perfluence";

export const runtime = "edge";
export const alt = "Промокод";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FONT_URL =
  "https://fonts.gstatic.com/s/golos_text/v12/Yq6G-LxfJEXuk6bgIxKvKnF_8qU.woff";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string; code: string }>;
}) {
  const { slug, code } = await params;
  const decodedCode = decodeURIComponent(code).trim();
  const stores = await getStores();
  const store = stores.find((s) => s.slug === slug);
  const coupon = store?.coupons.find(
    (c) => c.promocode.code === decodedCode || c.promocode.code.toLowerCase() === decodedCode.toLowerCase()
  ) || store?.coupons[0];

  const fontRes = await fetch(FONT_URL);
  const fontData = await fontRes.arrayBuffer();

  const storeName = store?.name || "Магазин";
  const bonus = coupon?.promocode.bonusName || `Скидка по промокоду ${decodedCode}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 70px",
          background: "linear-gradient(135deg, #0b102b 0%, #171d3d 50%, #0b102b 100%)",
          color: "white",
          fontFamily: "Golos",
          position: "relative",
        }}
      >
        {/* Glow Effects */}
        <div
          style={{
            position: "absolute",
            top: "-40px",
            left: "-40px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "rgba(255, 230, 0, 0.18)",
            filter: "blur(50px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: "-40px",
            bottom: "-40px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "rgba(255, 51, 75, 0.22)",
            filter: "blur(50px)",
          }}
        />

        {/* Header: Logo & Store Name */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                display: "flex",
                background: "linear-gradient(90deg, #ffe600, #ff334b)",
                padding: "8px 18px",
                borderRadius: "999px",
                fontSize: "20px",
                fontWeight: 900,
                color: "#0b102b",
                letterSpacing: "1px",
              }}
            >
              ПРОМО·ФАКТ
            </div>
            <div style={{ fontSize: "24px", color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>
              {storeName}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(0, 210, 140, 0.15)",
              border: "1px solid rgba(0, 210, 140, 0.4)",
              padding: "6px 16px",
              borderRadius: "999px",
              fontSize: "18px",
              color: "#00d28c",
              fontWeight: 700,
            }}
          >
            ● Проверено сегодня
          </div>
        </div>

        {/* Main Content: Bonus text */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div
            style={{
              fontSize: "52px",
              fontWeight: 900,
              lineHeight: 1.15,
              color: "#ffffff",
              maxWidth: "1000px",
            }}
          >
            {bonus}
          </div>
        </div>

        {/* Bottom Banner: Promo Code Ticket */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "#ffffff",
              borderRadius: "20px",
              padding: "16px 28px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
              border: "3px solid #ffe600",
              gap: "16px",
            }}
          >
            <div style={{ fontSize: "20px", color: "#666", fontWeight: 700 }}>ПРОМОКОД:</div>
            <div
              style={{
                fontSize: "36px",
                fontWeight: 900,
                color: "#0b102b",
                letterSpacing: "2px",
              }}
            >
              {decodedCode}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: "22px",
              fontWeight: 700,
              color: "rgba(255,255,255,0.7)",
            }}
          >
            promofact.ru →
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Golos",
          data: fontData,
          weight: 400,
          style: "normal",
        },
      ],
    }
  );
}
