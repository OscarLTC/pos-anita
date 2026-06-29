# Pendientes / Backlog

Cosas que quedaron diferidas, con el contexto para retomarlas sin perder tiempo.
Última actualización: **2026-06-29**.

---

## 1. Universal links — finalizar (pausado) ⏸️

El flujo de invitación por link **ya funciona** con el esquema `posanita://`. Falta
activar los links `https://` para que abran la app desde cualquier lado.

- **Estado:** código y config listos con dominio placeholder `links.caserita.app`.
- **Falta (depende de infraestructura):**
  1. Definir el **dominio real** y reemplazarlo en los 4 lugares.
  2. **Alojar** `apple-app-site-association` y `assetlinks.json` en `https://<dominio>/.well-known/`.
  3. Completar **Apple Team ID** (iOS) y **SHA-256** de firma (Android).
  4. **Build con EAS** (no funciona en Expo Go) y verificar.
- **Guía completa:** [`docs/universal-links.md`](../universal-links.md)

---

## 2. Envío de correo de invitación 📧

Hoy la invitación se comparte por **WhatsApp / menú Compartir** (link con token). No se
envía correo automático.

- **Falta:** backend de correo — Cloud Functions o la extensión **Trigger Email** de
  Firebase + proveedor (SendGrid) + **plan Blaze**.
- **Idea:** al crear el invite, escribir a una colección `mail` (extensión) con el link.

---

## 3. Reglas de seguridad — desplegar y probar 🔒

Las reglas multiusuario se reescribieron pero **no se probaron** (no tengo acceso a tu
Firebase).

- **Falta:**
  - `firebase deploy --only firestore:rules`.
  - Probar en consola/emulador: acceso de miembro, **aceptar invitación por token**
    (crear membresía con `invite_token` + consumir el invite), listar/cancelar invites.
- **Hardening futuro:** restringir edición de **precios** a gerente+ a nivel de reglas
  (hoy el enforcement es solo de UI; las reglas permiten escritura a cualquier miembro).

---

## 4. Datos del negocio — logo 🖼️

El formulario de "Datos del negocio" guarda todos los campos de texto. El **logo** quedó
como "Próximamente".

- **Falta:** `expo-image-picker` + **Firebase Storage** (subir/quitar, validar 2 MB),
  y guardar `logo_url` en el `Store`.
- Campos `ruc/phone/address/district/open_time/close_time` ya persisten.

---

## 5. Placeholders "Próximamente" (hoja Cuenta) 🚧

_(Ya no quedan placeholders vacíos en la hoja Cuenta; ver puntos específicos abajo.)_

## 5d. Suscripción — cobro / billing 💳

La **pantalla de Suscripción ya está hecha**: muestra el plan Gratis con **uso real**
(productos, usuarios, ventas/mes, clientes con fiado vs. límites) y la tarjeta de
Caserita Pro. Falta lo de cobrar:

- **"Probar 30 días gratis"** y **"plan Negocio"** son placeholders ("Próximamente").
- Integrar **billing**: Stripe (web) o **In-App Purchases** (App Store / Play) — RevenueCat
  simplifica ambos. Requiere backend + cuentas de pago.
- Persistir el **plan activo** en el `Store` (hoy es "Gratis" fijo) y **aplicar los
  límites** de verdad (bloquear al superar 50 productos / 3 usuarios / etc. en plan Gratis).
- Límites y precio en [`src/config/plans.ts`](../../src/config/plans.ts).

## 5c. Impresión de tickets — integración nativa 🖨️

La **pantalla de Impresoras y tickets ya está hecha**: tamaño, copia para el cliente,
mensaje al pie y **vista previa en vivo** (persisten en `Store.tickets`). Falta el hardware:

- **Conectar impresora** térmica (USB/Bluetooth ESC/POS) — necesita librería nativa
  (ej. `react-native-ble-plx` / módulo ESC/POS) + build nativo.
- **Imprimir prueba** y **Reimprimir** (detalle de venta) — hoy son placeholders.
- **Imprimir al cobrar** usando `Store.tickets` (tamaño, copia, pie) + los datos del
  negocio. El builder de la vista previa (`src/lib/receipt.ts`) ya tiene el formato base
  para reutilizar al generar el comando ESC/POS real.

## 5b. Notificaciones — disparo real 🔔

La **pantalla de preferencias ya está hecha** y persiste en el `Store`; **"Sonido al
cobrar" ya funciona** (local, expo-audio). Falta que las alertas se **disparen** de verdad:

- **Recordatorios automáticos** (WhatsApp a deudores cada X días) → trabajo programado
  en backend (Cloud Functions + cron). Relacionado con el punto 2 (envío de correo).
- **Alerta de stock bajo / Venta grande / Resumen diario** → push notifications
  (`expo-notifications` + backend que las dispare; el resumen necesita cron al cerrar caja).
- Las preferencias (`Store.notifications`) ya guardan qué está activo, frecuencia, monto y
  hora; el backend solo tendría que leerlas.

---

## 6. Datos estáticos a conectar 🔌

- Tarjeta del negocio muestra **"Lima · Plan gratis"** fijo (el `Store` no tiene
  ciudad/plan). Conectar cuando existan esos campos.
- Footer **"Caserita · v0.9 (beta)"** es texto fijo; podría leer la versión real.

---

## 7. Boletas / recibos con datos del negocio 🧾

Los datos del negocio (RUC, dirección, horario, etc.) **se guardan pero aún no se
imprimen** en boletas ni se inyectan en los mensajes de WhatsApp. Engancharlo cuando se
trabaje el módulo de boletas/recordatorios.
