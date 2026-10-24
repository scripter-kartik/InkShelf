export const ACCENT = "#22c55e";
export const CHARS_PER_PAGE = 1600;
export const DEFAULT_SECONDS_PER_PAGE = 75;

export const READER_THEMES = {
  light: { label: "Light", bg: "#ffffff", surface: "#f9fafb", border: "#e5e7eb", text: "#1f2937", muted: "#6b7280" },
  sepia: { label: "Sepia", bg: "#f4ecd8", surface: "#ebe0c6", border: "#d9c9a3", text: "#4b3a2a", muted: "#8a7356" },
  dark: { label: "Dark", bg: "#080c0a", surface: "#121916", border: "#1c2521", text: "#cfdcd5", muted: "#8aa298" },
};

export const THEME_OPTIONS = [
  { value: "auto", label: "Auto" },
  { value: "light", label: "Light" },
  { value: "sepia", label: "Sepia" },
  { value: "dark", label: "Dark" },
];

export const FONT_OPTIONS = [
  { value: "original", label: "Original", family: null },
  { value: "serif", label: "Serif", family: "Georgia, 'Iowan Old Style', 'Palatino Linotype', serif" },
  { value: "sans", label: "Sans", family: "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" },
  { value: "readable", label: "Easy-read", family: "Verdana, Tahoma, 'Trebuchet MS', sans-serif" },
];

export const WIDTH_OPTIONS = [
  { value: "narrow", label: "Narrow", maxWidth: 620 },
  { value: "normal", label: "Normal", maxWidth: 820 },
  { value: "wide", label: "Wide", maxWidth: 1400 },
];

export const LINE_HEIGHTS = [1.3, 1.5, 1.7, 2];

export const HIGHLIGHT_COLORS = [
  { value: "yellow", label: "Yellow", fill: "#facc15" },
  { value: "green", label: "Green", fill: "#4ade80" },
  { value: "blue", label: "Blue", fill: "#60a5fa" },
  { value: "pink", label: "Pink", fill: "#f472b6" },
];

export const DEFAULT_SETTINGS = {
  theme: "auto",
  fontSize: 100,
  font: "original",
  lineHeight: 1.5,
  width: "normal",
  flow: "paginated",
  spread: "auto",
};

export function resolveTheme(setting, siteTheme) {
  if (setting === "auto") return siteTheme === "dark" ? READER_THEMES.dark : READER_THEMES.light;
  return READER_THEMES[setting] || READER_THEMES.light;
}

export function buildContentCss(settings, colors) {
  const family = FONT_OPTIONS.find((f) => f.value === settings.font)?.family;
  return `
    html, body { background: ${colors.bg} !important; color: ${colors.text} !important; }
    body { font-size: ${settings.fontSize}% !important; line-height: ${settings.lineHeight} !important; ${family ? `font-family: ${family} !important;` : ""} }
    p, li, blockquote, dd, dt, td, th, span, div { line-height: ${settings.lineHeight} !important; ${family ? "font-family: inherit !important;" : ""} }
    body *:not(a) { color: inherit !important; background-color: transparent !important; }
    a, a * { color: ${ACCENT} !important; }
    img, svg, video { max-width: 100% !important; height: auto; }
    ::selection { background: rgba(34, 197, 94, 0.3); }
  `;
}

export function flattenToc(items, depth = 0, out = []) {
  for (const item of items || []) {
    out.push({ id: item.id || item.href, label: (item.label || "").trim(), href: item.href, depth });
    if (item.subitems?.length) flattenToc(item.subitems, depth + 1, out);
  }
  return out;
}

export function hrefPath(href = "") {
  return href.split("#")[0].replace(/^\.?\//, "");
}

export function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
