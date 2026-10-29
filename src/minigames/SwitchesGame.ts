import Phaser from 'phaser';
import { C, PAL, txt } from '../theme';
import { Sfx } from '../services/Sfx';
import { PixelButton } from '../ui/PixelButton';
import { Minigame } from './Minigame';

/** Interruptores: formar un número en binario. */
export class SwitchesGame extends Minigame {
  private states: boolean[] = [];
  private values: number[] = [];

  build(): void {
    // Dificultad 0..6: desde 2 puede salir la pantalla roja (invertida) y desde 5 hay 6 interruptores.
    const d = this.host.difficulty;
    const bits = d >= 5 ? 6 : 5;
    this.values = Array.from({ length: bits }, (_, i) => 2 ** (bits - 1 - i));
    const max = 2 ** bits - 1;
    const target = Phaser.Math.Between(1, max - 1);
    const inverted = d >= 4 ? Math.random() < 0.7 : d >= 2 && Math.random() < 0.5;
    const required = inverted ? max - target : target;

    const top = this.manual(
      `Cada interruptor vale (izq. a der.):\n${this.values.join(' · ')}\n` +
        'ARRIBA = suma su valor.\n' +
        'Haz que la suma sea el número de la pantalla y pulsa CONFIRMAR.\n' +
        (d >= 2 ? `Si la pantalla está en ROJO, la suma debe ser ${max} MENOS el número.` : ''),
    );

    // Pantalla LCD.
    this.add(this.scene.add.rectangle(this.cx, top + 34, 160, 56, C.ink).setStrokeStyle(4, C.gray));
    const lcd = this.add(txt(this.scene, this.cx, top + 36, String(target).padStart(2, '0'), 24, inverted ? PAL.red : PAL.lime));
    this.scene.tweens.add({ targets: lcd, alpha: 0.7, duration: 400, yoyo: true, repeat: -1 });

    do {
      this.states = this.values.map(() => Math.random() < 0.5);
    } while (this.sum() === required);

    const y0 = top + 110;
    const spacing = bits === 6 ? 54 : 62;
    const startX = this.cx - (spacing * (bits - 1)) / 2;
    this.values.forEach((_, i) => {
      const x = startX + i * spacing;
      const led = this.add(this.scene.add.circle(x, y0, 7, C.slate).setStrokeStyle(2, C.ink));
      this.add(this.scene.add.rectangle(x, y0 + 70, 40, 92, C.slate).setStrokeStyle(2, C.ink));
      this.add(this.scene.add.rectangle(x, y0 + 70, 10, 70, C.ink));
      const knob = this.add(this.scene.add.rectangle(x, 0, 30, 30, C.silver).setStrokeStyle(2, C.ink));
      const place = (animate: boolean) => {
        const ky = y0 + (this.states[i] ? 46 : 94);
        if (animate) this.scene.tweens.add({ targets: knob, y: ky, duration: 90 });
        else knob.y = ky;
        led.setFillStyle(this.states[i] ? C.lime : C.slate);
      };
      place(false);
      const hit = this.add(this.scene.add.rectangle(x, y0 + 70, 52, 110, 0, 0).setInteractive({ useHandCursor: true }));
      hit.on('pointerdown', () => {
        if (this.done) return;
        this.states[i] = !this.states[i];
        Sfx.play('toggle');
        place(true);
      });
    });

    this.add(txt(this.scene, this.cx, y0 + 140, 'ARRIBA = ENCENDIDO', 8, PAL.silver));

    this.add(new PixelButton(this.scene, this.cx, y0 + 190, 200, 40, 'CONFIRMAR', () => {
      if (this.done) return;
      if (this.sum() === required) this.win();
      else this.host.strike(undefined, 'SUMA INCORRECTA');
    }, { color: C.red }));
  }

  private sum(): number {
    return this.states.reduce((acc, on, i) => acc + (on ? this.values[i] : 0), 0);
  }
}
