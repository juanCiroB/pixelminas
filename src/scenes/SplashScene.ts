import Phaser from 'phaser';
import { C, GAME_H, GAME_W, PAL, txt } from '../theme';
import { Sfx } from '../services/Sfx';
import { goTo } from '../ui/fx';

/** Sección 1: Splash. Logo animado y paso automático al Home. */
export class SplashScene extends Phaser.Scene {
  private leaving = false;

  constructor() {
    super('Splash');
  }

  create(): void {
    this.leaving = false;
    this.add.rectangle(0, 0, GAME_W, GAME_H, C.ink).setOrigin(0);
    const cx = GAME_W / 2;

    // La bomba cae y rebota.
    const glow = this.add.circle(cx, 250, 70, C.navy);
    const bomb = this.add.image(cx, -120, 'bomb_big');
    this.tweens.add({ targets: bomb, y: 250, duration: 900, ease: 'Bounce.easeOut' });
    this.tweens.add({ targets: glow, scale: 1.15, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Chispas de la mecha.
    const sparks = this.add.particles(cx + 33, 250 - 40, 'spark', {
      speed: { min: 20, max: 70 },
      lifespan: 400,
      scale: { start: 2, end: 0 },
      frequency: 60,
      emitting: false,
    });
    this.time.delayedCall(900, () => {
      sparks.start();
      sparks.setPosition(bomb.x + 33, bomb.y - 40);
    });

    // El título aparece letra por letra.
    const title = 'PIXELMINAS';
    const letterW = 26;
    const startX = cx - ((title.length - 1) * letterW) / 2;
    [...title].forEach((ch, i) => {
      const color = i < 5 ? PAL.cyan : PAL.orange;
      const l = txt(this, startX + i * letterW, 380, ch, 24, color).setStroke(PAL.ink, 6).setScale(0);
      this.tweens.add({
        targets: l,
        scale: 1,
        delay: 1000 + i * 70,
        duration: 250,
        ease: 'Back.easeOut',
        onStart: () => Sfx.play('blip'),
      });
    });

    const sub = txt(this, cx, 420, 'DESACTIVA O EXPLOTA', 8, PAL.yellow).setAlpha(0);
    this.tweens.add({ targets: sub, alpha: 1, delay: 1800, duration: 400 });

    const hint = txt(this, cx, 560, 'TOCA PARA CONTINUAR', 8, PAL.silver).setAlpha(0);
    this.tweens.add({ targets: hint, alpha: 1, delay: 2200, duration: 400, yoyo: true, repeat: -1, hold: 400 });

    // Barra de carga decorativa.
    this.add.rectangle(cx, 600, 200, 8, C.slate).setStrokeStyle(2, C.gray);
    const bar = this.add.rectangle(cx - 98, 600, 0, 4, C.lime).setOrigin(0, 0.5);
    this.tweens.add({ targets: bar, width: 196, duration: 3200, ease: 'Sine.easeInOut' });

    this.input.once('pointerdown', () => {
      Sfx.unlock();
      this.leave();
    });
    this.time.delayedCall(3800, () => this.leave());
  }

  private leave(): void {
    if (this.leaving) return;
    this.leaving = true;
    goTo(this, 'Home');
  }
}
