# Publicar PixelMinas en Google Play

Esta carpeta tiene todo lo que se puede preparar desde el repositorio. Lo que
queda son pasos que exigen tu identidad, tu dinero o tu firma, y esos solo
los puedes hacer tú.

## Estado en Play Console (4 de noviembre de 2026)

La app ya está creada en la cuenta **holamundo.co**.

| Dato | Valor |
|---|---|
| Cuenta de desarrollador | `6214002968277560371` |
| ID de la app | `4973063558207867990` |
| Paquete | `com.pixelminas.game` |
| Enlace | <https://play.google.com/console/u/0/developers/6214002968277560371/app/4973063558207867990/app-dashboard> |

Hecho:

- App creada: nombre, paquete, es-419, juego, gratis y las dos declaraciones.
- Ficha de Play Store guardada como borrador: descripción breve (72/80),
  descripción completa (1807/4000), icono, gráfico destacado y tres capturas.
- Versión de **prueba interna** guardada como borrador con el AAB: versión
  1 (1.0), API 24+, SDK de destino 36, todas las ABI.

Pendiente:

- Los nueve formularios de **Contenido de la app**.
- **Configuración de la tienda**: categoría (Rompecabezas) y correo de contacto.
- Enviar a revisión.

El bloqueo principal es la política de privacidad: Play exige una URL pública
que cargue, y la de GitHub Pages todavía da 404. **Solo Juan Andrés puede
activarla**, porque en `juanCiroB/pixelminas` la otra cuenta tiene permiso de
escritura pero no de administrador. Además el repositorio es privado, y Pages
en repositorios privados requiere plan de pago: hay que hacerlo público antes.

Al subir la siguiente versión hay que incrementar `versionCode` en
`android/app/build.gradle`. Play ya consumió el 1 y rechaza repetirlo.

## Ya está listo

| Qué | Dónde |
|---|---|
| Textos de la ficha, clasificación y seguridad de datos | `ficha-de-la-tienda.md` |
| Icono de la tienda, 512 × 512 | `icono-512.png` |
| Gráfico destacado, 1024 × 500 | `grafico-destacado-1024x500.png` |
| Capturas de teléfono, 1080 × 2400 | `capturas/` |
| Política de privacidad | `../politica-de-privacidad.html` |
| Configuración de firma en Gradle | `android/app/build.gradle` |
| Plantilla de credenciales | `android/keystore.properties.example` |

El AAB sin firmar ya compila: `android/app/build/outputs/bundle/release/app-release.aab`.

## Lo que tienes que hacer tú

### 1. Crear la cuenta de Play Console

En <https://play.google.com/console>. Cuesta **25 USD una sola vez** y pide
verificar tu identidad con un documento oficial. Google tarda de unas horas a
varios días en aprobarla, así que empieza por aquí.

También hay que aceptar el Acuerdo de Distribución para Desarrolladores. Es un
contrato a tu nombre: tiene que firmarlo una persona, no una herramienta.

### 2. El almacén de claves (ya creado)

Existe en `android/pixelminas.jks`, con alias `pixelminas` y validez de 10.000
días. Sus credenciales están en `android/keystore.properties`. Ninguno de los
dos está en el repositorio: el `.gitignore` los bloquea.

**Haz esto hoy:** abre `android/keystore.properties`, copia la contraseña a tu
gestor de contraseñas y guarda una copia del `.jks` fuera del equipo. Esta es
la clave de subida de la aplicación. Con Play App Signing, si se pierde se
puede pedir un restablecimiento a Google, pero el trámite tarda días.

**Nunca la subas al repositorio ni la pegues en un chat.** Si Juan Andrés
necesita generar releases, pásale el `.jks` y la contraseña por un canal
privado, no por GitHub.

Para rehacer el almacén desde cero, si alguna vez hiciera falta, está la
plantilla `android/keystore.properties.example` con el comando.

Huella del certificado de subida, para cotejarla en Play Console cuando pida
confirmar la clave (esto no es secreto, se puede compartir):

```
SHA-256  67:D4:8D:72:F2:8C:61:17:92:BE:6B:CF:A7:54:C1:27:DE:31:D8:3A:22:43:07:9C:13:80:16:89:95:0A:2A:9F
```

El certificado vale hasta marzo de 2054, muy por encima del mínimo que exige
Play (octubre de 2033).

### 3. Generar el AAB firmado

```bash
npm run build && npx cap sync android && ./android/gradlew.bat -p android bundleRelease
```

Queda en `android/app/build/outputs/bundle/release/app-release.aab`. Para
comprobar que salió firmado:

```bash
jarsigner -verify android/app/build/outputs/bundle/release/app-release.aab
```

### 4. Publicar la política de privacidad

Play exige una URL pública que cargue. La más rápida es GitHub Pages:

1. En GitHub, **Settings → Pages**.
2. En *Source* elige la rama `main` y la carpeta `/docs`.
3. Espera un par de minutos y abre
   <https://juanciroB.github.io/pixelminas/politica-de-privacidad.html>
   para confirmar que carga.

### 5. Crear la app en Play Console

Con los textos de `ficha-de-la-tienda.md`:

1. **Crear aplicación**: nombre PixelMinas, español, aplicación gratuita.
2. **Ficha principal**: descripción breve, descripción completa, icono, gráfico
   destacado y capturas.
3. **Clasificación del contenido**: responde el cuestionario con la tabla de la ficha.
4. **Seguridad de los datos**: declara que la app no recoge ni comparte datos.
5. **Público objetivo**: todas las edades.
6. **Sube el AAB** en *Prueba interna* para empezar.

### 6. Contar con los 14 días de prueba cerrada

Las cuentas personales nuevas de Play Console tienen que hacer una **prueba
cerrada con al menos 12 testers durante 14 días seguidos** antes de poder
solicitar la publicación en producción. No se puede saltar ni acelerar.

Si la entrega del curso tiene fecha, esto es lo que hay que arrancar primero:
sube el AAB a prueba cerrada, invita a los compañeros y deja correr el plazo.
Para la nota suele bastar con enseñar la app publicada en prueba interna o
cerrada, con el enlace de Play Console.

## Qué queda en manos de una persona

La subida en sí. Conviene aclararlo porque se presta a confusión: **Android
Studio no publica en Google Play**. Genera el AAB firmado y ahí termina su
trabajo. La subida ocurre en la consola web, o por la Play Developer API, que
a su vez exige crear una cuenta de servicio autorizada desde la misma consola.

En ese tramo hay cuatro declaraciones legales que firma la persona titular de
la cuenta, no una herramienta: el cumplimiento de las leyes de exportación de
EE. UU., la conformidad con las directrices de contenido, el formulario de
seguridad de los datos y el cuestionario de clasificación. Las respuestas
correctas para este juego están en `ficha-de-la-tienda.md`, pero quien
responde por ellas ante Google es el titular.

Todo lo demás —gráficos, textos, política de privacidad, configuración de
firma, almacén de claves y el AAB firmado— ya está hecho.
