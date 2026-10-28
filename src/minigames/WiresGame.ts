import Phaser from 'phaser';
import { C, PAL, txt } from '../theme';
import { Sfx } from '../services/Sfx';
import { Minigame } from './Minigame';

type WireColor = 'ROJO' | 'AZUL' | 'AMARILLO' | 'BLANCO' | 'VERDE';
const COLORS: Record<WireColor, number> = { ROJO: C.red, AZUL: C.blue, AMARILLO: C.yellow, BLANCO: C.white, VERDE: C.green };

/** Nivel 1: cortar el cable correcto siguiendo reglas en orden. */
export class WiresGame extends Minigame {
  private wires: WireColor[] = [];
  private answer = 0;

  build(): void {
    const n = this.host.difficulty < 2 ? 4 : 5;
    const pool = Object.keys(COLORS) as WireColor[];
    this.wires = Array.from({ length: n }, () => Phaser.Utils.Array.GetRandom(pool));
    const letters = 'ABCDEFGHJKLMNPRSTUVXZ';
    const serial = `${letters[Phaser.Math.Between(0, letters.length - 1)]}${letters[Phaser.Math.Between(0, letters.length - 1)]}-${Phaser.Math.Between(100, 999)}`;
    const lastDigit = Number(serial[serial.length - 1]);
    this.answer = this.solve(lastDigit);

    const top = this.manual(
      'Aplica la PRIMERA regla que se cumpla:\n' +
        '1. Más de un cable ROJO: corta el último rojo.\n' +
        '2. Serial termina en IMPAR: corta el primer cable.\n' +
        '3. No hay cables AZULES: corta el segundo.\n' +
        '4. Hay UN solo AMARILLO: corta el amarillo.\n' +
        '5. Si no: corta el último cable.',
    );

    // Caja de la bomba con placa del número de serie.
    const boxH = 70 + n * 52;
    const { x, width } = this.area;
    this.add(this.scene.add.rectangle(x + 10, top, width - 20, boxH, C.slate).setOrigin(0).setStrokeStyle(2, C.gray));
    this.add(this.scene.add.rectangle(this.cx, top + 24, 170, 26, C.white).setStrokeStyle(2, C.ink));
    this.add(txt(this.scene, this.cx, top + 25, `SERIAL ${serial}`, 8, PAL.ink));

    const left = x + 40;
    const right = x + width - 40;
    this.wires.forEach((color, i) => {
      const y = top + 70 + i * 52;
      this.add(this.scene.add.rectangle(left - 12, y, 16, 22, C.gray).setStrokeStyle(2, C.ink));
      this.add(this.scene.add.rectangle(right + 12, y, 16, 22, C.gray).setStrokeStyle(2, C.ink));
      const g = this.add(this.scene.add.graphics());
      this.drawWire(g, left, right, y, COLORS[color], false);
      this.add(txt(this.scene, left - 12, y - 22, String(i + 1), 8, PAL.silver));

      const hit = this.add(this.scene.add.rectangle((left + right) / 2, y, right - left, 40, 0, 0).setInteractive({ useHandCursor: true }));
      hit.once('pointerdown', () => this.cut(i, g, left, right, y, COLORS[color]));
    });
  }

  private solve(lastDigit: number): number {
    const w = this.wires;
    const reds = w.filter((c) => c === 'ROJO').length;
    if (reds > 1) return w.lastIndexOf('ROJO');
    if (lastDigit % 2 === 1) return 0;
    if (!w.includes('AZUL')) return 1;
    if (w.filter((c) => c === 'AMARILLO').length === 1) return w.indexOf('AMARILLO');
    return w.length - 1;
  }

  /** Cable en zigzag; si está cortado se dibuja con un hueco en el centro. */
  private drawWire(g: Phaser.GameObjects.Graphics, left: number, right: number, y: number, color: number, cut: boolean): void {
    g.clear();
    const mid = (left + right) / 2;
    const seg = 18;
    for (let px = left; px < right; px += seg) {
      if (cut && px > mid - 20 && px < mid + 10) continue;
      const dy = Math.floor(px / seg) % 2 === 0 ? -3 : 3;
      g.fillStyle(C.ink).fillRect(px, y + dy - 6, seg + 2, 12);
      g.fillStyle(color).fillRect(px, y + dy - 4, seg + 2, 8);
    }
  }

  private cut(i: number, g: Phaser.GameObjects.Graphics, left: number, right: number, y: number, color: number): void {
    if (this.done) return;
    Sfx.play('cut');
    this.drawWire(g, left, right, y, color, true);
    const sparks = this.scene.add.particles((left + right) / 2, y, 'px', {
      speed: { min: 40, max: 140 }, lifespan: 300, scale: { start: 1, end: 0 }, tint: [C.yellow, C.white], emitting: false,
    });
    this.add(sparks);
    sparks.explode(14);
    if (i === this.answer) this.scene.time.delayedCall(300, () => this.win());
    else this.host.strike(undefined, 'CABLE EQUIVOCADO');
  }
}
