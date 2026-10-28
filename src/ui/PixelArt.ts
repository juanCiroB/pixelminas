import Phaser from 'phaser';
import { PAL } from '../theme';

// Todos los sprites se dibujan en código a partir de "mapas" de caracteres.
// Cada letra es un color de la paleta y '.' es transparente.
const CHAR: Record<string, string> = {
  k: PAL.ink, p: PAL.purple, r: PAL.red, o: PAL.orange, y: PAL.yellow, l: PAL.lime,
  g: PAL.green, t: PAL.teal, n: PAL.navy, b: PAL.blue, s: PAL.sky, c: PAL.cyan,
  w: PAL.white, v: PAL.silver, a: PAL.gray, d: PAL.slate,
};

function sprite(scene: Phaser.Scene, key: string, rows: string[], scale = 1): void {
  const w = Math.max(...rows.map((r) => r.length));
  const tex = scene.textures.createCanvas(key, w * scale, rows.length * scale);
  if (!tex) return;
  const ctx = tex.getContext();
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const color = CHAR[ch];
      if (!color) return;
      ctx.fillStyle = color;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    });
  });
  tex.refresh();
}

/** Baldosa con relieve: luz arriba/izquierda, sombra abajo/derecha. */
function bevel(scene: Phaser.Scene, key: string, fill: string, light: string, dark: string, size = 16): void {
  const tex = scene.textures.createCanvas(key, size, size);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.fillStyle = dark;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, size - 1, size - 1);
  ctx.fillStyle = fill;
  ctx.fillRect(2, 2, size - 4, size - 4);
  ctx.fillStyle = dark;
  ctx.fillRect(size - 2, 1, 1, size - 1);
  ctx.fillRect(1, size - 2, size - 1, 1);
  tex.refresh();
}

function recolor(rows: string[], map: Record<string, string>): string[] {
  return rows.map((r) => [...r].map((ch) => map[ch] ?? ch).join(''));
}

const BOMB = [
  '................',
  '...........y.o..',
  '..........o.y...',
  '.........a..o...',
  '........aa......',
  '......kkkkkk....',
  '....kkkkkkkkkk..',
  '...kkwwkkkkkkkk.',
  '...kwwkkkkkkkkk.',
  '..kkwkkkkkkkkkkk',
  '..kkkkkkkkkkkkkk',
  '..kkkkkkkkkkkkkk',
  '...kkkkkkkkkkkk.',
  '...kkkkkkkkkkkk.',
  '....kkkkkkkkkk..',
  '......kkkkkk....',
];

const FLAG = [
  '................',
  '....wrr.........',
  '....wrrrr.......',
  '....wrrrrrr.....',
  '....wrrrrrrrr...',
  '....wrrrrrrrrr..',
  '....wrrrrrr.....',
  '....wrrrr.......',
  '....wrr.........',
  '....w...........',
  '....w...........',
  '....w...........',
  '..kkkkkk........',
  '.kkkkkkkk.......',
  '................',
  '................',
];

const SHOVEL = [
  '................',
  '...........vvv..',
  '..........vwwvv.',
  '.........vwvvvv.',
  '.........vvvvvv.',
  '........ovvvvv..',
  '.......o..vvv...',
  '......o.........',
  '.....o..........',
  '....o...........',
  '...o............',
  '..oo............',
  '.ooo............',
  '.oo.............',
  '................',
  '................',
];

const CROSS = [
  'rr............rr',
  'rrr..........rrr',
  '.rrr........rrr.',
  '..rrr......rrr..',
  '...rrr....rrr...',
  '....rrr..rrr....',
  '.....rrrrrr.....',
  '......rrrr......',
  '......rrrr......',
  '.....rrrrrr.....',
  '....rrr..rrr....',
  '...rrr....rrr...',
  '..rrr......rrr..',
  '.rrr........rrr.',
  'rrr..........rrr',
  'rr............rr',
];

const CAT = [
  '................',
  '..k.........k...',
  '..kk.......kk...',
  '..kok.....kok...',
  '..kookkkkkook...',
  '.koooooooooook..',
  '.kooooooooooook.',
  '.kolkoooookloook',
  '.kokkoooookkoook',
  '.kooooooooooook.',
  '.kooooopooooook.',
  '.koowoooooowook.',
  '..kooowwwwoook..',
  '...kkoooooookk..',
  '.....kkkkkkk....',
  '................',
];

const LOCK = [
  '................',
  '.....aaaaaa.....',
  '....aa....aa....',
  '....a......a....',
  '....a......a....',
  '...yyyyyyyyyy...',
  '...yooooooooy...',
  '...yoookkoooy...',
  '...yoookkoooy...',
  '...yooookooooy..',
  '...yooookoooy...',
  '...yooooooooy...',
  '...yyyyyyyyyy...',
  '................',
  '................',
  '................',
];

const NEST = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '.....ww..cw.....',
  '....wwwwcccw....',
  '...owwwwcccwo...',
  '..ooowwwwwwooo..',
  '.oyooooooooooyo.',
  '.ooyoyooyoyooo..',
  '..oooyooyooooo..',
  '...oooooooooo...',
  '.....oooooo.....',
  '................',
  '................',
];

const SPARK = ['.y.', 'ywy', '.y.'];

export function generateTextures(scene: Phaser.Scene): void {
  bevel(scene, 'tile_hidden', PAL.blue, PAL.sky, PAL.navy);
  bevel(scene, 'tile_hover', PAL.sky, PAL.cyan, PAL.blue);
  bevel(scene, 'tile_open', PAL.slate, PAL.slate, PAL.ink);
  bevel(scene, 'tile_boom', PAL.red, PAL.orange, PAL.purple);
  bevel(scene, 'tile_safe', PAL.teal, PAL.green, PAL.ink);

  sprite(scene, 'bomb', BOMB);
  sprite(scene, 'bomb_big', BOMB, 6);
  sprite(scene, 'bomb_ghost', recolor(BOMB, { k: 'a', w: 'v' }));
  sprite(scene, 'bomb_safe', recolor(BOMB, { k: 'g', w: 'l', y: '.', o: '.', a: '.' }));
  sprite(scene, 'flag', FLAG);
  sprite(scene, 'shovel', SHOVEL);
  sprite(scene, 'cross', CROSS);
  sprite(scene, 'cat', CAT);
  sprite(scene, 'cat_big', CAT, 6);
  sprite(scene, 'lock', LOCK);
  sprite(scene, 'nest', NEST, 2);
  sprite(scene, 'spark', SPARK);

  // Partícula cuadrada para explosiones y confeti.
  const px = scene.textures.createCanvas('px', 4, 4);
  if (px) {
    const ctx = px.getContext();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 4, 4);
    px.refresh();
  }
}
