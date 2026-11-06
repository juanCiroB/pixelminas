# Publicar PixelMinas en Google Play

Esta carpeta tiene todo lo que se puede preparar desde el repositorio. Lo que
queda son pasos que exigen tu identidad, tu dinero o tu firma, y esos solo
los puedes hacer tú.

## Estado en Play Console (5 de noviembre de 2026)

La app está creada en la cuenta **holamundo.co**.

| Dato | Valor |
|---|---|
| Cuenta de desarrollador | `6214002968277560371` |
| ID de la app | `4973063558207867990` |
| Paquete | `com.pixelminas.game` |
| Enlace | <https://play.google.com/console/u/0/developers/6214002968277560371/app/4973063558207867990/app-dashboard> |

### Hecho

- App creada: nombre, paquete, es-419, juego, gratis y las dos declaraciones.
- **Las diez declaraciones de Contenido de la app están completas.** Play muestra
  "Ya estás al día" en la pestaña *Requiere atención*.
- Política de privacidad apuntando a GitHub Pages, que ya responde 200.
- Seguridad de los datos: no recopila ni comparte.
- Clasificación del contenido: completada con la IARC, todo "No".
- Público objetivo: 13-15, 16-17 y mayores de 18. Al excluir menores, Play salta
  los pasos del programa Familias.
- Ficha de Play Store publicada como borrador con los textos, el icono, el
  gráfico destacado y tres capturas de 1200x2400.
- Categoría: **Habilidad mental**. Ojo: en la lista de Play **no existe
  "Rompecabezas"**; las 17 opciones de juego son Acción, Arcade, Aventura,
  Carreras, Cartas, Casino, Casuales, Deportes, Educativos, Estrategia,
  Habilidad mental, Juegos de mesa, Juegos de palabras, Música, Preguntas y
  respuestas, Rol y Simulación.
- Correo de contacto público: juanmanuelarias43@gmail.com
- Declaración de recursos de IA: "No etiquetar recursos". El icono y el gráfico
  se generaron con un script que dibuja píxel a píxel, no con un modelo de
  imágenes, y las capturas son del emulador.
- Versión de prueba interna con el AAB: versión 1 (1.0), API 24+, destino 36.

### Publicada en prueba interna

El 5 de noviembre de 2026 la versión 1 (1.0) quedó **Activa** en el canal de
prueba interna, que no pasa por revisión de Google.

Enlace para instalarla (hay que aceptar la invitación con una cuenta que esté
en la lista de verificadores):

<https://play.google.com/apps/internaltest/4700739553055423073>

Lista de verificadores: **PixelMinas**, con juanmanuelarias43@gmail.com. Admite
hasta 100 correos y se edita en Prueba interna → Verificadores.

Mientras Google no revise la app, los verificadores la verán con el nombre
provisional `com.pixelminas.game (unreviewed)` en vez de PixelMinas. Es normal
en la primera publicación.

Al subir la siguiente versión hay que incrementar `versionCode` en
`android/app/build.gradle`. Play ya consumió el 1 y rechaza repetirlo.

### Si quieren llegar a producción

Falta pulsar "Enviar la app para su revisión" en Descripción general de la
publicación. Ojo: las cuentas personales creadas después de noviembre de 2023
necesitan antes una prueba cerrada con 12 verificadores durante 14 días
seguidos. Para la entrega del curso, la prueba interna ya demuestra la app
publicada y funcionando.

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
