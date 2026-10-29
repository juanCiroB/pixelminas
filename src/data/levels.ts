export type MinigameKey = 'wires' | 'switches' | 'echo' | 'code' | 'maze' | 'pipes' | 'core';

export const MINIGAME_NAMES: Record<MinigameKey, string> = {
  wires: 'CABLES',
  switches: 'INTERRUPTORES',
  echo: 'ECO INVERSO',
  code: 'CÓDIGO',
  maze: 'LABERINTO',
  pipes: 'TUBERÍAS',
  core: 'NÚCLEO',
};

const ALL: MinigameKey[] = ['wires', 'switches', 'echo', 'code', 'maze', 'pipes', 'core'];

export interface LevelDef {
  id: number;
  name: string;
  /**
   * Mini juegos posibles en el nivel. Con uno solo, todas las bombas usan ese;
   * con varios, cada bomba usa uno distinto (en orden, o al azar si random).
   */
  minigames: MinigameKey[];
  random?: boolean;
  tier: number; // 0..3: escalón de dificultad de los mini juegos
  cols: number;
  rows: number;
  bombs: number;
  time: number; // segundos del buscaminas (se pausa al desactivar)
  wrongFlagPenalty: number; // segundos que resta una bandera mal puesta
}

export const DEFUSE_TIME = 180; // 3 minutos para cada mini juego
export const STRIKE_PENALTY = 20; // segundos que resta un error dentro del mini juego
export const MAX_DIFFICULTY = 6;

// Progresión en cuatro tramos:
//  1-7   presentan cada mini juego en su versión más amable (tier 0).
//  8-14  repiten los mini juegos más exigentes (tier 1).
//  15-17 mezclan mini juegos dentro del mismo nivel (tier 2).
//  18-20 caos: mini juego al azar por bomba, en su versión más difícil (tier 2-3).
// En paralelo el tablero crece, el tiempo del buscaminas baja y la bandera falsa castiga más.
type Row = [name: string, minigames: MinigameKey[], tier: number, cols: number, rows: number, time: number, penalty: number, random?: boolean];

const TABLE: Row[] = [
  ['CABLES', ['wires'], 0, 8, 10, 180, 5],
  ['INTERRUPTORES', ['switches'], 0, 8, 10, 175, 6],
  ['ECO INVERSO', ['echo'], 0, 8, 11, 175, 8],
  ['CÓDIGO', ['code'], 0, 8, 11, 170, 10],
  ['LABERINTO', ['maze'], 0, 9, 11, 170, 10],
  ['TUBERÍAS', ['pipes'], 0, 9, 12, 165, 12],
  ['NÚCLEO', ['core'], 0, 9, 12, 165, 12],
  ['CABLES II', ['wires'], 1, 9, 12, 160, 14],
  ['INTERRUPTORES II', ['switches'], 1, 9, 13, 160, 15],
  ['ECO INVERSO II', ['echo'], 1, 9, 13, 155, 16],
  ['CÓDIGO II', ['code'], 1, 10, 13, 155, 18],
  ['LABERINTO II', ['maze'], 1, 10, 13, 150, 18],
  ['TUBERÍAS II', ['pipes'], 1, 10, 13, 150, 20],
  ['NÚCLEO II', ['core'], 1, 10, 14, 150, 20],
  ['MEZCLA I', ['wires', 'switches', 'echo', 'wires', 'switches'], 2, 10, 14, 145, 22],
  ['MEZCLA II', ['code', 'maze', 'pipes', 'code', 'maze'], 2, 10, 14, 140, 24],
  ['MEZCLA III', ['core', 'echo', 'pipes', 'code', 'core'], 2, 10, 14, 135, 25],
  ['CAOS', ALL, 2, 10, 14, 130, 26, true],
  ['CAOS II', ALL, 3, 10, 14, 125, 28, true],
  ['DETONADOR FINAL', ALL, 3, 10, 14, 120, 30, true],
];

export const LEVELS: LevelDef[] = TABLE.map(([name, minigames, tier, cols, rows, time, wrongFlagPenalty, random], i) => ({
  id: i + 1,
  name,
  minigames,
  random,
  tier,
  cols,
  rows,
  bombs: 5,
  time,
  wrongFlagPenalty,
}));

export const getLevel = (id: number): LevelDef => LEVELS[Math.min(Math.max(id, 1), LEVELS.length) - 1];

/** Mini juego de una bomba concreta del nivel. */
export function minigameFor(lvl: LevelDef, bombIndex: number): MinigameKey {
  if (lvl.random) return lvl.minigames[Math.floor(Math.random() * lvl.minigames.length)];
  return lvl.minigames[bombIndex % lvl.minigames.length];
}

/**
 * Dificultad del mini juego en una escala 0..6. Sube con el tramo del nivel y,
 * dentro del nivel, cada dos bombas: 0-2 en tier 0, 2-4 en tier 1, 4-6 en tier 2
 * y siempre 6 en tier 3.
 */
export function difficultyFor(lvl: LevelDef, bombIndex: number): number {
  return Math.min(MAX_DIFFICULTY, lvl.tier * 2 + Math.floor(bombIndex / 2));
}
