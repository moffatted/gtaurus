import { Store } from "@tauri-apps/plugin-store";
import { isTauriApp } from "../utils/platform";
import type { Settings } from "./settingsStore";

let tauriStore: Store | null = null;

async function getTauriStore(): Promise<Store | null> {
  if (tauriStore) return tauriStore;

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      console.warn("[settings] Store.load timed out after 3s");
      resolve(null);
    }, 3000);

    Store.load("settings.json")
      .then((s) => {
        clearTimeout(timer);
        tauriStore = s;
        resolve(s);
      })
      .catch((err) => {
        clearTimeout(timer);
        console.error("[settings] Store.load failed:", err);
        resolve(null);
      });
  });
}

export async function loadSettingsFromStorage(storeKey: string): Promise<Settings | null> {
  try {
    if (isTauriApp()) {
      const s = await getTauriStore();
      if (!s) return null;

      return await new Promise((resolve) => {
        const timer = setTimeout(() => {
          console.warn("[settings] s.get timed out after 2s");
          resolve(null);
        }, 2000);

        s.get<Settings>(storeKey)
          .then((val) => {
            clearTimeout(timer);
            resolve(val ?? null);
          })
          .catch((err) => {
            clearTimeout(timer);
            console.error("[settings] s.get failed:", err);
            resolve(null);
          });
      });
    }

    const raw = localStorage.getItem(storeKey);
    return raw ? (JSON.parse(raw) as Settings) : null;
  } catch (err) {
    console.error("[settings] Failed to load from storage:", err);
    return null;
  }
}

export async function saveSettingsToStorage(storeKey: string, settings: Settings): Promise<void> {
  try {
    if (isTauriApp()) {
      const s = await getTauriStore();
      if (!s) return;
      await s.set(storeKey, settings);
      await s.save();
      return;
    }

    localStorage.setItem(storeKey, JSON.stringify(settings));
  } catch (err) {
    console.error("[settings] Failed to save:", err);
  }
}
