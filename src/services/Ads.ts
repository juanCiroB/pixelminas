import Phaser from 'phaser';
import { Capacitor } from '@capacitor/core';
import { AdMob, BannerAdPluginEvents, BannerAdPosition, BannerAdSize } from '@capacitor-community/admob';
import { BANNER_ID, SCENES_WITH_ADS, USE_TEST_ADS } from '../data/ads';

/**
 * Banner pequeño en la parte inferior, solo en los menús.
 * Cuando el banner está visible, el contenedor del juego se acorta lo mismo que
 * mide el anuncio, así el banner nunca tapa botones ni texto del juego.
 */
class AdsService {
  private game?: Phaser.Game;
  private ready = false;
  private created = false;
  private visible = false;
  private height = 0;
  private placeholder?: HTMLDivElement;

  async init(game: Phaser.Game): Promise<void> {
    this.game = game;
    // Cada vez que arranca una escena se decide si el banner se muestra u oculta.
    game.events.once(Phaser.Core.Events.READY, () => {
      for (const scene of game.scene.getScenes(false)) {
        scene.events.on(Phaser.Scenes.Events.CREATE, () => this.onScene(scene.scene.key));
      }
    });

    if (!Capacitor.isNativePlatform()) {
      // En el navegador no hay AdMob: en desarrollo se dibuja un recuadro de ejemplo
      // para ver cómo queda el diseño con el espacio reservado.
      this.ready = import.meta.env.DEV;
      return;
    }
    try {
      await AdMob.initialize({ initializeForTesting: USE_TEST_ADS });
      // Formulario de consentimiento de Google (obligatorio en Europa y otras regiones).
      const consent = await AdMob.requestConsentInfo();
      if (consent.isConsentFormAvailable && !consent.canRequestAds) await AdMob.showConsentForm();
      await AdMob.addListener(BannerAdPluginEvents.SizeChanged, (size) => this.reserve(size.height));
      await AdMob.addListener(BannerAdPluginEvents.FailedToLoad, () => this.reserve(0));
      this.ready = true;
      const current = game.scene.getScenes(true)[0];
      if (current) this.onScene(current.scene.key);
    } catch {
      // Sin anuncios (sin conexión, error del SDK...): el juego sigue igual.
      this.ready = false;
    }
  }

  private onScene(key: string): void {
    if (!this.ready) return;
    if (SCENES_WITH_ADS.includes(key)) void this.show();
    else void this.hide();
  }

  private async show(): Promise<void> {
    if (this.visible) return;
    this.visible = true;
    if (!Capacitor.isNativePlatform()) {
      this.showPlaceholder();
      return;
    }
    if (!this.created) {
      this.created = true;
      await AdMob.showBanner({
        adId: BANNER_ID,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting: USE_TEST_ADS,
      });
    } else {
      await AdMob.resumeBanner();
      this.reserve(this.height);
    }
  }

  private async hide(): Promise<void> {
    if (!this.visible) return;
    this.visible = false;
    this.applyLayout(0);
    if (!Capacitor.isNativePlatform()) {
      this.placeholder?.remove();
      this.placeholder = undefined;
      return;
    }
    await AdMob.hideBanner();
  }

  private reserve(height: number): void {
    this.height = height;
    if (this.visible) this.applyLayout(height);
  }

  /** Acorta el contenedor del juego para dejar el hueco del banner. */
  private applyLayout(height: number): void {
    const el = document.getElementById('game');
    if (!el) return;
    el.style.height = height > 0 ? `calc(100% - ${height}px)` : '100%';
    this.game?.scale.refresh();
  }

  private showPlaceholder(): void {
    const h = 50;
    const div = document.createElement('div');
    div.textContent = 'ANUNCIO (solo en desarrollo)';
    Object.assign(div.style, {
      position: 'fixed', left: '0', right: '0', bottom: '0', height: `${h}px`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      font: '10px monospace', color: '#94b0c2', background: '#333c57', borderTop: '1px dashed #566c86',
    });
    document.body.appendChild(div);
    this.placeholder = div;
    this.reserve(h);
  }
}

export const Ads = new AdsService();
