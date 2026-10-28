import Phaser from 'phaser';
import { C, PAL, txt } from '../theme';
import { Sfx } from '../services/Sfx';

interface ButtonOpts {
  color?: number;
  textColor?: string;
  size?: number;
  sound?: boolean;
}

/** Botón pixel art con sombra, que se "hunde" al pulsarlo. */
export class PixelButton extends Phaser.GameObjects.Container {
  private face: Phaser.GameObjects.Rectangle;
  private shine: Phaser.GameObjects.Rectangle;
  readonly label: Phaser.GameObjects.Text;
  private pressed = false;
  private enabled = true;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    w: number,
    h: number,
    text: string,
    private onClick: () => void,
    opts: ButtonOpts = {},
  ) {
    super(scene, x, y);
    const color = opts.color ?? C.blue;
    const shadow = scene.add.rectangle(0, 3, w, h, C.ink);
    this.face = scene.add.rectangle(0, 0, w, h, color).setStrokeStyle(2, C.ink);
    this.shine = scene.add.rectangle(0, -h / 2 + 3, w - 6, 2, 0xffffff, 0.35);
    this.label = txt(scene, 0, 0, text, opts.size ?? 8, opts.textColor ?? PAL.white);
    this.add([shadow, this.face, this.shine, this.label]);
    this.setSize(w, h);

    this.face.setInteractive({ useHandCursor: true });
    this.face.on('pointerdown', () => {
      if (!this.enabled) return;
      this.pressed = true;
      this.press(true);
    });
    this.face.on('pointerout', () => {
      if (this.pressed) this.press(false);
      this.pressed = false;
    });
    this.face.on('pointerup', () => {
      if (!this.pressed || !this.enabled) return;
      this.pressed = false;
      this.press(false);
      if (opts.sound !== false) Sfx.play('click');
      this.onClick();
    });
    scene.add.existing(this);
  }

  private press(down: boolean): void {
    const dy = down ? 3 : 0;
    this.face.y = dy;
    this.shine.y = -this.height / 2 + 3 + dy;
    this.label.y = dy;
  }

  setColor(color: number): this {
    this.face.setFillStyle(color);
    return this;
  }

  setText(s: string): this {
    this.label.setText(s);
    return this;
  }

  setEnabled(on: boolean): this {
    this.enabled = on;
    this.setAlpha(on ? 1 : 0.45);
    return this;
  }
}

/** Panel con borde doble, usado como "ventana" en menús y en el modo desactivación. */
export function panel(scene: Phaser.Scene, x: number, y: number, w: number, h: number, fill = C.slate): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  c.add([
    scene.add.rectangle(0, 4, w, h, C.ink),
    scene.add.rectangle(0, 0, w, h, fill).setStrokeStyle(2, C.ink),
    scene.add.rectangle(0, 0, w - 8, h - 8).setStrokeStyle(2, C.gray),
  ]);
  return c;
}
