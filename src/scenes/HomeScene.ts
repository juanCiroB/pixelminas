import Phaser from 'phaser';
import { C, GAME_H, GAME_W, PAL, txt } from '../theme';
import { LEVELS } from '../data/levels';
import { Save } from '../services/Save';
import { Sfx } from '../services/Sfx';
import { PixelButton, panel } from '../ui/PixelButton';
import { confetti, goTo, menuBackground, toast } from '../ui/fx';

const KONAMI = ['UP', 'UP', 'DOWN', 'DOWN', 'LEFT', 'RIGHT', 'LEFT', 'RIGHT', 'B', 'A'];

/** Sección 2: Home. Menú principal, ajustes de sonido y easter eggs. */
export class HomeScene extends Phaser.Scene {
  private logoTaps = 0;
  private konamiIdx = 0;

  constructor() {
    super('Home');
  }

  create(): void {
    this.cameras.main.fadeIn(250, 26, 28, 44);
    this.logoTaps = 0;
    this.konamiIdx = 0;
    const cx = GAME_W / 2;
    const bombKey = Save.data.catMode ? 'cat' : 'bomb';
    menuBackground(this, bombKey);
    Sfx.startMusic();

    // Logo: bomba que "respira". Easter egg #1: tocarla 7 veces desbloquea todo.
    const glow = this.add.circle(cx, 120, 62, C.navy).setStrokeStyle(4, C.blue);
    this.tweens.add({ targets: glow, scale: 1.08, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const logo = this.add.image(cx, 120, Save.data.catMode ? 'cat_big' : 'bomb_big').setScale(0.9);
    this.tweens.add({ targets: logo, scale: 1, angle: 4, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    logo.setInteractive();
    logo.on('pointerdown', () => this.tapLogo(logo));

    txt(this, cx, 225, 'PIXELMINAS', 24, PAL.cyan).setStroke(PAL.ink, 6);
    txt(this, cx, 258, 'BUSCAMINAS  +  DESACTIVACIÓN', 8, PAL.yellow);

    const bw = 220;
    new PixelButton(this, cx, 310, bw, 40, 'JUGAR', () => goTo(this, 'LevelSelect'), { color: C.green, size: 16 });
    new PixelButton(this, cx, 362, bw, 34, 'CÓMO JUGAR', () => this.showHelp(), { color: C.blue });
    new PixelButton(this, cx, 408, bw, 34, 'PUNTAJES', () => goTo(this, 'Score'), { color: C.purple });
    new PixelButton(this, cx, 454, bw, 34, 'CRÉDITOS', () => goTo(this, 'Credits'), { color: C.teal });

    const soundBtn = new PixelButton(this, cx - 56, 510, 104, 30, '', () => {
      Save.set('sound', !Save.data.sound);
      refresh();
    }, { color: C.slate });
    const musicBtn = new PixelButton(this, cx + 56, 510, 104, 30, '', () => {
      Save.set('music', !Save.data.music);
      if (Save.data.music) Sfx.startMusic();
      else Sfx.stopMusic();
      refresh();
    }, { color: C.slate });
    const refresh = () => {
      soundBtn.setText(`SFX ${Save.data.sound ? 'SÍ' : 'NO'}`).setColor(Save.data.sound ? C.slate : C.red);
      musicBtn.setText(`MÚSICA ${Save.data.music ? 'SÍ' : 'NO'}`).setColor(Save.data.music ? C.slate : C.red);
    };
    refresh();

    const best = Save.totalBest();
    txt(this, cx, 560, `NIVEL MÁX: ${Save.data.unlocked}/${LEVELS.length}   RÉCORD: ${best}`, 8, PAL.silver);
    txt(this, cx, 620, 'v1.0', 8, PAL.gray);

    // Easter egg #2: código Konami con teclado (en PC) activa el "modo gato".
    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => this.konami(e));
  }

  private tapLogo(logo: Phaser.GameObjects.Image): void {
    this.logoTaps++;
    Sfx.play('blip');
    this.tweens.add({ targets: logo, y: 110, duration: 60, yoyo: true });
    if (this.logoTaps === 7) {
      Save.set('unlocked', LEVELS.length);
      Save.findEgg('logo');
      Sfx.play('egg');
      confetti(this);
      toast(this, '¡HUEVO DE PASCUA!\nTODOS LOS NIVELES DESBLOQUEADOS', PAL.lime);
    }
  }

  private konami(e: KeyboardEvent): void {
    const map: Record<string, string> = { ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT', b: 'B', B: 'B', a: 'A', A: 'A' };
    const k = map[e.key];
    if (k === KONAMI[this.konamiIdx]) {
      this.konamiIdx++;
      if (this.konamiIdx === KONAMI.length) {
        this.konamiIdx = 0;
        Save.set('catMode', !Save.data.catMode);
        Save.findEgg('cat');
        Sfx.play('egg');
        this.scene.restart();
      }
    } else {
      this.konamiIdx = k === 'UP' ? 1 : 0;
    }
  }

  private showHelp(): void {
    const layer = this.add.container(0, 0).setDepth(100);
    const shade = this.add.rectangle(0, 0, GAME_W, GAME_H, C.ink, 0.85).setOrigin(0).setInteractive();
    const p = panel(this, GAME_W / 2, GAME_H / 2, 330, 520);
    const lines = [
      'TOCA una casilla para excavar.',
      'MANTÉN presionado (o usa el modo BANDERA) para marcar.',
      '',
      'Cada nivel esconde 5 bombas. Al poner una bandera sobre una bomba entras al modo DESACTIVACIÓN: tienes 3:00 para resolver el mini juego.',
      '',
      'Bandera en casilla vacía = pierdes tiempo del nivel.',
      '',
      'Si explota una bomba o se acaba el tiempo, el nivel se reinicia.',
      '',
      'Desactiva las 5 bombas para pasar de nivel. Hay 20 niveles: primero conoces los 7 mini juegos, luego vuelven más difíciles y al final se mezclan.',
    ];
    const t = txt(this, GAME_W / 2, GAME_H / 2 - 30, lines.join('\n'), 8, PAL.white, {
      wordWrap: { width: 290 },
      align: 'left',
    });
    const title = txt(this, GAME_W / 2, GAME_H / 2 - 236, 'CÓMO JUGAR', 16, PAL.yellow);
    const close = new PixelButton(this, GAME_W / 2, GAME_H / 2 + 220, 160, 32, 'ENTENDIDO', () => layer.destroy(), { color: C.green });
    layer.add([shade, p, title, t, close]);
    layer.setAlpha(0);
    this.tweens.add({ targets: layer, alpha: 1, duration: 150 });
  }
}
