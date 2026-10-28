import Phaser from 'phaser';
import { C, PAL, txt } from '../theme';

/** Lo que la escena de desactivación ofrece a cada mini juego. */
export interface MGHost {
  scene: Phaser.Scene;
  area: Phaser.Geom.Rectangle; // zona de pantalla disponible
  difficulty: number; // 0..4: índice de la bomba dentro del nivel
  success(): void;
  strike(seconds?: number, why?: string): void;
}

/**
 * Clase base de los mini juegos de desactivación. Cada nivel usa una subclase
 * distinta; la dificultad interna crece con cada bomba del nivel.
 */
export abstract class Minigame {
  protected scene: Phaser.Scene;
  protected root: Phaser.GameObjects.Container;
  protected done = false;

  constructor(protected host: MGHost) {
    this.scene = host.scene;
    this.root = this.scene.add.container(0, 0);
  }

  abstract build(): void;

  protected get area(): Phaser.Geom.Rectangle {
    return this.host.area;
  }

  protected get cx(): number {
    return this.host.area.centerX;
  }

  protected add<T extends Phaser.GameObjects.GameObject>(obj: T): T {
    this.root.add(obj);
    return obj;
  }

  protected win(): void {
    if (this.done) return;
    this.done = true;
    this.host.success();
  }

  /** Dibuja el "manual" con las reglas en la parte superior. Devuelve la Y donde termina. */
  protected manual(text: string): number {
    const { x, y, width } = this.area;
    const body = txt(this.scene, x + 14, y + 26, text, 8, PAL.ink, {
      align: 'left',
      wordWrap: { width: width - 28 },
      lineSpacing: 5,
    }).setOrigin(0, 0);
    const h = body.height + 36;
    this.add(this.scene.add.rectangle(x, y + 3, width, h, C.ink).setOrigin(0));
    this.add(this.scene.add.rectangle(x, y, width, h, C.yellow).setOrigin(0).setStrokeStyle(2, C.orange));
    this.add(this.scene.add.rectangle(x + 8, y - 6, 74, 16, C.orange).setOrigin(0).setStrokeStyle(2, C.ink));
    this.add(txt(this.scene, x + 45, y + 2, 'MANUAL', 8, PAL.ink));
    this.add(body);
    return y + h + 12;
  }

  destroy(): void {
    this.root.destroy();
  }
}
