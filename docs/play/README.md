# Publicar PixelMinas en Google Play

Esta carpeta tiene todo lo que se puede preparar desde el repositorio. Lo que
queda son pasos que exigen tu identidad, tu dinero o tu firma, y esos solo
los puedes hacer tú.

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

### 2. Crear el almacén de claves

Desde la carpeta `android/`:

```bash
keytool -genkeypair -v -keystore pixelminas.jks -keyalg RSA -keysize 2048 -validity 10000 -alias pixelminas
```

Te va a pedir una contraseña y algunos datos (nombre, organización, ciudad,
país). Después copia la plantilla y rellénala con esa contraseña:

```bash
cp keystore.properties.example keystore.properties
```

**Guarda el archivo `pixelminas.jks` y su contraseña en un gestor de
contraseñas.** Si los pierdes, Google Play no te deja volver a publicar una
actualización de `com.pixelminas.game` nunca más: habría que empezar con otro
identificador de aplicación y perder las instalaciones. Ni el `.jks` ni el
`keystore.properties` se suben al repositorio; el `.gitignore` ya los bloquea.

La contraseña la eliges tú y no la escribas en el chat ni en el repositorio.

### 3. Generar el AAB firmado

```bash
npm run build && npx cap sync android && ./android/gradlew.bat -p android bundleRelease
```

Queda en `android/app/build/outputs/bundle/release/app-release.aab`. Para
comprobar que salió firmado:

```bash
jarsigner -verify -verbose android/app/build/outputs/bundle/release/app-release.aab
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

## Por qué no lo hice yo

Los pasos 1, 2, 5 y 6 piden cosas que no debo hacer en tu nombre: pagar los 25
dólares, subir tu documento de identidad, firmar un contrato con Google, crear
y custodiar la clave de firma de tu aplicación, y publicar contenido a nombre
tuyo. Todo lo demás —los gráficos, los textos, la política, la configuración de
firma y el AAB— está hecho y versionado aquí.
