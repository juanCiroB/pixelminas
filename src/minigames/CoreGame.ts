import Phaser from 'phaser';
import { C, PAL, txt } from '../theme';
import { Sfx } from '../services/Sfx';
import { PixelButton } from '../ui/PixelButton';
import { Minigame } from './Minigame';

/** Núcleo: apagar todas las luces del núcleo; cada toque invierte la celda y sus vecinas. */
export class CoreGame extends Minigame {
  private size = 4;
  private lights: boolean[] = [];
  private initial: boolean[] = [];
  private cells: Phaser.GameObjects.Rectangle[] = [];
  private moves = 0;
  private movesText!: Phaser.GameObjects.Text;

  build(): void {
    const d = this.host.difficulty;
    // Dificultad 0..6: panel más grande y más luces encendidas al empezar.
    this.size = [3, 4, 4, 4, 5, 5, 5][d] ?? 5;
    const presses = [3, 3, 4, 5, 5, 6, 7][d] ?? 7;

    // Se parte del panel apagado y se aplican toques al azar: así siempre tiene solución.
    do {
      this.lights = new Array(this.size * this.size).fill(false);
      const picks = Phaser.Utils.Array.Shuffle([...Array(this.size * this.size).keys()]).slice(0, presses);
      picks.forEach((i) => this.toggle(i));
    } while (this.lights.every((l) => !l));
    this.initial = [...this.lights];

    const top = this.manual(
      'Al tocar una celda se invierten ella y sus vecinas (arriba, abajo, izquierda y derecha).\n' +
        'APAGA TODAS las luces del núcleo.\nTRUCO: deshacer un toque es tocar la misma celda otra vez.',
    );

    this.movesText = this.add(txt(this.scene, this.cx, top + 4, '', 8, PAL.silver));
    const cell = Math.floor(Math.min(270 / this.size, 62));
    const px = cell * this.size;
    const ox = this.cx - px / 2;
    const oy = top + 22;
    this.add(this.scene.add.rectangle(ox - 6, oy - 6, px + 12, px + 12, C.ink).setOrigin(0).setStrokeStyle(2, C.purple));
    for (let i = 0; i < this.size * this.size; i++) {
      const x = ox + (i % this.size) * cell + cell / 2;
      const y = oy + Math.floor(i / this.size) * cell + cell / 2;
      const r = this.add(this.scene.add.rectangle(x, y, cell - 6, cell - 6, C.slate).setStrokeStyle(2, C.ink));
      r.setInteractive({ useHandCursor: true });
      r.on('pointerdown', () => this.press(i));
      this.cells.push(r);
    }

    this.add(new PixelButton(this.scene, this.cx, oy + px + 40, 200, 34, 'REINICIAR PANEL', () => {
      this.lights = [...this.initial];
      this.moves = 0;
      this.render();
    }, { color: C.purple }));
    this.render();
  }

  private toggle(i: number): void {
    const n = this.size;
    const x = i % n;
    const y = Math.floor(i / n);
    const flip = (cx: number, cy: number) => {
      if (cx >= 0 && cy >= 0 && cx < n && cy < n) this.lights[cy * n + cx] = !this.lights[cy * n + cx];
    };
    flip(x, y);
    flip(x - 1, y);
    flip(x + 1, y);
    flip(x, y - 1);
    flip(x, y + 1);
  }

  private press(i: number): void {
    if (this.done) return;
    this.toggle(i);
    this.moves++;
    Sfx.play('blip');
    this.scene.tweens.add({ targets: this.cells[i], scale: 0.85, duration: 60, yoyo: true });
    this.render();
    if (this.lights.every((l) => !l)) this.scene.time.delayedCall(350, () => this.win());
  }

  private render(): void {
    this.lights.forEach((on, i) => {
      this.cells[i].setFillStyle(on ? C.yellow : C.slate).setStrokeStyle(2, on ? C.orange : C.ink);
    });
    const left = this.lights.filter(Boolean).length;
    this.movesText.setText(`LUCES: ${left}   MOVIMIENTOS: ${this.moves}`);
  }
}
