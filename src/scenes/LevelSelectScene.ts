import Phaser from 'phaser';
import { C, GAME_W, PAL, txt } from '../theme';
import { LEVELS, LevelDef } from '../data/levels';
import { Save } from '../services/Save';
import { Sfx } from '../services/Sfx';
import { PixelButton } from '../ui/PixelButton';
import { goTo, menuBackground } from '../ui/fx';

// Color de cada tramo de dificultad (ver data/levels.ts).
const TIER_COLORS = [C.navy, C.teal, C.purple, C.red];
const TIER_EDGES = [C.sky, C.green, C.orange, C.yellow];
const TIER_NAMES = ['BÁSICO', 'AVANZADO', 'MEZCLA', 'CAOS'];

/** Selección de nivel (parte del Home). Los niveles se desbloquean en orden. */
export class LevelSelectScene extends Phaser.Scene {
  private info!: Phaser.GameObjects.Text;

  constructor() {
    super('LevelSelect');
  }

  create(): void {
    this.cameras.main.fadeIn(250, 26, 28, 44);
    menuBackground(this, Save.data.catMode ? 'cat' : 'bomb');
    const cx = GAME_W / 2;
    txt(this, cx, 36, 'ELIGE NIVEL', 16, PAL.yellow).setStroke(PAL.ink, 4);

    // Cuadrícula de 4 columnas x 5 filas.
    const cols = 4;
    const stepX = 82;
    const stepY = 86;
    LEVELS.forEach((lvl, i) => {
      const x = cx - (stepX * (cols - 1)) / 2 + (i % cols) * stepX;
      const y = 104 + Math.floor(i / cols) * stepY;
      this.card(lvl, x, y, i);
    });

    // Nombre del nivel tocado y leyenda de colores.
    this.add.rectangle(cx, 534, 330, 30, C.ink, 0.85).setStrokeStyle(2, C.gray);
    this.info = txt(this, cx, 535, 'TOCA UN NIVEL PARA JUGAR', 8, PAL.silver);
    const legendX = [40, 114, 204, 278];
    TIER_NAMES.forEach((name, t) => {
      const x = legendX[t];
      this.add.rectangle(x, 566, 10, 10, TIER_COLORS[t]).setStrokeStyle(2, TIER_EDGES[t]);
      txt(this, x + 10, 567, name, 8, PAL.silver).setOrigin(0, 0.5);
    });

    new PixelButton(this, cx, 610, 160, 32, 'VOLVER', () => goTo(this, 'Home'), { color: C.slate });
  }

  private card(lvl: LevelDef, x: number, y: number, i: number): void {
    const locked = lvl.id > Save.data.unlocked;
    const best = Save.data.best[lvl.id];
    const w = 72;
    const h = 74;

    const card = this.add.container(x, y);
    const bg = this.add
      .rectangle(0, 0, w, h, locked ? C.slate : TIER_COLORS[lvl.tier])
      .setStrokeStyle(2, locked ? C.gray : TIER_EDGES[lvl.tier]);
    card.add([this.add.rectangle(0, 4, w, h, C.ink), bg]);
    card.add(txt(this, 0, -12, `${lvl.id}`, 16, locked ? PAL.gray : PAL.white));
    if (locked) {
      card.add(this.add.image(0, 20, 'lock').setScale(1.5));
    } else {
      card.add(txt(this, 0, 20, best ? String(best) : 'NUEVO', 8, best ? PAL.yellow : PAL.lime));
    }

    card.setScale(0);
    this.tweens.add({ targets: card, scale: 1, delay: i * 25, duration: 220, ease: 'Back.easeOut' });

    bg.setInteractive({ useHandCursor: !locked });
    bg.on('pointerdown', () => {
      this.info.setText(locked ? `NIVEL ${lvl.id}: BLOQUEADO` : `NIVEL ${lvl.id}: ${lvl.name}`).setColor(locked ? PAL.gray : PAL.cyan);
    });
    bg.on('pointerup', () => {
      if (locked) {
        Sfx.play('wrong');
        this.tweens.add({ targets: card, x: x + 4, duration: 40, yoyo: true, repeat: 2 });
        return;
      }
      Sfx.play('click');
      Sfx.stopMusic();
      goTo(this, 'Game', { level: lvl.id, restarts: 0 });
    });
  }
}
