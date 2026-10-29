import Phaser from 'phaser';
import { C, PAL, txt } from '../theme';
import { Sfx, SfxName } from '../services/Sfx';
import { PixelButton } from '../ui/PixelButton';
import { Minigame } from './Minigame';

const PADS: { color: number; sound: SfxName }[] = [
  { color: C.red, sound: 'padR' },
  { color: C.blue, sound: 'padB' },
  { color: C.green, sound: 'padG' },
  { color: C.yellow, sound: 'padY' },
];

/** Eco inverso: memorizar una secuencia de luces y repetirla al revés. */
export class EchoGame extends Minigame {
  private seq: number[] = [];
  private input: number[] = [];
  private locked = true;
  private pads: Phaser.GameObjects.Rectangle[] = [];
  private status!: Phaser.GameObjects.Text;
  private step = 600; // ms entre luces

  build(): void {
    // Dificultad 0..6: secuencia más larga y, desde 5, más rápida.
    const d = this.host.difficulty;
    const len = [3, 4, 4, 5, 5, 6, 7][d] ?? 7;
    this.step = d >= 5 ? 470 : 600;
    this.seq = Array.from({ length: len }, () => Phaser.Math.Between(0, 3));

    const top = this.manual(
      'Observa la secuencia de luces y repítela AL REVÉS: de la última a la primera.\n' +
        'Pulsa REPETIR para verla otra vez.\nCada error resta tiempo.',
    );

    this.status = this.add(txt(this.scene, this.cx, top + 10, '', 8, PAL.cyan));
    const size = 118;
    const gap = 10;
    PADS.forEach((p, i) => {
      const x = this.cx + (i % 2 === 0 ? -1 : 1) * (size / 2 + gap / 2);
      const y = top + 40 + size / 2 + Math.floor(i / 2) * (size + gap);
      this.add(this.scene.add.rectangle(x, y + 4, size, size, C.ink));
      const pad = this.add(this.scene.add.rectangle(x, y, size, size, p.color).setStrokeStyle(3, C.ink).setAlpha(0.35));
      pad.setInteractive({ useHandCursor: true });
      pad.on('pointerdown', () => this.press(i));
      this.pads.push(pad);
    });

    this.add(new PixelButton(this.scene, this.cx, top + 40 + size * 2 + gap + 40, 180, 36, 'REPETIR', () => {
      if (!this.locked) this.playback();
    }, { color: C.purple }));

    this.scene.time.delayedCall(700, () => this.playback());
  }

  private flash(i: number, ms = 350): void {
    const pad = this.pads[i];
    Sfx.play(PADS[i].sound);
    pad.setAlpha(1);
    this.scene.tweens.add({ targets: pad, scale: 1.06, duration: ms / 2, yoyo: true });
    this.scene.time.delayedCall(ms, () => pad.active && pad.setAlpha(0.35));
  }

  private playback(): void {
    this.locked = true;
    this.input = [];
    this.status.setText('OBSERVA...').setColor(PAL.yellow);
    this.seq.forEach((p, i) => this.scene.time.delayedCall(i * this.step, () => this.flash(p, this.step - 250)));
    this.scene.time.delayedCall(this.seq.length * this.step + 200, () => {
      if (this.done) return;
      this.locked = false;
      this.updateStatus();
    });
  }

  private updateStatus(): void {
    this.status.setText(`TU TURNO (AL REVÉS)  ${this.input.length}/${this.seq.length}`).setColor(PAL.cyan);
  }

  private press(i: number): void {
    if (this.locked || this.done) return;
    this.flash(i, 220);
    const expected = this.seq[this.seq.length - 1 - this.input.length];
    if (i !== expected) {
      this.locked = true;
      this.host.strike(undefined, 'SECUENCIA INCORRECTA');
      this.scene.time.delayedCall(900, () => !this.done && this.playback());
      return;
    }
    this.input.push(i);
    this.updateStatus();
    if (this.input.length === this.seq.length) {
      this.locked = true;
      this.scene.time.delayedCall(300, () => this.win());
    }
  }
}
