import Phaser from 'phaser';
import { C, GAME_W, PAL, txt } from '../theme';
import { LEVELS } from '../data/levels';
import { Save, TOTAL_EGGS } from '../services/Save';
import { PixelButton, panel } from '../ui/PixelButton';
import { confetti, goTo, menuBackground, toast } from '../ui/fx';

/** Sección 4: Puntaje. Muestra récords por nivel, historial y huevos de pascua. */
export class ScoreScene extends Phaser.Scene {
  private resetArmed = false;

  constructor() {
    super('Score');
  }

  create(): void {
    this.cameras.main.fadeIn(250, 26, 28, 44);
    this.resetArmed = false;
    menuBackground(this, Save.data.catMode ? 'cat' : 'bomb');
    const cx = GAME_W / 2;

    // Si venimos de completar el juego, el registry trae el resultado.
    const finished = this.registry.get('gameCompleted') as boolean | undefined;
    if (finished) {
      this.registry.set('gameCompleted', false);
      confetti(this);
      toast(this, '¡DESACTIVASTE LOS 7 NIVELES!', PAL.lime, 90);
    }

    txt(this, cx, 36, 'PUNTAJES', 16, PAL.yellow).setStroke(PAL.ink, 4);

    this.add.existing(panel(this, cx, 200, 320, 250));
    txt(this, cx, 94, 'MEJOR POR NIVEL', 8, PAL.cyan);
    LEVELS.forEach((lvl, i) => {
      const y = 120 + i * 24;
      const best = Save.data.best[lvl.id];
      const locked = lvl.id > Save.data.unlocked;
      const color = locked ? PAL.gray : PAL.white;
      txt(this, 40, y, `${lvl.id}. ${lvl.name}`, 8, color).setOrigin(0, 0.5);
      txt(this, 320, y, best ? String(best) : '---', 8, best ? PAL.yellow : PAL.gray).setOrigin(1, 0.5);
    });
    const total = txt(this, cx, 300, `TOTAL: ${Save.totalBest()}`, 16, PAL.lime);
    this.tweens.add({ targets: total, scale: 1.08, duration: 500, yoyo: true, repeat: -1 });

    this.add.existing(panel(this, cx, 425, 320, 160));
    txt(this, cx, 362, 'ÚLTIMAS PARTIDAS', 8, PAL.cyan);
    const recent = Save.data.history.slice(0, 5);
    if (recent.length === 0) txt(this, cx, 420, 'AÚN NO HAY PARTIDAS', 8, PAL.gray);
    recent.forEach((r, i) => {
      const d = new Date(r.date);
      const date = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      const y = 388 + i * 20;
      txt(this, 40, y, `${date}  NIVEL ${r.level}`, 8, PAL.white).setOrigin(0, 0.5);
      txt(this, 320, y, String(r.score), 8, PAL.yellow).setOrigin(1, 0.5);
    });

    txt(this, cx, 528, `HUEVOS DE PASCUA: ${Save.data.eggs.length}/${TOTAL_EGGS}`, 8, Save.data.eggs.length ? PAL.orange : PAL.gray);

    new PixelButton(this, cx - 80, 590, 140, 32, 'VOLVER', () => goTo(this, 'Home'), { color: C.slate });
    const reset = new PixelButton(this, cx + 80, 590, 140, 32, 'BORRAR', () => {
      // Doble confirmación para no borrar el progreso por accidente.
      if (!this.resetArmed) {
        this.resetArmed = true;
        reset.setText('¿SEGURO?');
        return;
      }
      Save.reset();
      this.scene.restart();
    }, { color: C.red });
  }
}
