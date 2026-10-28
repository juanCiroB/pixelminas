import Phaser from 'phaser';
import { C, GAME_H, GAME_W, PAL, formatTime, txt } from '../theme';
import { DEFUSE_TIME, LEVELS, LevelDef, getLevel } from '../data/levels';
import { Save } from '../services/Save';
import { Sfx } from '../services/Sfx';
import { PixelButton, panel } from '../ui/PixelButton';
import { confetti, explode, floatText, goTo, toast } from '../ui/fx';

interface Cell {
  col: number;
  row: number;
  bomb: boolean;
  revealed: boolean;
  defused: boolean;
  n: number; // bombas vecinas
  tile: Phaser.GameObjects.Image;
  icon?: Phaser.GameObjects.Image;
  label?: Phaser.GameObjects.Text;
}

export interface DefuseResult {
  success: boolean;
  timeLeft: number;
}

const NUM_COLORS = [PAL.white, PAL.cyan, PAL.lime, PAL.orange, PAL.yellow, PAL.red, PAL.sky, PAL.white, PAL.silver];
const BOARD_TOP = 84;
const BOARD_H = 452;
const LONG_PRESS_MS = 350;

/** Sección 3: Juego. Buscaminas con tiempo; las banderas sobre bombas abren la desactivación. */
export class GameScene extends Phaser.Scene {
  private lvl!: LevelDef;
  private restarts = 0;
  private cells: Cell[] = [];
  private cs = 32; // tamaño de celda en px
  private ox = 0;
  private oy = 0;
  private generated = false;
  private busy = false;
  private flagMode = false;
  private timeLeft = 0;
  private wrongFlags = 0;
  private defusedCount = 0;
  private defuseBonus = 0;
  private activeBomb?: Cell;
  private timerText!: Phaser.GameObjects.Text;
  private counterText!: Phaser.GameObjects.Text;
  private digBtn!: PixelButton;
  private flagBtn!: PixelButton;
  private timerTaps: number[] = [];
  private secretUsed = false;

  constructor() {
    super('Game');
  }

  init(data: { level?: number; restarts?: number }): void {
    this.lvl = getLevel(data.level ?? 1);
    this.restarts = data.restarts ?? 0;
    this.cells = [];
    this.generated = false;
    this.busy = false;
    this.flagMode = false;
    this.timeLeft = this.lvl.time;
    this.wrongFlags = 0;
    this.defusedCount = 0;
    this.defuseBonus = 0;
    this.activeBomb = undefined;
    this.timerTaps = [];
    this.secretUsed = false;
  }

  create(): void {
    this.cameras.main.fadeIn(250, 26, 28, 44);
    this.input.enabled = true;
    this.input.mouse?.disableContextMenu();
    this.add.rectangle(0, 0, GAME_W, GAME_H, C.ink).setOrigin(0);

    this.buildHud();
    this.buildBoard();
    this.buildControls();

    // El cronómetro del nivel es un evento de Phaser: al pausar la escena
    // (mientras se desactiva una bomba) también se pausa el tiempo.
    this.time.addEvent({ delay: 1000, loop: true, callback: () => this.tick() });

    this.events.on('defuse-result', (r: DefuseResult) => this.onDefuseResult(r));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.events.off('defuse-result'));

    const intro = txt(this, GAME_W / 2, GAME_H / 2 - 20, `NIVEL ${this.lvl.id}\n${this.lvl.name}`, 16, PAL.yellow).setStroke(PAL.ink, 6).setDepth(90);
    // Aclara los dos relojes: el del buscaminas y los 3:00 de cada mini juego.
    const times = txt(this, GAME_W / 2, GAME_H / 2 + 34, `BUSCAMINAS: ${formatTime(this.lvl.time)}\nCADA BOMBA: ${formatTime(DEFUSE_TIME)}`, 8, PAL.white)
      .setStroke(PAL.ink, 4).setDepth(90);
    this.tweens.add({ targets: [intro, times], scale: { from: 0, to: 1 }, duration: 300, ease: 'Back.easeOut' });
    this.tweens.add({ targets: [intro, times], alpha: 0, delay: 1800, duration: 300, onComplete: () => { intro.destroy(); times.destroy(); } });
  }

  // ---------- Interfaz ----------

  private buildHud(): void {
    this.add.rectangle(0, 0, GAME_W, 72, C.navy).setOrigin(0);
    this.add.rectangle(0, 72, GAME_W, 4, C.ink).setOrigin(0);

    txt(this, 12, 20, `NIVEL ${this.lvl.id}/${LEVELS.length}`, 8, PAL.cyan).setOrigin(0, 0.5);
    txt(this, 12, 38, this.lvl.name, 8, PAL.white).setOrigin(0, 0.5);
    if (this.restarts > 0) txt(this, 12, 56, `REINTENTOS: ${this.restarts}`, 8, PAL.orange).setOrigin(0, 0.5);

    // Cronómetro. Easter egg #3: tocarlo 5 veces rápido da tiempo extra una vez.
    this.add.rectangle(GAME_W / 2 + 10, 36, 96, 40, C.ink).setStrokeStyle(2, C.gray);
    this.timerText = txt(this, GAME_W / 2 + 10, 37, formatTime(this.timeLeft), 16, PAL.lime);
    this.timerText.setInteractive();
    this.timerText.on('pointerdown', () => this.tapTimer());

    this.add.image(GAME_W - 70, 36, Save.data.catMode ? 'cat' : 'bomb').setScale(2);
    this.counterText = txt(this, GAME_W - 30, 37, `0/${this.lvl.bombs}`, 8, PAL.white);
  }

  private buildBoard(): void {
    const { cols, rows } = this.lvl;
    this.cs = Math.floor(Math.min((GAME_W - 16) / cols, BOARD_H / rows));
    this.ox = Math.floor((GAME_W - cols * this.cs) / 2);
    this.oy = BOARD_TOP + Math.floor((BOARD_H - rows * this.cs) / 2);

    this.add.rectangle(this.ox - 4, this.oy - 4, cols * this.cs + 8, rows * this.cs + 8, C.slate).setOrigin(0).setStrokeStyle(2, C.gray);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const tile = this.add
          .image(this.ox + col * this.cs + this.cs / 2, this.oy + row * this.cs + this.cs / 2, 'tile_hidden')
          .setDisplaySize(this.cs, this.cs);
        // Aparición en onda diagonal.
        tile.setAlpha(0);
        this.tweens.add({ targets: tile, alpha: 1, delay: (col + row) * 18, duration: 150 });
        this.cells.push({ col, row, bomb: false, revealed: false, defused: false, n: 0, tile });
      }
    }

    // Una zona invisible sobre el tablero recibe los toques. Distinguimos
    // toque corto (excavar) de pulsación larga (bandera).
    const zone = this.add.zone(this.ox, this.oy, cols * this.cs, rows * this.cs).setOrigin(0).setInteractive();
    let pressTimer: Phaser.Time.TimerEvent | undefined;
    let pressedCell: Cell | undefined;
    let longFired = false;

    zone.on('pointerdown', (p: Phaser.Input.Pointer) => {
      pressedCell = this.cellAt(p.x, p.y);
      longFired = false;
      if (!pressedCell) return;
      if (p.rightButtonDown()) {
        longFired = true;
        this.placeFlag(pressedCell);
        return;
      }
      if (!pressedCell.revealed) pressedCell.tile.setTexture('tile_hover');
      pressTimer = this.time.delayedCall(LONG_PRESS_MS, () => {
        longFired = true;
        if (pressedCell) {
          if (!pressedCell.revealed) pressedCell.tile.setTexture('tile_hidden');
          navigator.vibrate?.(30);
          this.placeFlag(pressedCell);
        }
      });
    });
    const release = (p: Phaser.Input.Pointer, cancel: boolean) => {
      pressTimer?.remove();
      pressTimer = undefined;
      const cell = pressedCell;
      pressedCell = undefined;
      if (!cell || longFired) return;
      if (!cell.revealed) cell.tile.setTexture('tile_hidden');
      if (cancel || this.cellAt(p.x, p.y) !== cell) return;
      if (this.flagMode) this.placeFlag(cell);
      else this.dig(cell);
    };
    zone.on('pointerup', (p: Phaser.Input.Pointer) => release(p, false));
    zone.on('pointerout', (p: Phaser.Input.Pointer) => release(p, true));
  }

  private buildControls(): void {
    const y = GAME_H - 46;
    this.digBtn = new PixelButton(this, 92, y, 124, 44, '', () => this.setMode(false), { color: C.green, sound: false });
    this.flagBtn = new PixelButton(this, 222, y, 124, 44, '', () => this.setMode(true), { color: C.slate, sound: false });
    this.digBtn.add(this.add.image(-38, 0, 'shovel').setScale(2));
    this.digBtn.label.setText('PALA').setX(14);
    this.flagBtn.add(this.add.image(-38, 0, 'flag').setScale(2));
    this.flagBtn.label.setText('BANDERA').setX(14);

    new PixelButton(this, GAME_W - 34, y, 48, 44, 'II', () => this.showPause(), { color: C.purple });
    txt(this, GAME_W / 2, GAME_H - 12, 'MANTÉN PRESIONADO PARA BANDERA', 8, PAL.gray);
  }

  private setMode(flag: boolean): void {
    this.flagMode = flag;
    Sfx.play('toggle');
    this.digBtn.setColor(flag ? C.slate : C.green);
    this.flagBtn.setColor(flag ? C.red : C.slate);
  }

  private showPause(): void {
    if (this.busy) return;
    this.busy = true;
    this.time.paused = true;
    const layer = this.add.container(0, 0).setDepth(100);
    layer.add(this.add.rectangle(0, 0, GAME_W, GAME_H, C.ink, 0.85).setOrigin(0).setInteractive());
    layer.add(panel(this, GAME_W / 2, GAME_H / 2, 260, 230));
    layer.add(txt(this, GAME_W / 2, GAME_H / 2 - 75, 'PAUSA', 16, PAL.yellow));
    layer.add(new PixelButton(this, GAME_W / 2, GAME_H / 2 - 20, 190, 34, 'CONTINUAR', () => {
      layer.destroy();
      this.time.paused = false;
      this.busy = false;
    }, { color: C.green }));
    layer.add(new PixelButton(this, GAME_W / 2, GAME_H / 2 + 24, 190, 34, 'REINICIAR', () => {
      this.scene.restart({ level: this.lvl.id, restarts: this.restarts + 1 });
    }, { color: C.orange }));
    layer.add(new PixelButton(this, GAME_W / 2, GAME_H / 2 + 68, 190, 34, 'MENÚ', () => goTo(this, 'Home'), { color: C.red }));
  }

  // ---------- Lógica del buscaminas ----------

  private cellAt(x: number, y: number): Cell | undefined {
    const col = Math.floor((x - this.ox) / this.cs);
    const row = Math.floor((y - this.oy) / this.cs);
    if (col < 0 || row < 0 || col >= this.lvl.cols || row >= this.lvl.rows) return undefined;
    return this.cells[row * this.lvl.cols + col];
  }

  private neighbors(c: Cell): Cell[] {
    const out: Cell[] = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nc = c.col + dx;
        const nr = c.row + dy;
        if (nc >= 0 && nr >= 0 && nc < this.lvl.cols && nr < this.lvl.rows) out.push(this.cells[nr * this.lvl.cols + nc]);
      }
    }
    return out;
  }

  /** Las bombas se colocan tras el primer toque, así nunca se pierde en la primera jugada. */
  private generate(first: Cell): void {
    const safe = new Set([first, ...this.neighbors(first)]);
    const candidates = Phaser.Utils.Array.Shuffle(this.cells.filter((c) => !safe.has(c)));
    candidates.slice(0, this.lvl.bombs).forEach((c) => (c.bomb = true));
    for (const c of this.cells) c.n = this.neighbors(c).filter((n) => n.bomb).length;
    this.generated = true;
  }

  private dig(cell: Cell): void {
    if (this.busy || cell.revealed) return;
    if (!this.generated) this.generate(cell);
    if (cell.bomb) {
      this.revealBombAndRestart(cell, '¡PISASTE UNA BOMBA!');
      return;
    }
    // Relleno por inundación (BFS) desde las casillas sin bombas vecinas.
    const queue: Cell[] = [cell];
    const opened: Cell[] = [];
    cell.revealed = true;
    while (queue.length) {
      const c = queue.shift()!;
      opened.push(c);
      if (c.n === 0) {
        for (const n of this.neighbors(c)) {
          if (!n.revealed && !n.bomb) {
            n.revealed = true;
            queue.push(n);
          }
        }
      }
    }
    opened.forEach((c) => {
      const dist = Math.abs(c.col - cell.col) + Math.abs(c.row - cell.row);
      this.time.delayedCall(dist * 25, () => this.drawRevealed(c));
    });
    Sfx.play('reveal');
  }

  private drawRevealed(c: Cell): void {
    c.tile.setTexture('tile_open').setDisplaySize(this.cs, this.cs);
    this.tweens.add({ targets: c.tile, scaleX: c.tile.scaleX * 0.8, scaleY: c.tile.scaleY * 0.8, duration: 60, yoyo: true });
    if (c.n > 0) {
      c.label = txt(this, c.tile.x, c.tile.y + 1, String(c.n), this.cs >= 28 ? 16 : 8, NUM_COLORS[c.n]);
    }
  }

  private placeFlag(cell: Cell): void {
    if (this.busy || cell.revealed) return;
    if (!this.generated) {
      toast(this, 'PRIMERO EXCAVA UNA CASILLA', PAL.yellow, GAME_H - 110);
      Sfx.play('wrong');
      return;
    }
    const flag = this.add.image(cell.tile.x, cell.tile.y - 20, 'flag').setDisplaySize(this.cs * 0.8, this.cs * 0.8);
    this.tweens.add({ targets: flag, y: cell.tile.y, duration: 160, ease: 'Bounce.easeOut' });
    Sfx.play('flag');

    if (cell.bomb) {
      // ¡Bandera sobre bomba! Se activa el modo desactivación.
      this.busy = true;
      cell.icon = flag;
      this.activeBomb = cell;
      this.tweens.add({ targets: flag, angle: { from: -15, to: 15 }, duration: 80, yoyo: true, repeat: 4 });
      Sfx.play('alarm');
      this.cameras.main.shake(400, 0.006);
      const alert = this.add.rectangle(0, 0, GAME_W, GAME_H, C.red, 0.3).setOrigin(0).setDepth(60);
      this.tweens.add({ targets: alert, alpha: 0, duration: 150, yoyo: true, repeat: 2 });
      this.time.delayedCall(800, () => {
        alert.destroy();
        this.scene.launch('Defuse', { level: this.lvl.id, bombIndex: this.defusedCount });
        this.scene.pause();
      });
      return;
    }

    // Bandera en casilla vacía: se resta tiempo y la bandera se retira.
    this.wrongFlags++;
    this.timeLeft -= this.lvl.wrongFlagPenalty;
    Sfx.play('wrong');
    const cross = this.add.image(cell.tile.x, cell.tile.y, 'cross').setDisplaySize(this.cs * 0.8, this.cs * 0.8).setAlpha(0);
    this.tweens.add({ targets: cross, alpha: 1, delay: 150, duration: 100 });
    this.tweens.add({
      targets: [flag, cross],
      alpha: 0,
      delay: 700,
      duration: 250,
      onComplete: () => { flag.destroy(); cross.destroy(); },
    });
    floatText(this, cell.tile.x, cell.tile.y - 10, `-${this.lvl.wrongFlagPenalty}s`);
    this.flashTimer();
    this.updateTimer();
    if (this.timeLeft <= 0) this.timeUp();
  }

  // ---------- Resultado de la desactivación ----------

  private onDefuseResult(r: DefuseResult): void {
    const cell = this.activeBomb;
    this.activeBomb = undefined;
    if (!cell) return;
    if (!r.success) {
      cell.icon?.destroy();
      this.revealBombAndRestart(cell, '¡LA BOMBA EXPLOTÓ!');
      return;
    }
    cell.defused = true;
    cell.revealed = true;
    cell.icon?.destroy();
    cell.tile.setTexture('tile_safe').setDisplaySize(this.cs, this.cs);
    cell.icon = this.add.image(cell.tile.x, cell.tile.y, Save.data.catMode ? 'cat' : 'bomb_safe').setDisplaySize(this.cs * 0.85, this.cs * 0.85);
    this.tweens.add({ targets: cell.icon, scale: { from: cell.icon.scale * 1.8, to: cell.icon.scale }, duration: 300, ease: 'Back.easeOut' });
    const sparks = this.add.particles(cell.tile.x, cell.tile.y, 'px', {
      speed: { min: 40, max: 120 }, lifespan: 500, scale: { start: 1.2, end: 0 }, tint: [C.lime, C.green, C.white], emitting: false,
    });
    sparks.explode(20);
    this.time.delayedCall(800, () => sparks.destroy());

    this.defusedCount++;
    this.defuseBonus += Math.max(0, Math.floor(r.timeLeft));
    this.counterText.setText(`${this.defusedCount}/${this.lvl.bombs}`);
    this.tweens.add({ targets: this.counterText, scale: 1.6, duration: 120, yoyo: true });
    Sfx.play('defused');
    floatText(this, cell.tile.x, cell.tile.y - 10, '¡DESACTIVADA!', PAL.lime);

    if (this.defusedCount >= this.lvl.bombs) this.levelComplete();
    else this.busy = false;
  }

  // ---------- Tiempo ----------

  private tick(): void {
    if (this.busy) return;
    this.timeLeft--;
    this.updateTimer();
    if (this.timeLeft <= 10 && this.timeLeft > 0) Sfx.play('tickFast');
    if (this.timeLeft <= 0) this.timeUp();
  }

  private updateTimer(): void {
    this.timerText.setText(formatTime(this.timeLeft));
    this.timerText.setColor(this.timeLeft <= 30 ? PAL.red : this.timeLeft <= 60 ? PAL.yellow : PAL.lime);
  }

  private flashTimer(): void {
    this.tweens.add({ targets: this.timerText, scale: 1.4, duration: 90, yoyo: true, repeat: 1 });
  }

  private tapTimer(): void {
    const now = this.time.now;
    this.timerTaps = [...this.timerTaps.filter((t) => now - t < 1500), now];
    if (this.timerTaps.length >= 5 && !this.secretUsed && !this.busy) {
      this.secretUsed = true;
      this.timeLeft += 15;
      this.updateTimer();
      Save.findEgg('timer');
      Sfx.play('egg');
      floatText(this, this.timerText.x, this.timerText.y + 20, '+15s', PAL.lime);
      toast(this, '¡HUEVO DE PASCUA!\nTIEMPO EXTRA SECRETO', PAL.lime, 130);
    }
  }

  private timeUp(): void {
    if (this.busy) return;
    this.busy = true;
    this.timeLeft = 0;
    this.updateTimer();
    // Se acabó el tiempo: todas las bombas pendientes explotan en cadena.
    const pending = this.cells.filter((c) => c.bomb && !c.defused);
    pending.forEach((c, i) => {
      this.time.delayedCall(i * 250, () => {
        c.tile.setTexture('tile_boom').setDisplaySize(this.cs, this.cs);
        this.add.image(c.tile.x, c.tile.y, Save.data.catMode ? 'cat' : 'bomb').setDisplaySize(this.cs * 0.85, this.cs * 0.85);
        explode(this, c.tile.x, c.tile.y, i === pending.length - 1);
      });
    });
    this.time.delayedCall(pending.length * 250 + 300, () => this.restartLevel('¡SE ACABÓ EL TIEMPO!'));
  }

  private revealBombAndRestart(cell: Cell, msg: string): void {
    this.busy = true;
    cell.tile.setTexture('tile_boom').setDisplaySize(this.cs, this.cs);
    this.add.image(cell.tile.x, cell.tile.y, Save.data.catMode ? 'cat' : 'bomb').setDisplaySize(this.cs * 0.85, this.cs * 0.85);
    explode(this, cell.tile.x, cell.tile.y, true);
    // Muestra el resto de bombas sin desactivar.
    this.cells.filter((c) => c.bomb && !c.defused && c !== cell).forEach((c, i) => {
      this.time.delayedCall(300 + i * 120, () => {
        this.add.image(c.tile.x, c.tile.y, Save.data.catMode ? 'cat' : 'bomb').setDisplaySize(this.cs * 0.85, this.cs * 0.85);
      });
    });
    this.time.delayedCall(700, () => this.restartLevel(msg));
  }

  private restartLevel(msg: string): void {
    const shade = this.add.rectangle(0, 0, GAME_W, GAME_H, C.ink, 0).setOrigin(0).setDepth(85);
    this.tweens.add({ targets: shade, fillAlpha: 0.75, duration: 300 });
    const t1 = txt(this, GAME_W / 2, GAME_H / 2 - 20, '¡BOOM!', 24, PAL.red).setStroke(PAL.ink, 6).setDepth(90).setScale(0);
    const t2 = txt(this, GAME_W / 2, GAME_H / 2 + 20, msg, 8, PAL.yellow).setDepth(90);
    const t3 = txt(this, GAME_W / 2, GAME_H / 2 + 44, 'REINICIANDO NIVEL...', 8, PAL.silver).setDepth(90);
    this.tweens.add({ targets: t1, scale: 1, duration: 300, ease: 'Back.easeOut' });
    this.tweens.add({ targets: t3, alpha: 0.2, duration: 300, yoyo: true, repeat: -1 });
    void t2;
    this.time.delayedCall(2200, () => this.scene.restart({ level: this.lvl.id, restarts: this.restarts + 1 }));
  }

  // ---------- Victoria ----------

  private levelComplete(): void {
    this.busy = true;
    const base = 500 * this.lvl.id;
    const timeBonus = Math.max(0, this.timeLeft) * 10;
    const defuseBonus = this.defuseBonus * 2;
    const penalty = this.restarts * 250 + this.wrongFlags * 50;
    const score = Math.max(100, base + timeBonus + defuseBonus - penalty);
    const record = Save.recordLevel(this.lvl.id, score);
    this.registry.set('lastScore', { level: this.lvl.id, score });

    // Revela todo el tablero como recompensa visual.
    this.cells.filter((c) => !c.revealed && !c.bomb).forEach((c) => {
      c.revealed = true;
      this.time.delayedCall(Phaser.Math.Between(0, 400), () => this.drawRevealed(c));
    });

    Sfx.play('win');
    confetti(this);

    const isLast = this.lvl.id >= LEVELS.length;
    const layer = this.add.container(0, 0).setDepth(100);
    layer.add(this.add.rectangle(0, 0, GAME_W, GAME_H, C.ink, 0.8).setOrigin(0).setInteractive());
    layer.add(panel(this, GAME_W / 2, GAME_H / 2, 300, 340));
    layer.add(txt(this, GAME_W / 2, GAME_H / 2 - 140, isLast ? '¡JUEGO\nCOMPLETADO!' : '¡NIVEL\nSUPERADO!', 16, PAL.lime));
    const rows: [string, string][] = [
      ['BASE', `${base}`],
      ['TIEMPO RESTANTE', `+${timeBonus}`],
      ['RAPIDEZ DESACTIV.', `+${defuseBonus}`],
      ['PENALIZACIONES', `-${penalty}`],
    ];
    rows.forEach(([k, v], i) => {
      const y = GAME_H / 2 - 80 + i * 22;
      layer.add(txt(this, 40, y, k, 8, PAL.silver).setOrigin(0, 0.5));
      layer.add(txt(this, 320, y, v, 8, PAL.white).setOrigin(1, 0.5));
    });
    const scoreText = txt(this, GAME_W / 2, GAME_H / 2 + 22, '0', 24, PAL.yellow);
    layer.add(scoreText);
    // Contador animado del puntaje.
    this.tweens.addCounter({
      from: 0, to: score, duration: 900, ease: 'Cubic.easeOut',
      onUpdate: (tw) => scoreText.setText(String(Math.floor(tw.getValue() ?? 0))),
    });
    if (record) {
      const rec = txt(this, GAME_W / 2, GAME_H / 2 + 52, '¡NUEVO RÉCORD!', 8, PAL.orange);
      this.tweens.add({ targets: rec, alpha: 0.2, duration: 300, yoyo: true, repeat: -1 });
      layer.add(rec);
    }

    if (isLast) {
      layer.add(new PixelButton(this, GAME_W / 2, GAME_H / 2 + 110, 200, 34, 'VER PUNTAJES', () => {
        this.registry.set('gameCompleted', true);
        goTo(this, 'Score');
      }, { color: C.green }));
    } else {
      layer.add(new PixelButton(this, GAME_W / 2, GAME_H / 2 + 92, 200, 34, 'SIGUIENTE NIVEL', () => {
        goTo(this, 'Game', { level: this.lvl.id + 1, restarts: 0 });
      }, { color: C.green }));
      layer.add(new PixelButton(this, GAME_W / 2, GAME_H / 2 + 136, 200, 30, 'MENÚ', () => goTo(this, 'Home'), { color: C.slate }));
    }
    layer.setY(40).setAlpha(0);
    this.tweens.add({ targets: layer, y: 0, alpha: 1, delay: 500, duration: 300, ease: 'Back.easeOut' });
  }
}
