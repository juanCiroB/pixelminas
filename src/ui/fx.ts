import Phaser from 'phaser';
import { C, GAME_H, GAME_W, PAL, txt } from '../theme';
import { Sfx } from '../services/Sfx';

/** Explosión: destello, partículas, sacudida de cámara y sonido. */
export function explode(scene: Phaser.Scene, x: number, y: number, big = false): void {
  Sfx.play('boom');
  scene.cameras.main.shake(big ? 600 : 300, big ? 0.03 : 0.015);
  scene.cameras.main.flash(big ? 300 : 150, 255, 205, 117);

  const ring = scene.add.circle(x, y, 8, C.yellow).setDepth(50);
  scene.tweens.add({ targets: ring, radius: big ? 160 : 60, alpha: 0, duration: 500, onComplete: () => ring.destroy() });

  const emitter = scene.add.particles(x, y, 'px', {
    speed: { min: 60, max: big ? 420 : 240 },
    lifespan: { min: 400, max: 900 },
    scale: { start: big ? 2.5 : 1.5, end: 0 },
    tint: [C.yellow, C.orange, C.red, C.white, C.gray],
    gravityY: 200,
    emitting: false,
  });
  emitter.setDepth(51);
  emitter.explode(big ? 90 : 40);
  scene.time.delayedCall(1200, () => emitter.destroy());
}

/** Confeti de celebración. */
export function confetti(scene: Phaser.Scene): void {
  const emitter = scene.add.particles(GAME_W / 2, -10, 'px', {
    x: { min: -GAME_W / 2, max: GAME_W / 2 },
    speedY: { min: 80, max: 220 },
    speedX: { min: -40, max: 40 },
    lifespan: 3000,
    scale: { min: 1, max: 2 },
    rotate: { min: 0, max: 360 },
    tint: [C.lime, C.cyan, C.yellow, C.orange, C.sky, C.red],
    quantity: 3,
    frequency: 30,
  });
  emitter.setDepth(90);
  scene.time.delayedCall(1500, () => emitter.stop());
  scene.time.delayedCall(5000, () => emitter.destroy());
}

/** Texto que sube y se desvanece (p. ej. "-15s"). */
export function floatText(scene: Phaser.Scene, x: number, y: number, s: string, color: string = PAL.red, size = 8): void {
  const t = txt(scene, x, y, s, size, color).setDepth(80).setStroke(PAL.ink, 4);
  scene.tweens.add({ targets: t, y: y - 40, alpha: 0, duration: 1100, ease: 'Cubic.easeOut', onComplete: () => t.destroy() });
}

/** Mensaje centrado temporal. */
export function toast(scene: Phaser.Scene, s: string, color: string = PAL.yellow, y = GAME_H / 2): void {
  const bg = scene.add.rectangle(GAME_W / 2, y, GAME_W - 30, 44, C.ink, 0.9).setStrokeStyle(2, C.gray).setDepth(95);
  const t = txt(scene, GAME_W / 2, y, s, 8, color, { wordWrap: { width: GAME_W - 50 } }).setDepth(96);
  bg.setScale(1, 0);
  scene.tweens.add({ targets: bg, scaleY: 1, duration: 120 });
  scene.tweens.add({
    targets: [bg, t],
    alpha: 0,
    delay: 1600,
    duration: 300,
    onComplete: () => { bg.destroy(); t.destroy(); },
  });
}

/** Transición: fundido a negro y cambio de escena. */
export function goTo(scene: Phaser.Scene, key: string, data?: object): void {
  scene.input.enabled = false;
  // El InputPlugin de la escena se reutiliza al volver a ella: hay que reactivarlo.
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => (scene.input.enabled = true));
  scene.cameras.main.fadeOut(220, 26, 28, 44);
  scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => scene.scene.start(key, data));
}

/** Fondo animado con bombitas flotando, compartido por los menús. */
export function menuBackground(scene: Phaser.Scene, bombKey = 'bomb'): void {
  scene.add.rectangle(0, 0, GAME_W, GAME_H, C.ink).setOrigin(0);
  for (let y = 0; y < GAME_H; y += 32) {
    for (let x = (y / 32) % 2 ? 16 : 0; x < GAME_W; x += 32) {
      scene.add.rectangle(x, y, 2, 2, C.slate);
    }
  }
  for (let i = 0; i < 9; i++) {
    const b = scene.add
      .image(Phaser.Math.Between(0, GAME_W), Phaser.Math.Between(0, GAME_H), bombKey === 'bomb' ? 'bomb_ghost' : bombKey)
      .setScale(Phaser.Math.Between(1, 3))
      .setAlpha(0.15)
      .setAngle(Phaser.Math.Between(-30, 30));
    scene.tweens.add({
      targets: b,
      y: b.y - Phaser.Math.Between(40, 120),
      angle: b.angle + Phaser.Math.Between(-40, 40),
      duration: Phaser.Math.Between(3000, 6000),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}
