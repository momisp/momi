/** 贴图槽位：有 PNG 则用，否则 render 内矢量修仙风 */

const cache = new Map();

export async function loadSpriteSlots() {
  try {
    const res = await fetch(new URL('./assets/ai/slots.json', import.meta.url));
    if (!res.ok) return {};
    const slots = await res.json();
    const out = {};
    for (const [key, file] of Object.entries(slots)) {
      try {
        const img = new Image();
        img.src = new URL(`./assets/ai/${file}`, import.meta.url).href;
        await img.decode();
        out[key] = img;
      } catch {
        /* 矢量回退 */
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function getCachedSprites() {
  return cache;
}

const CORE_AI_KEYS = ['player', 'enemy_red', 'enemy_blue', 'enemy_yellow'];

export async function initSprites() {
  const loaded = await loadSpriteSlots();
  cache.clear();
  Object.assign(cache, loaded);
  const aiLoaded = CORE_AI_KEYS.filter((k) => loaded[k]).length;
  return { sprites: cache, aiLoaded, aiExpected: CORE_AI_KEYS.length };
}
