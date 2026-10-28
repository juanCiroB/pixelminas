import Phaser from 'phaser';
import { C, GAME_H, GAME_W, PAL, txt } from '../theme';
import { CREDITS } from '../data/credits';
import { Save } from '../services/Save';
import { Sfx } from '../services/Sfx';
import { PixelButton } from '../ui/PixelButton';
import { confetti, goTo, menuBackground, toast } from '../ui/fx';

/** Sección 5: Créditos con desplazamiento automático. */
export class CreditsScene extends Phaser.Scene {
  constructor() {
    super('Credits');
  }

  create(): void {
    this.cameras.main.fadeIn(250, 26, 28, 44);
    menuBackground(this, Save.data.catMode ? 'cat' : 'bomb');
    const cx = GAME_W / 2;

    const roll = this.add.container(0, GAME_H);
    let y = 0;
    roll.add(txt(this, cx, y, 'PIXELMINAS', 24, PAL.cyan).setStroke(PAL.ink, 6));
    y += 70;
    for (const block of CREDITS) {
      roll.add(txt(this, cx, y, block.title, 8, PAL.yellow));
      y += 24;
      for (const line of block.lines) {
        roll.add(txt(this, cx, y, line, 8, PAL.white));
        y += 18;
      }
      y += 30;
    }
    roll.add(txt(this, cx, y + 20, '¡GRACIAS POR JUGAR!', 8, PAL.lime));
    const height = y + 40;

    // Créditos en bucle: suben hasta salir de pantalla y vuelven a empezar.
    this.tweens.add({ targets: roll, y: -height, duration: height * 28, repeat: -1 });

    // Franjas para que el texto no tape el encabezado ni los botones.
    this.add.rectangle(0, 0, GAME_W, 70, C.ink).setOrigin(0);
    this.add.rectangle(0, GAME_H - 80, GAME_W, 80, C.ink).setOrigin(0);
    txt(this, cx, 36, 'CRÉDITOS', 16, PAL.yellow);

    new PixelButton(this, cx, GAME_H - 40, 160, 32, 'VOLVER', () => goTo(this, 'Home'), { color: C.slate });

    // Easter egg #2 (versión táctil): el nido 🪺 escondido, 3 toques = modo gato.
    let taps = 0;
    const nest = this.add.image(GAME_W - 22, GAME_H - 40, 'nest').setAlpha(0.5).setInteractive();
    nest.on('pointerdown', () => {
      taps++;
      Sfx.play('blip');
      this.tweens.add({ targets: nest, angle: 15, duration: 60, yoyo: true });
      if (taps === 3) {
        taps = 0;
        Save.set('catMode', !Save.data.catMode);
        Save.findEgg('cat');
        Sfx.play('egg');
        confetti(this);
        toast(this, Save.data.catMode ? 'MODO GATO ACTIVADO\nLAS BOMBAS AHORA MAÚLLAN' : 'MODO GATO DESACTIVADO', PAL.orange);
      }
    });
  }
}
