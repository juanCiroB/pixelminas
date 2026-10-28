import Phaser from 'phaser';
import { generateTextures } from '../ui/PixelArt';

/** Genera todos los recursos (texturas) antes de mostrar nada. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    generateTextures(this);
    this.scene.start('Splash');
  }
}
