import { DEFAULT_SETTINGS, DEFAULT_SECONDS_PER_PAGE } from "./readerConfig";

function read(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

function readJson(key, fallback) {
  const raw = read(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function sourceIdFor(url) {
  return url?.startsWith("blob:") ? "upload" : url;
}

export const keys = {
  position: (bookKey, sourceId) => `inkshelf:epub-pos:${bookKey}:${sourceId}`,
  locations: (sourceId) => `inkshelf:epub-locations:${sourceId}`,
  bookmarks: (bookKey, sourceId) => `inkshelf:reader:bookmarks:${bookKey}:${sourceId}`,
  highlights: (bookKey, sourceId) => `inkshelf:reader:highlights:${bookKey}:${sourceId}`,
  settings: "inkshelf:reader:settings",
  speed: "inkshelf:reader:seconds-per-page",
};

export const loadSettings = () => ({ ...DEFAULT_SETTINGS, ...readJson(keys.settings, {}) });
export const saveSettings = (settings) => write(keys.settings, JSON.stringify(settings));

export const loadList = (key) => {
  const list = readJson(key, []);
  return Array.isArray(list) ? list : [];
};
export const saveList = (key, list) => write(key, JSON.stringify(list));

export const loadPosition = (key) => read(key);
export const savePosition = (key, cfi) => write(key, cfi);

export const loadLocations = (key) => read(key);
export const saveLocations = (key, json) => write(key, json);

export const loadSpeed = () => {
  const n = Number(read(keys.speed));
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_SECONDS_PER_PAGE;
};
export const saveSpeed = (seconds) => write(keys.speed, String(Math.round(seconds)));
