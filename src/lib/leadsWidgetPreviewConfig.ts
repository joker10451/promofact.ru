/**
 * A deliberately strict, preview-only adapter for LEADS.Widget.
 * We cannot invent the provider's embed snippet; only an actual approved URL
 * from webmaster.leads.su may be used after checking its format and legal copy.
 */
export type LeadsWidgetPreviewConfig = {
  mode: "iframe" | "script";
  embedUrl: string;
  legalText: string;
};

export function getLeadsWidgetPreviewConfig(
  env: Record<string, string | undefined> = process.env,
): LeadsWidgetPreviewConfig | null {
  if (env.LEADS_WIDGET_PREVIEW_ENABLED !== "true") return null;
  if (env.LEADS_WIDGET_MARKING_VERIFIED !== "true") return null;

  const mode = env.LEADS_WIDGET_EMBED_MODE;
  if (mode !== "script" && mode !== "iframe") return null;

  const embedUrl = env.LEADS_WIDGET_EMBED_URL?.trim();
  const legalText = env.LEADS_WIDGET_LEGAL_TEXT?.trim();
  if (!embedUrl || !legalText) return null;
  if (!/Реклама/iu.test(legalText) || !/\berid\s*:\s*[a-z0-9]+/iu.test(legalText)) {
    return null;
  }

  try {
    const url = new URL(embedUrl);
    const hostname = url.hostname.toLowerCase();
    if (
      url.protocol !== "https:" ||
      url.username || url.password || url.port ||
      (hostname !== "leads.su" && !hostname.endsWith(".leads.su"))
    ) return null;
    return { mode, embedUrl: url.toString(), legalText };
  } catch {
    return null;
  }
}
