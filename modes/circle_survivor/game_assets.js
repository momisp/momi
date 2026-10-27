/** 运行时资源就绪探测（PNG / Kenney ogg） */

const AI_SLOT_FILES = ['player.png', 'enemy_red.png', 'enemy_blue.png', 'enemy_yellow.png'];

export async function probeAiSprites() {
  let loaded = 0;
  for (const file of AI_SLOT_FILES) {
    try {
      const url = new URL(`./assets/ai/${file}`, import.meta.url).href;
      const res = await fetch(url, { method: 'HEAD' });
      if (res.ok) loaded += 1;
    } catch {
      /* missing */
    }
  }
  return { loaded, expected: AI_SLOT_FILES.length };
}

export async function probeSfxManifest() {
  try {
    const res = await fetch(new URL('./assets/sfx/manifest.json', import.meta.url));
    if (!res.ok) return { loaded: 0, expected: 11 };
    const manifest = await res.json();
    const events = manifest.events || {};
    const expected = Object.keys(events).length;
    const okFlags = await Promise.all(
      Object.values(events).map(async (file) => {
        try {
          const r = await fetch(new URL(`./assets/sfx/${file}`, import.meta.url), { method: 'HEAD' });
          return r.ok;
        } catch {
          return false;
        }
      }),
    );
    const loaded = okFlags.filter(Boolean).length;
    return { loaded, expected };
  } catch {
    return { loaded: 0, expected: 11 };
  }
}

export async function probeAllGameAssets() {
  const [ai, sfx] = await Promise.all([probeAiSprites(), probeSfxManifest()]);
  return { ai, sfx, ready: ai.loaded >= 4 && sfx.loaded >= 11 };
}
