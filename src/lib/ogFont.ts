/**
 * Шрифт для OG-картинок подгружается по сети, и это ненадёжно: версионный
 * путь Google Fonts (`/v12/`) со временем протухает и начинает отдавать 404 —
 * то есть HTML-страницу вместо файла шрифта. Satori парсит её как шрифт и
 * падает с «Unsupported OpenType signature <!DO», а наружу уходит пустой PNG:
 * ссылки на сайт теряют превью в Telegram, VK и мессенджерах.
 *
 * Поэтому загрузка обёрнута в проверки, а `fonts` у ImageResponse
 * необязательный — если шрифт недоступен, картинка рисуется встроенным.
 * Лучше превью без фирменного шрифта, чем отсутствие превью.
 */

const FONT_URL =
  "https://fonts.gstatic.com/s/golos_text/v12/Yq6G-LxfJEXuk6bgIxKvKnF_8qU.woff";

export type OgFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400;
  style: "normal";
};

/** Файл шрифта начинается с известной сигнатуры: wOFF, OTTO или 0x00010000. */
function looksLikeFont(buf: ArrayBuffer): boolean {
  if (buf.byteLength < 4) return false;
  const b = new Uint8Array(buf, 0, 4);
  const tag = String.fromCharCode(b[0], b[1], b[2], b[3]);
  if (tag === "wOFF" || tag === "wOF2" || tag === "OTTO" || tag === "true") return true;
  return b[0] === 0x00 && b[1] === 0x01 && b[2] === 0x00 && b[3] === 0x00;
}

/** Возвращает шрифт для ImageResponse либо undefined — тогда рисуем встроенным. */
export async function loadOgFont(): Promise<OgFont[] | undefined> {
  try {
    const res = await fetch(FONT_URL);
    if (!res.ok) {
      console.warn(`[og] шрифт недоступен: HTTP ${res.status} — рисуем встроенным`);
      return undefined;
    }
    const data = await res.arrayBuffer();
    if (!looksLikeFont(data)) {
      console.warn("[og] по адресу шрифта пришёл не шрифт — рисуем встроенным");
      return undefined;
    }
    return [{ name: "Golos", data, weight: 400, style: "normal" }];
  } catch (e) {
    console.warn("[og] не удалось загрузить шрифт — рисуем встроенным:", e);
    return undefined;
  }
}
