# Universal Links — invitaciones

Los links de invitación (`https://<dominio>/invite/<token>`) abren la app si está
instalada, o el navegador si no. Esto se llama **Universal Links** (iOS) y
**App Links** (Android), y requiere config nativa + archivos alojados en tu dominio.

> Hoy el dominio placeholder es **`links.caserita.app`**. Cámbialo por el tuyo en los
> 4 lugares de la lista de abajo.

## 1. Elige tu dominio y reemplázalo

Reemplaza `links.caserita.app` por tu dominio real en:

1. [`src/lib/links.ts`](../src/lib/links.ts) → `INVITE_DOMAIN`
2. [`app.json`](../app.json) → `ios.associatedDomains` (`applinks:<dominio>`)
3. [`app.json`](../app.json) → `android.intentFilters[].data.host`
4. Los archivos de `public/.well-known/` se sirven **desde ese dominio**.

## 2. Aloja los archivos de asociación

Deben quedar accesibles por HTTPS, sin redirecciones y con `Content-Type: application/json`:

- `https://<dominio>/.well-known/apple-app-site-association`
- `https://<dominio>/.well-known/assetlinks.json`

Si despliegas el build web de Expo, los archivos de [`public/.well-known/`](../public/.well-known/)
se sirven en la raíz automáticamente. Si usas otro hosting, sube esos dos archivos ahí.

## 3. Completa los placeholders de los archivos

- **iOS** — en `apple-app-site-association`, reemplaza `REEMPLAZA_APPLE_TEAM_ID` por tu
  Apple Team ID (App Store Connect → Membership, ej. `A1B2C3D4E5`). Queda
  `A1B2C3D4E5.com.oscarltc.posanita`.
- **Android** — en `assetlinks.json`, reemplaza `REEMPLAZA_CON_TU_SHA256_DE_FIRMA` por
  la huella SHA-256 del certificado de firma. Con EAS:
  ```
  eas credentials        # Android → ver el SHA-256 del keystore
  ```
  (o cópialo de Google Play Console → Integridad de apps → firma de apps).

## 4. Compila con EAS (no funciona en Expo Go)

Los universal/app links solo funcionan en un build nativo:

```
eas build --profile development --platform all   # o preview/production
```

## 5. Verifica

- iOS: abre `https://<dominio>/invite/test` desde Notas/Safari → debe abrir la app.
- Android: `adb shell am start -a android.intent.action.VIEW -d "https://<dominio>/invite/test"`.
- El esquema `posanita://invite/<token>` sigue funcionando como respaldo directo.

## Nota: navegador cuando la app no está instalada

`https://<dominio>/invite/<token>` sin la app instalada abre el navegador. Si quieres
una página de respaldo ("Descarga la app / abrir en la app"), aloja un `index.html` o
una ruta que maneje `/invite/*` en ese dominio. Es opcional y vive en tu hosting.
