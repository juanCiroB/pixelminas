import Phaser from 'phaser';
import { C } from '../theme';
import { Sfx } from '../services/Sfx';
import { PixelButton } from '../ui/PixelButton';
import { Minigame } from './Minigame';

// Paredes como bits: N=1, E=2, S=4, W=8.
const DIRS = [
  { bit: 1, dx: 0, dy: -1, opp: 4 },
  { bit: 2, dx: 1, dy: 0, opp: 8 },
  { bit: 4, dx: 0, dy: 1, opp: 1 },
  { bit: 8, dx: -1, dy: 0, opp: 2 },
];

/** Laberinto: recorrer un laberinto con niebla hasta el corte de energía. */
export class MazeGame extends Minigame {
  private size = 6;
  private fog = 2;
  private walls: number[] = [];
  private seen = new Set<number>();
  private px = 0;
  private py = 0;
  private goal = 0;
  private cell = 40;
  private ox = 0;
  private oy = 0;
  private g!: Phaser.GameObjects.Graphics;
  private keyHandler = (e: KeyboardEvent) => this.onKey(e);

  build(): void {
    const d = this.host.difficulty;
    // Dificultad 0..6: laberinto más grande y menos visibilidad.
    this.size = [5, 6, 6, 7, 7, 8, 8][d] ?? 8;
    this.fog = [3, 2, 2, 2, 1, 1, 1][d] ?? 1;
    this.generate();

    const top = this.manual(
      'Lleva el punto VERDE hasta el CORTE ROJO.\nSolo ves lo que está cerca de ti.\n' +
        'Usa las flechas o desliza el dedo.\nChocar con una pared: -10s.',
    );

    this.cell = Math.floor(Math.min(230, this.area.width - 40) / this.size);
    const mazePx = this.cell * this.size;
    this.ox = Math.floor(this.cx - mazePx / 2);
    this.oy = top + 4;
    this.add(this.scene.add.rectangle(this.ox - 4, this.oy - 4, mazePx + 8, mazePx + 8, C.ink).setOrigin(0).setStrokeStyle(2, C.gray));
    this.g = this.add(this.scene.add.graphics());

    // Deslizar el dedo sobre el laberinto también mueve.
    const zone = this.add(this.scene.add.zone(this.ox, this.oy, mazePx, mazePx).setOrigin(0).setInteractive());
    let start: Phaser.Math.Vector2 | undefined;
    zone.on('pointerdown', (p: Phaser.Input.Pointer) => (start = new Phaser.Math.Vector2(p.x, p.y)));
    zone.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (!start) return;
      const dx = p.x - start.x;
      const dy = p.y - start.y;
      start = undefined;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
      if (Math.abs(dx) > Math.abs(dy)) this.move(dx > 0 ? 1 : 3);
      else this.move(dy > 0 ? 2 : 0);
    });

    // Cruceta.
    const padY = this.oy + mazePx + 70;
    const b = 46;
    const mk = (x: number, y: number, label: string, dir: number) =>
      this.add(new PixelButton(this.scene, x, y, b, b - 6, label, () => this.move(dir), { color: C.blue, size: 16, sound: false }));
    mk(this.cx, padY - b + 4, '^', 0);
    mk(this.cx - b - 4, padY, '<', 3);
    mk(this.cx + b + 4, padY, '>', 1);
    mk(this.cx, padY + b - 4, 'v', 2);

    this.scene.input.keyboard?.on('keydown', this.keyHandler);
    this.render();
  }

  private generate(): void {
    const n = this.size;
    this.walls = new Array(n * n).fill(15);
    // Laberinto perfecto con DFS iterativo (backtracking).
    const visited = new Set<number>([0]);
    const stack = [0];
    while (stack.length) {
      const cur = stack[stack.length - 1];
      const cx = cur % n;
      const cy = Math.floor(cur / n);
      const options = DIRS.filter((d) => {
        const nx = cx + d.dx;
        const ny = cy + d.dy;
        return nx >= 0 && ny >= 0 && nx < n && ny < n && !visited.has(ny * n + nx);
      });
      if (!options.length) {
        stack.pop();
        continue;
      }
      const d = Phaser.Utils.Array.GetRandom(options);
      const next = (cy + d.dy) * n + cx + d.dx;
      this.walls[cur] &= ~d.bit;
      this.walls[next] &= ~d.opp;
      visited.add(next);
      stack.push(next);
    }
    // La meta es la celda más lejana (por camino) desde el inicio.
    const dist = new Map<number, number>([[0, 0]]);
    const q = [0];
    let far = 0;
    while (q.length) {
      const cur = q.shift()!;
      if (dist.get(cur)! > dist.get(far)!) far = cur;
      for (const d of DIRS) {
        if (this.walls[cur] & d.bit) continue;
        const next = cur + d.dy * n + d.dx;
        if (!dist.has(next)) {
          dist.set(next, dist.get(cur)! + 1);
          q.push(next);
        }
      }
    }
    this.goal = far;
    this.px = 0;
    this.py = 0;
  }

  private onKey(e: KeyboardEvent): void {
    const map: Record<string, number> = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3 };
    if (e.key in map) this.move(map[e.key]);
  }

  private move(dir: number): void {
    if (this.done) return;
    const d = DIRS[dir];
    const idx = this.py * this.size + this.px;
    if (this.walls[idx] & d.bit) {
      Sfx.play('error');
      this.scene.cameras.main.shake(120, 0.008);
      this.host.strike(10, 'CHOCASTE CON UNA PARED');
      return;
    }
    this.px += d.dx;
    this.py += d.dy;
    Sfx.play('step');
    this.render();
    if (this.py * this.size + this.px === this.goal) this.scene.time.delayedCall(250, () => this.win());
  }

  private render(): void {
    const n = this.size;
    const c = this.cell;
    const g = this.g.clear();
    for (let i = 0; i < n * n; i++) {
      const x = i % n;
      const y = Math.floor(i / n);
      if (Math.max(Math.abs(x - this.px), Math.abs(y - this.py)) <= this.fog) this.seen.add(i);
    }
    for (let i = 0; i < n * n; i++) {
      const x = i % n;
      const y = Math.floor(i / n);
      const sx = this.ox + x * c;
      const sy = this.oy + y * c;
      const near = Math.max(Math.abs(x - this.px), Math.abs(y - this.py)) <= this.fog;
      if (!this.seen.has(i)) {
        g.fillStyle(C.navy).fillRect(sx, sy, c, c);
        continue;
      }
      g.fillStyle(near ? C.slate : 0x262b44).fillRect(sx, sy, c, c);
      g.fillStyle(near ? C.silver : C.gray);
      const w = this.walls[i];
      if (w & 1) g.fillRect(sx, sy, c, 3);
      if (w & 4) g.fillRect(sx, sy + c - 3, c, 3);
      if (w & 8) g.fillRect(sx, sy, 3, c);
      if (w & 2) g.fillRect(sx + c - 3, sy, 3, c);
    }
    // Meta (siempre visible) y jugador.
    const gx = this.ox + (this.goal % n) * c + c / 2;
    const gy = this.oy + Math.floor(this.goal / n) * c + c / 2;
    const s = c * 0.22;
    g.lineStyle(4, C.red).lineBetween(gx - s, gy - s, gx + s, gy + s).lineBetween(gx - s, gy + s, gx + s, gy - s);
    g.fillStyle(C.lime).fillCircle(this.ox + this.px * c + c / 2, this.oy + this.py * c + c / 2, c * 0.28);
  }

  destroy(): void {
    this.scene.input.keyboard?.off('keydown', this.keyHandler);
    super.destroy();
  }
}
