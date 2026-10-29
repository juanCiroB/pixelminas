import Phaser from 'phaser';
import { C } from '../theme';
import { Sfx } from '../services/Sfx';
import { Minigame } from './Minigame';

// Conexiones como bits: N=1, E=2, S=4, W=8.
const N = 1, E = 2, S = 4, W = 8;
const STEPS = [
  { bit: N, dx: 0, dy: -1, opp: S },
  { bit: E, dx: 1, dy: 0, opp: W },
  { bit: S, dx: 0, dy: 1, opp: N },
  { bit: W, dx: -1, dy: 0, opp: E },
];
const rotateCW = (m: number) => ((m << 1) | (m >> 3)) & 15;

/** Tuberías: girar tuberías para llevar refrigerante al núcleo de la bomba. */
export class PipesGame extends Minigame {
  private size = 4;
  private masks: number[] = [];
  private srcRow = 0;
  private dstRow = 0;
  private tile = 60;
  private ox = 0;
  private oy = 0;
  private g!: Phaser.GameObjects.Graphics;

  build(): void {
    // Dificultad 0..6: la cuadrícula pasa de 4x4 a 6x6.
    this.size = [4, 4, 4, 5, 5, 5, 6][this.host.difficulty] ?? 6;
    this.generate();

    const top = this.manual(
      'Toca una tubería para girarla.\nConecta el REFRIGERANTE (azul, a la izquierda) con el NÚCLEO (rojo, a la derecha) para enfriar la bomba.',
    );

    this.tile = Math.floor(Math.min(260 / this.size, 60));
    const px = this.tile * this.size;
    this.ox = Math.floor(this.cx - px / 2);
    this.oy = top + 20;
    this.add(this.scene.add.rectangle(this.ox - 4, this.oy - 4, px + 8, px + 8, C.ink).setOrigin(0).setStrokeStyle(2, C.gray));
    // Tanque de refrigerante y núcleo.
    this.add(this.scene.add.rectangle(this.ox - 20, this.oy + this.srcRow * this.tile + this.tile / 2, 24, this.tile - 10, C.sky).setStrokeStyle(2, C.ink));
    const core = this.add(this.scene.add.rectangle(this.ox + px + 20, this.oy + this.dstRow * this.tile + this.tile / 2, 24, this.tile - 10, C.red).setStrokeStyle(2, C.ink));
    this.scene.tweens.add({ targets: core, alpha: 0.5, duration: 300, yoyo: true, repeat: -1 });

    this.g = this.add(this.scene.add.graphics());
    const zone = this.add(this.scene.add.zone(this.ox, this.oy, px, px).setOrigin(0).setInteractive({ useHandCursor: true }));
    zone.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.done) return;
      const x = Math.floor((p.x - this.ox) / this.tile);
      const y = Math.floor((p.y - this.oy) / this.tile);
      if (x < 0 || y < 0 || x >= this.size || y >= this.size) return;
      const i = y * this.size + x;
      this.masks[i] = rotateCW(this.masks[i]);
      Sfx.play('rotate');
      if (this.render()) {
        Sfx.play('defused');
        this.scene.time.delayedCall(500, () => this.win());
      }
    });
    this.render();
  }

  private generate(): void {
    const n = this.size;
    this.srcRow = Phaser.Math.Between(0, n - 1);
    this.dstRow = Phaser.Math.Between(0, n - 1);
    // Camino aleatorio (DFS) desde la entrada hasta la salida.
    const start = this.srcRow * n;
    const end = this.dstRow * n + n - 1;
    const stack = [start];
    const visited = new Set([start]);
    while (stack[stack.length - 1] !== end) {
      const cur = stack[stack.length - 1];
      const x = cur % n;
      const y = Math.floor(cur / n);
      const opts = Phaser.Utils.Array.Shuffle(STEPS.slice()).filter((s) => {
        const nx = x + s.dx;
        const ny = y + s.dy;
        return nx >= 0 && ny >= 0 && nx < n && ny < n && !visited.has(ny * n + nx);
      });
      if (!opts.length) {
        stack.pop();
        continue;
      }
      const next = (y + opts[0].dy) * n + x + opts[0].dx;
      visited.add(next);
      stack.push(next);
    }
    // Cada celda del camino conecta con la anterior y la siguiente.
    this.masks = new Array(n * n).fill(0);
    const dirTo = (a: number, b: number) => STEPS.find((s) => a + s.dy * n + s.dx === b && Math.abs((a % n) - (b % n)) <= 1)!;
    stack.forEach((cell, i) => {
      let m = 0;
      m |= i === 0 ? W : dirTo(cell, stack[i - 1]).bit;
      m |= i === stack.length - 1 ? E : dirTo(cell, stack[i + 1]).bit;
      this.masks[cell] = m;
    });
    // El resto se rellena con piezas aleatorias (recta, codo o T).
    for (let i = 0; i < n * n; i++) {
      if (!this.masks[i]) this.masks[i] = Phaser.Utils.Array.GetRandom([N | S, N | E, N | E | S]);
      for (let r = Phaser.Math.Between(0, 3); r > 0; r--) this.masks[i] = rotateCW(this.masks[i]);
    }
    if (this.flow().solved) this.masks[start] = rotateCW(this.masks[start]);
  }

  /** Recorre las tuberías conectadas desde el tanque (BFS). */
  private flow(): { wet: Set<number>; solved: boolean } {
    const n = this.size;
    const wet = new Set<number>();
    const start = this.srcRow * n;
    if (!(this.masks[start] & W)) return { wet, solved: false };
    const q = [start];
    wet.add(start);
    while (q.length) {
      const cur = q.shift()!;
      const x = cur % n;
      const y = Math.floor(cur / n);
      for (const s of STEPS) {
        if (!(this.masks[cur] & s.bit)) continue;
        const nx = x + s.dx;
        const ny = y + s.dy;
        if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue;
        const next = ny * n + nx;
        if (!wet.has(next) && this.masks[next] & s.opp) {
          wet.add(next);
          q.push(next);
        }
      }
    }
    const end = this.dstRow * n + n - 1;
    return { wet, solved: wet.has(end) && (this.masks[end] & E) !== 0 };
  }

  private render(): boolean {
    const { wet, solved } = this.flow();
    const n = this.size;
    const t = this.tile;
    const g = this.g.clear();
    const pw = Math.max(8, Math.floor(t / 4));
    for (let i = 0; i < n * n; i++) {
      const x = this.ox + (i % n) * t;
      const y = this.oy + Math.floor(i / n) * t;
      g.fillStyle(C.slate).fillRect(x + 1, y + 1, t - 2, t - 2);
      const m = this.masks[i];
      const mx = x + t / 2;
      const my = y + t / 2;
      const color = wet.has(i) ? C.sky : C.gray;
      const draw = (rx: number, ry: number, rw: number, rh: number) => {
        g.fillStyle(C.ink).fillRect(rx - 2, ry - 2, rw + 4, rh + 4);
        g.fillStyle(color).fillRect(rx, ry, rw, rh);
      };
      if (m & N) draw(mx - pw / 2, y, pw, t / 2);
      if (m & S) draw(mx - pw / 2, my, pw, t / 2);
      if (m & W) draw(x, my - pw / 2, t / 2, pw);
      if (m & E) draw(mx, my - pw / 2, t / 2, pw);
      g.fillStyle(color).fillRect(mx - pw / 2, my - pw / 2, pw, pw);
    }
    return solved;
  }
}
