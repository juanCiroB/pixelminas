// Configuración de anuncios (AdMob).
// Mientras USE_TEST_ADS sea true se muestran los anuncios de prueba oficiales de Google:
// se pueden tocar sin riesgo de que suspendan la cuenta. Antes de publicar:
//  1. Crear la app en https://admob.google.com y un bloque de anuncios tipo "Banner".
//  2. Poner aquí el ID del bloque (BANNER_ID) y USE_TEST_ADS = false.
//  3. Poner el ID de la APP en android/app/src/main/res/values/strings.xml (admob_app_id).

export const USE_TEST_ADS = true;

/** ID del bloque de anuncios banner (ca-app-pub-XXXX/YYYY). */
export const BANNER_ID = 'ca-app-pub-3940256099942544/6300978111'; // banner de prueba de Google

/** Escenas donde se muestra el banner. En la partida y la desactivación nunca aparece. */
export const SCENES_WITH_ADS = ['Home', 'LevelSelect', 'Score', 'Credits'];
