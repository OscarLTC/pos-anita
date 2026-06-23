# Plantillas de correo — POS Anita

Estilo Mercurio para los correos transaccionales de autenticación.

## ⚠️ Importante: límites de Firebase Console

El editor de **Authentication → Templates** de Firebase **NO admite HTML/CSS personalizado**.
Solo puedes editar:

- Nombre del remitente y dirección "From"
- "Reply to"
- **Asunto**
- **Texto del mensaje** (Firebase lo inserta en su propia estructura HTML, con su botón/enlace)

Por eso hay dos caminos:

---

## Opción A — Solo personalizar la consola (rápido, sin código)

Funciona hoy, sin backend. No tendrás el diseño completo, pero sí un texto claro y en tu voz.
En **Firebase Console → Authentication → Templates → Restablecimiento de contraseña**:

- **Nombre del remitente:** `POS Anita`
- **Asunto:** `Restablece tu contraseña de POS Anita`
- **Mensaje** (Firebase reemplaza `%LINK%`, `%APP_NAME%` automáticamente):

  ```
  Hola,

  Recibimos una solicitud para restablecer la contraseña de tu cuenta de %APP_NAME%.
  Para crear una nueva contraseña, sigue este enlace:

  %LINK%

  El enlace caduca pronto y solo se puede usar una vez.
  Si no fuiste tú, ignora este correo: tu contraseña seguirá igual.

  — El equipo de %APP_NAME%
  ```

> Tip: personaliza también el dominio del remitente para reducir el riesgo de spam.

---

## Opción B — Correo 100% branded (requiere backend)

Para enviar el [`password-reset.html`](./password-reset.html) con el diseño Mercurio completo:

1. **Genera el enlace** con el Admin SDK en una Cloud Function:
   ```ts
   import { getAuth } from "firebase-admin/auth";
   const link = await getAuth().generatePasswordResetLink(email);
   ```
2. **Renderiza la plantilla** reemplazando los placeholders:
   - `%LINK%` → el `link` generado
   - `%APP_NAME%` → `POS Anita`
3. **Envía el correo** con tu proveedor (Resend, SendGrid, Postmark, etc.).
4. En tu app, sigue llamando a `resetPassword(email)` solo si decides usar el flujo nativo;
   si usas la ruta custom, llama a tu Cloud Function en su lugar.

### Notas de la plantilla HTML

- Estilos **en línea** y layout con **tablas** (los clientes de correo ignoran `<style>` y CSS externo).
- Usa **fuente del sistema**: Bricolage Grotesque no se puede cargar de forma fiable en correo.
- Colores tomados de los tokens Mercurio (`src/theme/tokens.ts`): `primary #0E5E3E`, `ink #0E1410`,
  `inkMid #5A655E`, `bg #FAFAF7`, `surface #FFFFFF`.
- El logo es un badge verde con las iniciales "PA" (las imágenes en correo requieren hosting externo;
  si subes un logo PNG a una URL pública, puedes cambiar el badge por un `<img>`).
