import '@fontsource/press-start-2p';
import Phaser from 'phaser';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { GAME_H, GAME_W, PAL } from './theme';
import { Sfx } from './services/Sfx';
import { Ads } from './services/Ads';
import { BootScene } from './scenes/BootScene';
import { SplashScene } from './scenes/SplashScene';
import { HomeScene } from './scenes/HomeScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { GameScene } from './scenes/GameScene';
import { DefuseScene } from './scenes/DefuseScene';
import { ScoreScene } from './scenes/ScoreScene';
import { CreditsScene } from './scenes/CreditsScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_W,
  height: GAME_H,
  backgroundColor: PAL.ink,
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: { activePointers: 2 },
  scene: [BootScene, SplashScene, HomeScene, LevelSelectScene, GameScene, DefuseScene, ScoreScene, CreditsScene],
};

async function start(): Promise<void> {
  // Esperamos la fuente pixel para que los textos no se dibujen con otra tipografía.
  try {
    await document.fonts.load(`16px "Press Start 2P"`);
  } catch {
    /* si falla, se usa la fuente monoespaciada de respaldo */
  }
  const game = new Phaser.Game(config);
  // Banner pequeño abajo, solo en los menús (ver src/data/ads.ts).
  void Ads.init(game);
  // Solo en desarrollo: acceso desde la consola del navegador para depurar.
  if (import.meta.env.DEV) (window as unknown as { game: Phaser.Game }).game = game;

  // El audio solo puede empezar tras un toque del usuario.
  window.addEventListener('pointerdown', () => Sfx.unlock(), { once: true });

  // Pausar la música cuando la app pasa a segundo plano.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) Sfx.stopMusic();
    else if (game.scene.isActive('Home')) Sfx.startMusic();
  });

  // Botón "atrás" de Android: vuelve al Home o sale de la app desde el Home.
  if (Capacitor.isNativePlatform()) {
    void App.addListener('backButton', () => {
      if (game.scene.isActive('Defuse')) return;
      if (game.scene.isActive('Home')) {
        void App.exitApp();
        return;
      }
      const active = game.scene.getScenes(true)[0];
      if (active && active.scene.key !== 'Splash') {
        game.scene.getScenes(true).forEach((s) => s.scene.stop());
        game.scene.start('Home');
      }
    });
  }
}

void start();
