# QRCraft

Aplicación móvil para escanear, crear y organizar códigos QR. Está construida con React Native, Expo y TypeScript, con una interfaz oscura y almacenamiento local.

## Funciones

- Escáner con cámara, marco y láser animado, linterna, cambio de cámara e importación desde fotos.
- QR Guardián analiza localmente enlaces escaneados, explica señales como dominios acortados, HTTP sin cifrar o direcciones IP y pausa la apertura automática cuando encuentra alertas. Es una revisión heurística, no consulta servicios externos ni puede garantizar que un enlace sea seguro.
- Vista de resultados para enlaces, Wi-Fi, texto, contactos, WhatsApp, correo, teléfono, SMS y ubicaciones.
- Creación de QR para URL, redes Wi-Fi, texto, contactos vCard y enlaces directos a WhatsApp con mensajes sugeridos opcionales.
- Personalización con 20 colores de módulos, 13 fondos, 6 diseños predefinidos y 3 formas; vista previa, exportación PNG y SVG.
- Historial local de escaneos y creaciones con búsqueda, detalle y eliminación individual o completa.
- Ajustes de sonido, vibración y apertura automática de enlaces.
- Anuncios en Crear e Historial, intersticial después de cada tres exportaciones guardadas y anuncio bonificado para HD/SVG.
- Ajustes de privacidad y términos accesibles desde la aplicación.

## Requisitos

- Node.js LTS y npm.
- Expo Go para probar las funciones compatibles, o un dispositivo/emulador con una compilación nativa para probar AdMob.
- EAS CLI para crear builds en la nube: `npm install --global eas-cli`.

## Desarrollo

```bash
npm ci
npm start
```

Atajos disponibles:

```bash
npm run android
npm run ios
npm run typecheck
npm run export:android
npm run update:android
npm run doctor
```

La exportación Android escribe los bundles en `dist/` de forma predeterminada. Para usar otro destino:

```bash
npm run export:android -- --output-dir /tmp/qrcraft-export
```

Ejecuta `npm run update:android` para regenerar el proyecto nativo y crear un APK autónomo universal para teléfonos Android ARM de 32 y 64 bits en `build/QRCraft.apk`. Puedes copiar ese APK al teléfono e instalarlo manualmente. Si conectas exactamente un teléfono Android autorizado por USB, el script también lo instala y abre; si no hay teléfono, solo compila, y si hay varios, evita elegir uno por ti. Necesita Android SDK, Node/npm y un JDK compatible (17 o 21); ADB/platform-tools es opcional. Conserva la clave de firma local en `build/debug.keystore`, excluida de Git, para actualizar instalaciones firmadas con esa misma clave.

## Compilaciones con EAS

Los perfiles están definidos en [`eas.json`](./eas.json). Configura el proyecto con `eas build:configure` si aún no tiene un proyecto EAS vinculado y luego ejecuta:

```bash
eas build --platform android --profile development
eas build --platform android --profile preview
eas build --platform all --profile production
```

AdMob y otros módulos nativos no están disponibles dentro de Expo Go. Usa una compilación development, preview o production para probar las integraciones nativas.

## Anuncios y compras

Android está configurado con los IDs de la cuenta AdMob del propietario y las unidades Banner, Intersticial y Recompensado de QRCraft. iOS conserva IDs de prueba hasta configurar una app y sus unidades para esa plataforma. La configuración de AdMob define los IDs, pero la publicación efectiva de anuncios depende de la aprobación y el estado de la cuenta/app en AdMob.

Antes de distribuir la aplicación:

1. Confirma en AdMob que la aplicación y las unidades están activas y que no hay tareas de verificación pendientes.
2. Revisa los consentimientos, divulgaciones y políticas de anuncios aplicables a tus usuarios y mercados.

En Expo Go se muestran anuncios de demostración en lugar de anuncios nativos. Esta versión no incluye compras ni suscripciones dentro de la aplicación.

## Permisos y privacidad

La aplicación solicita acceso a la cámara para escanear y acceso a fotos para importar imágenes y guardar los PNG. No solicita permiso de micrófono ni necesita acceso a videos o audio. El escaneo y la creación se realizan localmente; historial y preferencias se almacenan en el dispositivo mediante AsyncStorage.

Los permisos precisos pueden variar según la versión de Android/iOS y los módulos nativos que incluya la compilación. Revisa los manifiestos generados antes de publicar. Los textos legales incluidos son una base informativa y deben revisarse según el producto final, los anuncios, las compras, la jurisdicción y la política de la tienda.

La conexión a una red Wi-Fi depende del sistema operativo: QRCraft muestra los datos y, cuando es posible, abre los ajustes de Wi-Fi. En Android moderno e iOS el sistema puede requerir confirmación manual.

## Tecnología

- Expo / React Native / TypeScript.
- React Navigation, Expo Camera, Image Picker y Media Library.
- `qrcode` y `react-native-svg` para generar y renderizar códigos.
- AsyncStorage para historial y ajustes locales.
- AdMob nativo mediante `react-native-google-mobile-ads`.

## Licencia

Consulta [`LICENSE`](./LICENSE).
