import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ПромоФакт — промокоды и купоны на скидку";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FONT_URL =
  "https://fonts.gstatic.com/s/golos_text/v12/Yq6G-LxfJEXuk6bgIxKvKnF_8qU.woff";

export default async function OpengraphImage() {
  const fontRes = await fetch(FONT_URL);
  const fontData = await fontRes.arrayBuffer();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "70px",
          background:
            "linear-gradient(135deg, #0b102b 0%, #1c2345 60%, #0b102b 100%)",
          color: "white",
          fontFamily: "Golos",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-60px",
            left: "-60px",
            width: "320px",
            height: "320px",
            borderRadius: "50%",
            background: "rgba(255,208,47,0.18)",
            filter: "blur(40px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: "-40px",
            top: "120px",
            width: "280px",
            height: "280px",
            borderRadius: "50%",
            background: "rgba(255,51,85,0.20)",
            filter: "blur(40px)",
          }}
        />
        <div
          style={{
            display: "flex",
            fontSize: 34,
            fontWeight: 700,
            color: "rgba(255,255,255,0.7)",
            letterSpacing: 2,
          }}
        >
          ПРОМО<span style={{ color: "#ff3355" }}>·</span>ФАКТ
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontSize: 68,
            fontWeight: 900,
            lineHeight: 1.05,
            maxWidth: 980,
          }}
        >
          Промокоды и купоны, которые реально работают
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 30,
            color: "rgba(255,255,255,0.65)",
          }}
        >
          Проверяем каждый код каждый день · экономь без регистрации
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 40,
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              padding: "14px 26px",
              borderRadius: 999,
              background: "linear-gradient(90deg,#ff3355,#d61f3f)",
              color: "white",
              fontSize: 26,
              fontWeight: 800,
            }}
          >
            Ловить скидки →
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
