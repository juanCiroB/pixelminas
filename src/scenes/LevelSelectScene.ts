import Phaser from 'phaser';
import { C, GAME_W, PAL, txt } from '../theme';
import { LEVELS } from '../data/levels';
import { Save } from '../services/Save';
import { Sfx } from '../services/Sfx';
import { PixelButton } from '../ui/PixelButton';
import { goTo, menuBackground } from '../ui/fx';

/** Selección de nivel (parte del Home). Los niveles se desbloquean en orden. */
export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('LevelSelect');
  }

  create(): void {
    this.cameras.main.fadeIn(250, 26, 28, 44);
    menuBackground(this, Save.data.catMode ? 'cat' : 'bomb');
    const cx = GAME_W / 2;
    txt(this, cx, 40, 'ELIGE NIVEL', 16, PAL.yellow).setStroke(PAL.ink, 4);

    LEVELS.forEach((lvl, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      // El nivel 7 va centrado en la última fila.
      const x = i === 6 ? cx : 95 + col * 170;
      const y = 120 + row * 110;
      const locked = lvl.id > Save.data.unlocked;
      const best = Save.data.best[lvl.id];

      const card = this.add.container(x, y);
      const bg = this.add.rectangle(0, 0, 150, 92, locked ? C.slate : C.navy).setStrokeStyle(2, locked ? C.gray : C.sky);
      card.add([this.add.rectangle(0, 4, 150, 92, C.ink), bg]);
      card.add(txt(this, 0, -26, `${lvl.id}`, 24, locked ? PAL.gray : PAL.white));
      card.add(txt(this, 0, 8, lvl.name, 8, locked ? PAL.gray : PAL.cyan));
      if (locked) {
        card.add(this.add.image(46, -28, 'lock').setScale(2));
      } else {
        card.add(txt(this, 0, 30, best ? `★ ${best}` : 'NUEVO', 8, best ? PAL.yellow : PAL.lime));
      }

      card.setScale(0);
      this.tweens.add({ targets: card, scale: 1, delay: i * 60, duration: 250, ease: 'Back.easeOut' });

      bg.setInteractive({ useHandCursor: !locked });
      bg.on('pointerup', () => {
        if (locked) {
          Sfx.play('wrong');
          this.tweens.add({ targets: card, x: x + 6, duration: 40, yoyo: true, repeat: 2 });
          return;
        }
        Sfx.play('click');
        Sfx.stopMusic();
        goTo(this, 'Game', { level: lvl.id, restarts: 0 });
      });
    });

    new PixelButton(this, cx, 600, 160, 32, 'VOLVER', () => goTo(this, 'Home'), { color: C.slate });
  }
}
