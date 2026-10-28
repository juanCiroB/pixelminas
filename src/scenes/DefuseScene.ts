import Phaser from 'phaser';
import { C, GAME_H, GAME_W, PAL, formatTime, txt } from '../theme';
import { DEFUSE_TIME, MinigameKey, STRIKE_PENALTY, getLevel } from '../data/levels';
import { Save } from '../services/Save';
import { Sfx } from '../services/Sfx';
import { floatText } from '../ui/fx';
import { MGHost, Minigame } from '../minigames/Minigame';
import { WiresGame } from '../minigames/WiresGame';
import { SwitchesGame } from '../minigames/SwitchesGame';
import { EchoGame } from '../minigames/EchoGame';
import { CodeGame } from '../minigames/CodeGame';
import { MazeGame } from '../minigames/MazeGame';
import { PipesGame } from '../minigames/PipesGame';
import { CoreGame } from '../minigames/CoreGame';
import type { DefuseResult } from './GameScene';

const MINIGAMES: Record<MinigameKey, new (host: MGHost) => Minigame> = {
  wires: WiresGame,
  switches: SwitchesGame,
  echo: EchoGame,
  code: CodeGame,
  maze: MazeGame,
  pipes: PipesGame,
  core: CoreGame,
};

/**
 * Modo "desactiva la bomba": se lanza encima del GameScene (que queda en pausa)
 * con una cuenta regresiva de 3 minutos y el mini juego del nivel.
 */
export class DefuseScene extends Phaser.Scene {
  private timeLeft = DEFUSE_TIME;
  private lastSecond = DEFUSE_TIME;
  private finished = false;
  private game_!: Minigame;
  private timerText!: Phaser.GameObjects.Text;
  private redFlash!: Phaser.GameObjects.Rectangle;

  constructor() {
    super('Defuse');
  }

  create(data: { level: number; bombIndex: number }): void {
    const lvl = getLevel(data.level);
    this.timeLeft = DEFUSE_TIME;
    this.lastSecond = DEFUSE_TIME;
    this.finished = false;

    const bg = this.add.rectangle(0, 0, GAME_W, GAME_H, C.ink, 0.97).setOrigin(0).setInteractive();
    bg.setAlpha(0);
    this.tweens.add({ targets: bg, alpha: 1, duration: 200 });

    // Encabezado con el temporizador tipo display LED.
    this.add.rectangle(0, 0, GAME_W, 86, C.purple).setOrigin(0);
    this.add.rectangle(0, 86, GAME_W, 4, C.ink).setOrigin(0);
    const title = txt(this, GAME_W / 2, 16, '¡DESACTIVA LA BOMBA!', 8, PAL.yellow);
    this.tweens.add({ targets: title, alpha: 0.3, duration: 400, yoyo: true, repeat: -1 });
    this.add.image(36, 50, Save.data.catMode ? 'cat' : 'bomb').setScale(2.5);
    this.add.rectangle(GAME_W / 2, 52, 130, 44, C.ink).setStrokeStyle(3, C.red);
    this.timerText = txt(this, GAME_W / 2, 54, formatTime(this.timeLeft), 24, PAL.red);
    txt(this, GAME_W - 44, 44, `BOMBA`, 8, PAL.silver);
    txt(this, GAME_W - 44, 60, `${data.bombIndex + 1}/${lvl.bombs}`, 8, PAL.white);

    this.redFlash = this.add.rectangle(0, 0, GAME_W, GAME_H, C.red, 0).setOrigin(0).setDepth(70);

    const host: MGHost = {
      scene: this,
      area: new Phaser.Geom.Rectangle(10, 104, GAME_W - 20, GAME_H - 114),
      difficulty: data.bombIndex,
      success: () => this.onSuccess(),
      strike: (s, why) => this.strike(s ?? STRIKE_PENALTY, why),
    };
    this.game_ = new MINIGAMES[lvl.minigame](host);
    this.game_.build();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.game_.destroy());
  }

  update(_t: number, dt: number): void {
    if (this.finished) return;
    this.timeLeft -= dt / 1000;
    const sec = Math.ceil(this.timeLeft);
    if (sec !== this.lastSecond) {
      this.lastSecond = sec;
      this.timerText.setText(formatTime(this.timeLeft));
      // El tic-tac se acelera en los últimos 30 segundos.
      if (sec <= 30) {
        Sfx.play('tickFast');
        this.tweens.add({ targets: this.timerText, scale: 1.15, duration: 80, yoyo: true });
      } else {
        Sfx.play('tick');
      }
    }
    if (this.timeLeft <= 0) this.finish(false);
  }

  private strike(seconds: number, why?: string): void {
    if (this.finished) return;
    this.timeLeft -= seconds;
    Sfx.play('error');
    this.cameras.main.shake(200, 0.01);
    this.redFlash.setFillStyle(C.red, 0.4);
    this.tweens.add({ targets: this.redFlash, fillAlpha: 0, duration: 400 });
    floatText(this, GAME_W / 2, 92, `-${seconds}s ${why ?? ''}`.trim(), PAL.red);
    this.timerText.setText(formatTime(this.timeLeft));
    if (this.timeLeft <= 0) this.finish(false);
  }

  private onSuccess(): void {
    if (this.finished) return;
    this.finished = true;
    Sfx.play('defused');
    this.cameras.main.flash(250, 167, 240, 112);
    const t = txt(this, GAME_W / 2, GAME_H / 2, '¡BOMBA\nDESACTIVADA!', 16, PAL.lime).setStroke(PAL.ink, 8).setDepth(80).setScale(0);
    this.tweens.add({ targets: t, scale: 1, duration: 300, ease: 'Back.easeOut' });
    this.time.delayedCall(1100, () => this.finish(true));
  }

  private finish(success: boolean): void {
    this.finished = true;
    const result: DefuseResult = { success, timeLeft: Math.max(0, this.timeLeft) };
    const game = this.scene.get('Game');
    this.scene.resume('Game');
    game.events.emit('defuse-result', result);
    this.scene.stop();
  }
}
