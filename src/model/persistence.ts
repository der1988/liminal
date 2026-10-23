import { snapshot, restore, type WorldState } from "./snapshot";
import type { World } from "./world";
export interface ObserverState {
  speed: 0 | 1 | 3 | 8;
  accumulator: number;
  camera: { x: number; y: number; zoom: number; follow: string | null };
  selected: string | null;
}
export interface SaveEnvelope {
  version: 1;
  savedAt: number;
  payload: string;
  checksum: string;
}
export const STORAGE_KEY = "observer-lives-v1";
function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}
export function encode(w: World, observer: ObserverState): SaveEnvelope {
  const payload = JSON.stringify({ world: snapshot(w), observer });
  return { version: 1, savedAt: Date.now(), payload, checksum: hash(payload) };
}
export function decode(envelope: unknown) {
  const e = envelope as SaveEnvelope;
  if (
    !e ||
    e.version !== 1 ||
    !Number.isFinite(e.savedAt) ||
    e.savedAt < 0 ||
    typeof e.payload !== "string" ||
    e.checksum !== hash(e.payload)
  )
    throw Error("Formato o integrità del salvataggio non validi");
  const data = JSON.parse(e.payload) as {
    world: WorldState;
    observer: ObserverState;
  };
  const w = restore(data.world),
    o = data.observer;
  if (
    !o ||
    ![0, 1, 3, 8].includes(o.speed) ||
    !Number.isFinite(o.accumulator) ||
    o.accumulator < 0 ||
    o.accumulator > 1 ||
    !o.camera ||
    ![o.camera.x, o.camera.y, o.camera.zoom].every(Number.isFinite) ||
    o.camera.zoom < 0.2 ||
    o.camera.zoom > 4 ||
    (o.selected !== null && !w.souls.has(o.selected)) ||
    (o.camera.follow !== null && !w.souls.has(o.camera.follow))
  )
    throw Error("Stato osservatore non valido");
  return { world: w, observer: o, savedAt: e.savedAt };
}
function request<T>(r: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
export class Persistence {
  private db: IDBDatabase | null = null;
  async open() {
    if (!("indexedDB" in globalThis)) return;
    this.db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open(STORAGE_KEY, 1);
      r.onupgradeneeded = () => r.result.createObjectStore("saves");
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
      r.onblocked = () => reject(Error("Archivio occupato da un’altra scheda"));
    });
  }
  async load() {
    let primary: unknown = null,
      backup: unknown = null,
      journal: unknown = null;
    try {
      await this.open();
      if (this.db) {
        const store = this.db
          .transaction("saves", "readonly")
          .objectStore("saves");
        [primary, backup] = await Promise.all([
          request(store.get("primary")),
          request(store.get("backup")),
        ]);
      }
    } catch {
      /* A local journal can still restore the scene. */
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      try {
        journal = JSON.parse(raw ?? "null");
      } catch {
        journal = { corruptRaw: raw };
      }
    } catch {
      /* Read failure is reported if no usable save exists. */
    }
    let recovered = false;
    const candidates = [];
    for (const [index, e] of [journal, primary, backup].entries()) {
      if (!e) continue;
      try {
        candidates.push({ data: decode(e), index });
      } catch {
        recovered = true;
      }
    }
    candidates.sort((a, b) => b.data.savedAt - a.data.savedAt);
    if (candidates.length)
      return {
        data: candidates[0].data,
        warning: recovered
          ? "Ripristinata una copia valida dell’universo."
          : null,
      };
    if (primary || backup || journal) {
      if (this.db) {
        const t = this.db.transaction("saves", "readwrite");
        t.objectStore("saves").put(
          { primary, backup, journal },
          "recovery-" + Date.now(),
        );
      }
      if (!this.db) {
        try {
          localStorage.setItem(
            STORAGE_KEY + "-recovery-" + Date.now(),
            JSON.stringify({ primary, backup, journal }),
          );
        } catch {
          return {
            data: null,
            warning:
              "Il salvataggio non è leggibile e non è stato possibile conservarne una copia.",
          };
        }
      }
      return {
        data: null,
        warning:
          "Salvataggio non compatibile: la copia originale è conservata. È iniziato un nuovo universo.",
      };
    }
    return { data: null, warning: null };
  }
  async save(envelope: SaveEnvelope) {
    if (!this.db) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
      return;
    }
    const db = this.db;
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("saves", "readwrite"),
        store = tx.objectStore("saves"),
        old = store.get("primary");
      old.onsuccess = () => {
        if (old.result) store.put(old.result, "backup");
        store.put(envelope, "primary");
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }
  journal(envelope: SaveEnvelope) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
      return true;
    } catch {
      return false;
    }
  }
  close() {
    this.db?.close();
  }
}
