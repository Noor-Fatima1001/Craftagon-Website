const API_KEY = import.meta.env.VITE_GOOGLE_FONTS_API_KEY;
const CACHE_KEY = "google_fonts_list_v1";
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

const fallbackFor = (category) =>
  category === "serif"
    ? "serif"
    : category === "monospace"
      ? "monospace"
      : category === "handwriting" || category === "display"
        ? "cursive"
        : "sans-serif";

// Returns [{ label, value }], same shape as CUSTOM_FONTS
export async function fetchGoogleFonts() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    if (cached && Date.now() - cached.time < CACHE_TTL) return cached.fonts;
  } catch {
    /* ignore bad cache */
  }

  const res = await fetch(
    `https://www.googleapis.com/webfonts/v1/webfonts?key=${API_KEY}&sort=popularity`,
  );
  if (!res.ok) throw new Error("Could not load Google Fonts");
  const data = await res.json();

  const fonts = (data.items || [])
    .filter((f) => f.variants.includes("regular")) // regular (400) wale hi
    .map((f) => ({
      label: f.family,
      value: `'${f.family}', ${fallbackFor(f.category)}`,
    }));

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), fonts }));
  } catch {
    /* storage full, ignore */
  }
  return fonts;
}

// Ek hi <link> mein multiple fonts load hote hain, already loaded dobara nahi hote
const loaded = new Set();
export function loadGoogleFonts(families = []) {
  const fresh = [...new Set(families)].filter((f) => f && !loaded.has(f));
  if (!fresh.length) return;
  fresh.forEach((f) => loaded.add(f));
  const params = fresh
    .map((f) => `family=${encodeURIComponent(f).replace(/%20/g, "+")}`)
    .join("&");
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?${params}&display=swap`;
  document.head.appendChild(link);
}