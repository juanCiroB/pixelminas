import Phaser from 'phaser';
import { C, PAL, txt } from '../theme';
import { Sfx } from '../services/Sfx';
import { PixelButton } from '../ui/PixelButton';
import { Minigame } from './Minigame';

const MAX_TRIES = 6;

/** Nivel 4: deducir un código secreto con pistas de colores. */
export class CodeGame extends Minigame {
  private code: number[] = [];
  private guess: number[] = [];
  private tries = 0;
  private history: number[][] = [];
  private board!: Phaser.GameObjects.Container;
  private triesText!: Phaser.GameObjects.Text;
  private rowsTop = 0;

  build(): void {
    const len = this.host.difficulty < 2 ? 3 : 4;
    this.code = Phaser.Utils.Array.Shuffle([1, 2, 3, 4, 5, 6]).slice(0, len);

    const top = this.manual(
      `Adivina el código de ${len} dígitos (del 1 al 6, sin repetir).\n` +
        'VERDE: dígito y posición correctos.\nAMARILLO: está, pero en otro lugar.\nGRIS: no está.\n' +
        `Cada ${MAX_TRIES} intentos fallidos: -20s.`,
    );

    this.triesText = this.add(txt(this.scene, this.cx, top + 4, '', 8, PAL.silver));
    this.rowsTop = top + 22;
    this.board = this.add(this.scene.add.container(0, 0));

    const keysTop = this.rowsTop + 7 * 30 + 10;
    for (let d = 1; d <= 6; d++) {
      const col = (d - 1) % 3;
      const row = Math.floor((d - 1) / 3);
      this.add(new PixelButton(this.scene, this.cx - 70 + col * 70, keysTop + row * 46, 60, 38, String(d), () => this.type(d), { color: C.blue, size: 16, sound: false }));
    }
    this.add(new PixelButton(this.scene, this.cx - 60, keysTop + 94, 110, 36, 'BORRAR', () => {
      this.guess.pop();
      this.render();
    }, { color: C.slate }));
    this.add(new PixelButton(this.scene, this.cx + 60, keysTop + 94, 110, 36, 'ENTRAR', () => this.submit(), { color: C.green }));
    this.render();
  }

  private type(d: number): void {
    if (this.done || this.guess.length >= this.code.length || this.guess.includes(d)) {
      Sfx.play('wrong');
      return;
    }
    Sfx.play('blip');
    this.guess.push(d);
    this.render();
  }

  private submit(): void {
    if (this.done) return;
    if (this.guess.length < this.code.length) {
      Sfx.play('wrong');
      return;
    }
    this.history.push(this.guess);
    this.guess = [];
    if (this.history[this.history.length - 1].every((d, i) => d === this.code[i])) {
      this.render();
      this.scene.time.delayedCall(400, () => this.win());
      return;
    }
    this.tries++;
    if (this.tries >= MAX_TRIES) {
      this.tries = 0;
      this.host.strike(undefined, 'DEMASIADOS INTENTOS');
    }
    this.render();
  }

  /** Redibuja las últimas filas de intentos y la fila que se está escribiendo. */
  private render(): void {
    this.board.removeAll(true);
    const len = this.code.length;
    const box = 30;
    const startX = this.cx - ((len - 1) * (box + 6)) / 2;
    const rows = [...this.history.slice(-6), this.guess];
    rows.forEach((row, r) => {
      const isCurrent = r === rows.length - 1;
      const y = this.rowsTop + r * 30 + 14;
      for (let i = 0; i < len; i++) {
        const d = row[i];
        let fill = C.slate;
        if (!isCurrent) {
          fill = d === this.code[i] ? C.green : this.code.includes(d) ? C.orange : C.gray;
        }
        const rect = this.scene.add.rectangle(startX + i * (box + 6), y, box, 26, fill).setStrokeStyle(2, isCurrent ? C.sky : C.ink);
        this.board.add(rect);
        if (d) this.board.add(txt(this.scene, rect.x, y + 1, String(d), 16, PAL.white));
      }
    });
    this.triesText.setText(`INTENTOS: ${this.tries}/${MAX_TRIES}`);
  }
}
