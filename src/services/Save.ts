// Persistencia de datos: todo lo que debe sobrevivir entre vistas y entre sesiones
// se guarda en localStorage (dentro de la app Android vive en el WebView de Capacitor).
// El estado temporal de una partida viaja entre escenas con el registry de Phaser.

export interface RunEntry {
  level: number;
  score: number;
  date: string;
}

export interface SaveData {
  unlocked: number; // nivel más alto desbloqueado (1..7)
  best: Record<number, number>; // mejor puntaje por nivel
  history: RunEntry[]; // últimos niveles superados
  sound: boolean;
  music: boolean;
  eggs: string[]; // easter eggs descubiertos
  catMode: boolean;
}

const KEY = 'pixelminas.save.v1';

const DEFAULTS: SaveData = {
  unlocked: 1,
  best: {},
  history: [],
  sound: true,
  music: true,
  eggs: [],
  catMode: false,
};

function load(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULTS);
    return { ...structuredClone(DEFAULTS), ...JSON.parse(raw) };
  } catch {
    return structuredClone(DEFAULTS);
  }
}

class SaveStore {
  data: SaveData = load();

  persist(): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.data));
    } catch {
      // Sin almacenamiento (modo privado): el juego sigue funcionando sin guardar.
    }
  }

  recordLevel(level: number, score: number): boolean {
    const prev = this.data.best[level] ?? 0;
    const isRecord = score > prev;
    if (isRecord) this.data.best[level] = score;
    this.data.unlocked = Math.max(this.data.unlocked, Math.min(level + 1, 7));
    this.data.history.unshift({ level, score, date: new Date().toISOString() });
    this.data.history = this.data.history.slice(0, 20);
    this.persist();
    return isRecord;
  }

  totalBest(): number {
    return Object.values(this.data.best).reduce((a, b) => a + b, 0);
  }

  /** Registra un easter egg; devuelve true si es la primera vez que se encuentra. */
  findEgg(id: string): boolean {
    if (this.data.eggs.includes(id)) return false;
    this.data.eggs.push(id);
    this.persist();
    return true;
  }

  set<K extends keyof SaveData>(key: K, value: SaveData[K]): void {
    this.data[key] = value;
    this.persist();
  }

  reset(): void {
    this.data = structuredClone(DEFAULTS);
    this.persist();
  }
}

export const Save = new SaveStore();
export const TOTAL_EGGS = 3;
