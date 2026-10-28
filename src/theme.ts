import Phaser from 'phaser';

// Resolución lógica del juego (vertical). Phaser la escala para llenar la pantalla.
export const GAME_W = 360;
export const GAME_H = 640;

export const FONT = '"Press Start 2P", monospace';

// Paleta "Sweetie 16" (GrafxKid, uso libre). Todos los colores del juego salen de aquí.
export const PAL = {
  ink: '#1a1c2c',
  purple: '#5d275d',
  red: '#b13e53',
  orange: '#ef7d57',
  yellow: '#ffcd75',
  lime: '#a7f070',
  green: '#38b764',
  teal: '#257179',
  navy: '#29366f',
  blue: '#3b5dc9',
  sky: '#41a6f6',
  cyan: '#73eff7',
  white: '#f4f4f4',
  silver: '#94b0c2',
  gray: '#566c86',
  slate: '#333c57',
} as const;

export type PalKey = keyof typeof PAL;

/** Convierte '#rrggbb' en el número 0xrrggbb que usan Graphics y Rectangle. */
export function hex(color: string): number {
  return parseInt(color.slice(1), 16);
}

export const C = Object.fromEntries(
  Object.entries(PAL).map(([k, v]) => [k, hex(v)]),
) as Record<PalKey, number>;

// La fuente Press Start 2P no trae mayúsculas acentuadas (Á, É...): las dibuja
// en minúscula. Quitamos tildes y diéresis de todo texto (la Ñ sí existe).
export function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[́̀̈]/g, '').normalize('NFC');
}
const originalSetText = Phaser.GameObjects.Text.prototype.setText;
Phaser.GameObjects.Text.prototype.setText = function (this: Phaser.GameObjects.Text, value: string | string[]) {
  const v = Array.isArray(value) ? value.map(stripAccents) : stripAccents(String(value));
  return originalSetText.call(this, v);
};

/** Texto pixel art centrado. size debería ser múltiplo de 8 para verse nítido. */
export function txt(
  scene: Phaser.Scene,
  x: number,
  y: number,
  s: string,
  size = 8,
  color: string = PAL.white,
  extra: Phaser.Types.GameObjects.Text.TextStyle = {},
): Phaser.GameObjects.Text {
  return scene.add
    .text(x, y, s, {
      fontFamily: FONT,
      fontSize: `${size}px`,
      color,
      align: 'center',
      lineSpacing: 6,
      ...extra,
    })
    .setOrigin(0.5);
}

export function formatTime(totalSec: number): string {
  const s = Math.max(0, Math.ceil(totalSec));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}
