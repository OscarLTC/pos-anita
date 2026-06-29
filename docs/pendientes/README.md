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

Opciones que existen visualmente pero aún no hacen nada:

- **Reimprimir** (detalle de venta) → requiere integración de impresora de tickets.
- **Impresoras y tickets** → configuración de impresora.
- **Suscripción** → "Plan gratis · sube a Pro" (sin planes/pagos todavía).

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
