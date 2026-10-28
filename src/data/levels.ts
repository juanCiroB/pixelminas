export type MinigameKey = 'wires' | 'switches' | 'echo' | 'code' | 'maze' | 'pipes' | 'core';

export interface LevelDef {
  id: number;
  name: string; // nombre del mini juego de desactivación
  minigame: MinigameKey;
  cols: number;
  rows: number;
  bombs: number;
  time: number; // segundos para completar el nivel (se pausa al desactivar)
  wrongFlagPenalty: number; // segundos que resta una bandera mal puesta
}

export const DEFUSE_TIME = 180; // 3 minutos para cada bomba
export const STRIKE_PENALTY = 20; // segundos que resta un error dentro del mini juego

// La dificultad sube por tres vías: tablero más grande, menos tiempo de margen
// y castigo mayor por bandera falsa, además de un mini juego más complejo.
export const LEVELS: LevelDef[] = [
  { id: 1, name: 'CABLES', minigame: 'wires', cols: 8, rows: 10, bombs: 5, time: 150, wrongFlagPenalty: 10 },
  { id: 2, name: 'INTERRUPTORES', minigame: 'switches', cols: 8, rows: 11, bombs: 5, time: 150, wrongFlagPenalty: 12 },
  { id: 3, name: 'ECO INVERSO', minigame: 'echo', cols: 9, rows: 11, bombs: 5, time: 160, wrongFlagPenalty: 15 },
  { id: 4, name: 'CÓDIGO', minigame: 'code', cols: 9, rows: 12, bombs: 5, time: 160, wrongFlagPenalty: 18 },
  { id: 5, name: 'LABERINTO', minigame: 'maze', cols: 9, rows: 13, bombs: 5, time: 170, wrongFlagPenalty: 20 },
  { id: 6, name: 'TUBERÍAS', minigame: 'pipes', cols: 10, rows: 13, bombs: 5, time: 170, wrongFlagPenalty: 25 },
  { id: 7, name: 'NÚCLEO', minigame: 'core', cols: 10, rows: 14, bombs: 5, time: 180, wrongFlagPenalty: 30 },
];

export const getLevel = (id: number): LevelDef => LEVELS[Math.min(Math.max(id, 1), LEVELS.length) - 1];
