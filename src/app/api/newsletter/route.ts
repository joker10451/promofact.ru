import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawEmail = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!rawEmail || !EMAIL_REGEX.test(rawEmail) || rawEmail.length > 254) {
      return NextResponse.json(
        { ok: false, error: "Укажите корректный адрес электронной почты" },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();
    if (admin) {
      try {
        await admin.from("newsletter_subscribers").upsert(
          {
            email: rawEmail,
            source: body?.source || "website_footer",
            subscribed_at: new Date().toISOString(),
          },
          { onConflict: "email" }
        );
      } catch (err) {
        console.warn("[newsletter] Supabase write skipped:", err);
      }
    }

    return NextResponse.json({
      ok: true,
      message: "Вы успешно подписались на еженедельный дайджест промокодов!",
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Ошибка обработки запроса" },
      { status: 500 }
    );
  }
}
