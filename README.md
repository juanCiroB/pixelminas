# PIXELMINAS — Desactiva o explota

Buscaminas en pixel art con **modo desactivación de bombas**. Cada nivel esconde 5 bombas. Cuando el jugador pone una bandera sobre una bomba, entra en un mini juego con una cuenta regresiva de **3:00**. Si lo resuelve, la bomba queda desactivada; si no, explota y el nivel se reinicia.

App **híbrida**: Phaser 3 (motor de videojuegos web) + TypeScript + Vite, empaquetada para Android con **Capacitor 8**.

---

## Cómo se juega

| Acción | Resultado |
|---|---|
| Tocar una casilla (modo PALA) | Excava. El primer toque nunca es una bomba. |
| Mantener presionado, clic derecho o modo BANDERA | Pone una bandera. |
| Bandera sobre bomba | Se pausa el reloj del nivel y empieza la **desactivación (3:00)**. |
| Bandera en casilla vacía | Se **resta tiempo** al reloj del nivel y la bandera se retira. |
| Excavar una bomba / fallar la desactivación / acabarse el tiempo del nivel | 💥 Explota y **se reinicia el nivel**. |
| Desactivar las 5 bombas | Nivel superado: se calcula el puntaje y se desbloquea el siguiente. |

Dentro de la desactivación, cada error resta 20 s del cronómetro de 3 min (en el laberinto, 10 s).

## Niveles

La dificultad sube por tres vías: el tablero crece, la bandera falsa castiga más y el mini juego es más complejo. Además, dentro de cada nivel, cada bomba es un poco más difícil que la anterior.

Hay **dos relojes independientes**:

- **Reloj del buscaminas** (columna "Tiempo buscaminas"): cuenta solo mientras se excava y se ponen banderas. Las banderas falsas le restan tiempo.
- **Reloj de cada mini juego: 3:00 por bomba.** Cada una de las 5 bombas del nivel tiene sus propios 3 minutos completos. Mientras corre, el reloj del buscaminas queda **pausado**.

| # | Mini juego | Tablero | Tiempo buscaminas | Bandera falsa | Desactivación (3:00 c/u) |
|---|---|---|---|---|---|
| 1 | **CABLES** | 8×10 | 2:30 | −10 s | Cortar el cable correcto aplicando 5 reglas en orden (serial, colores). |
| 2 | **INTERRUPTORES** | 8×11 | 2:30 | −12 s | Formar el número en binario con 5 palancas (16-8-4-2-1). En rojo se invierte: 31 − n. |
| 3 | **ECO INVERSO** | 9×11 | 2:40 | −15 s | Memorizar una secuencia de luces (4–6) y repetirla al revés. |
| 4 | **CÓDIGO** | 9×12 | 2:40 | −18 s | Deducir un código de 3–4 dígitos con pistas verde/amarillo/gris. |
| 5 | **LABERINTO** | 9×13 | 2:50 | −20 s | Recorrer un laberinto con niebla (6×6 → 7×7) hasta el corte rojo. |
| 6 | **TUBERÍAS** | 10×13 | 2:50 | −25 s | Girar tuberías (4×4 → 5×5) para conectar el refrigerante con el núcleo. |
| 7 | **NÚCLEO** | 10×14 | 3:00 | −30 s | “Luces fuera”: cada toque invierte la celda y sus vecinas; hay que apagar todas. |

**Puntaje por nivel** = 500 × nivel + 10 × segundos restantes + 2 × segundos sobrantes en cada desactivación − 250 × reintentos − 50 × banderas falsas (mínimo 100).

## Cumplimiento de la rúbrica

| Requisito | Dónde |
|---|---|
| Enfoque híbrido | Phaser (web) + Capacitor → APK/AAB Android |
| Wireframe en escala de grises | [Figma](https://www.figma.com/design/13NCFqUkchjfIDZxMwRnN4) y `docs/wireframes/` |
| Mínimo 3 niveles | 7 niveles (`src/data/levels.ts`) |
| Control de tiempo | Reloj por nivel + 3:00 por bomba |
| 5 secciones | **Splash** (`SplashScene`), **Home** (`HomeScene` + `LevelSelectScene`), **Juego** (`GameScene` + `DefuseScene`), **Puntaje** (`ScoreScene`), **Créditos** (`CreditsScene`) |
| UI personalizada | Pixel art dibujado en código (`src/ui/PixelArt.ts`), paleta Sweetie 16, fuente Press Start 2P, botones propios (`PixelButton`) |
| Persistencia entre vistas | `localStorage` (`src/services/Save.ts`): niveles desbloqueados, récords, historial, ajustes de sonido, huevos encontrados. Estado temporal entre escenas con el `registry` de Phaser. |
| Animaciones | Tweens (rebotes, aparición del tablero en onda, contador de puntaje), partículas (explosiones, chispas, confeti), sacudida de cámara, fundidos entre escenas |
| Sonidos | Efectos 8-bit y música en bucle sintetizados con Web Audio API (`src/services/Sfx.ts`) |
| Bonus: Easter eggs 🪺 | 3 huevos (ver abajo) |
| Publicación Google Play | Proyecto Android en `android/` (targetSdk 36). Pasos más abajo. |

### Easter eggs (¡spoilers!)

1. **Logo**: toca la bomba del Home 7 veces → desbloquea todos los niveles (útil para la demo).
2. **Modo gato**: toca 3 veces el nido 🪺 escondido en la esquina de Créditos, o escribe el código Konami (↑↑↓↓←→←→BA) en el Home con teclado → las bombas se convierten en gatos.
3. **Tiempo secreto**: toca 5 veces rápido el cronómetro del nivel → +15 s (una vez por intento).

El progreso de los huevos se ve en Puntajes.

## Diseño

Wireframes en escala de grises: **[Pixelminas — Wireframes (Figma)](https://www.figma.com/design/13NCFqUkchjfIDZxMwRnN4)**. Son 19 pantallas a 360×640, la misma resolución lógica del juego, repartidas en cinco secciones. Cada pantalla lleva debajo una nota con su comportamiento. Las imágenes exportadas están en `docs/wireframes/`.

| Sección | Pantallas |
|---|---|
| [Mapa de navegación](docs/wireframes/0-mapa-de-navegacion.png) | Cómo se conectan las pantallas |
| [Splash y menú](docs/wireframes/1-splash-y-menu.png) | Splash, Home, Cómo jugar, Selección de nivel |
| [Partida](docs/wireframes/2-partida.png) | Intro de nivel, Juego, Pausa, Nivel superado, Explosión |
| [Desactivación](docs/wireframes/3-desactivacion.png) | Pantalla base y los 7 mini juegos |
| [Puntajes y créditos](docs/wireframes/4-puntajes-y-creditos.png) | Las dos pantallas finales |

![Wireframes de la partida](docs/wireframes/2-partida.png)

## Estructura del código

```
src/
  main.ts                 Configuración de Phaser, carga de fuente, botón atrás de Android
  theme.ts                Resolución (360×640), paleta, helper de texto
  data/levels.ts          Definición de los 7 niveles
  data/credits.ts         Nombres del equipo (¡editar!)
  services/Save.ts        Persistencia (localStorage)
  services/Sfx.ts         Sintetizador de sonidos y música
  ui/PixelArt.ts          Sprites a partir de mapas de caracteres
  ui/PixelButton.ts       Botón y panel pixel art
  ui/fx.ts                Explosiones, confeti, textos flotantes, transiciones
  scenes/                 Boot, Splash, Home, LevelSelect, Game, Defuse, Score, Credits
  minigames/Minigame.ts   Clase base (manual de reglas, éxito, error)
  minigames/*.ts          Un archivo por mini juego
```

**Flujo de la desactivación:** `GameScene` detecta la bandera sobre una bomba, lanza `DefuseScene` encima y se pausa a sí misma (con eso también se detiene su reloj). `DefuseScene` crea el mini juego del nivel y lleva su propia cuenta de 3:00. Al terminar, reanuda `GameScene` y le emite el evento `defuse-result` con `{ success, timeLeft }`.

## Desarrollo

Requisitos: Node 22 o superior.

```bash
npm install
npm run dev        # http://localhost:5173 (usa la vista de móvil del navegador)
npm run build      # genera dist/
```

## Android y Google Play

Requisitos: **Android Studio** (incluye el SDK y un JDK compatible).

```bash
npm run build
npx cap sync android
npx cap open android
```

En Android Studio:

1. **Probar**: conecta un teléfono con depuración USB (o un emulador) y pulsa ▶ Run.
2. **Ícono**: ya está el de PixelMinas (la bomba del juego sobre azul noche) en `android/app/src/main/res/mipmap-*`. Para rehacerlo, clic derecho en `app` → New → Image Asset.
3. **Versión**: en `android/app/build.gradle`, sube `versionCode` en cada subida a Play.
4. **AAB firmado**: Build → Generate Signed App Bundle / APK → Android App Bundle → crea un *keystore* nuevo (**guárdalo junto con su contraseña: sin él no se pueden publicar actualizaciones**; está en `.gitignore`, no lo subas al repo).
5. En **Google Play Console**: crea la app, completa la ficha (descripción, capturas, ícono de 512 px, gráfico de 1024×500), la clasificación de contenido, la política de privacidad (el juego no recoge datos personales) y el formulario de seguridad de datos. Sube el `.aab` a *Prueba interna* o *Producción*.

> Nota: las cuentas personales nuevas de Play Console deben hacer una **prueba cerrada con testers durante 14 días** antes de publicar en producción. Conviene empezar pronto.

## Uso de IA (justificación)

El código se generó con asistencia de **Claude (Anthropic)** a partir del diseño del equipo: la idea del buscaminas con desactivación, los 7 niveles, la regla de reiniciar el nivel y la penalización por bandera falsa. Decisiones técnicas y su porqué:

- **Phaser 3** en lugar de DOM puro: ya trae escenas, tweens, partículas, input táctil y escalado a cualquier pantalla. Así nos enfocamos en la lógica del juego.
- **Sprites y sonidos generados por código**: no hay assets externos con licencias dudosas, el APK pesa menos y el pixel art se edita como texto (`ui/PixelArt.ts`).
- **Bombas colocadas después del primer toque** (`GameScene.generate`): la primera jugada nunca pierde, igual que en el buscaminas clásico.
- **Relleno por inundación con BFS** (`GameScene.dig`): abre las zonas vacías.
- **Generación procedural que garantiza solución**:
  - Laberinto con DFS (siempre tiene camino; la meta es la celda más lejana según BFS).
  - Tuberías: primero se traza un camino válido y después se giran las piezas al azar.
  - “Luces fuera”: se parte del panel apagado y se aplican toques al azar.
- **Escena superpuesta + pausa** para la desactivación: reutiliza la pausa de Phaser para congelar el reloj del nivel sin lógica extra.

Antes de la sustentación, cada integrante debe leer y saber explicar al menos `GameScene.ts`, `DefuseScene.ts`, `Save.ts` y uno de los mini juegos.

## Créditos

- Desarrollo: **Juan Andrés Ciro** y **Juan Manuel Arias**.

- Paleta [Sweetie 16](https://lospec.com/palette-list/sweetie-16) por GrafxKid.
- Fuente Press Start 2P por CodeMan38 (SIL Open Font License).
- Motor: Phaser 3. Empaquetado: Capacitor.
