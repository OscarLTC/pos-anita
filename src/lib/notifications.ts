import type { NotificationSettings } from "@/types";

/** Preferencias por defecto cuando la tienda aún no las configuró. */
export const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  debt_reminders: true,
  debt_reminder_days: 5,
  low_stock: true,
  big_sale: false,
  big_sale_amount: 100,
  daily_summary: true,
  daily_summary_time: "20:30",
  sound_on_sale: true,
};

/** Opciones de frecuencia para los recordatorios de deuda (en días). */
export const REMINDER_DAYS = [3, 5, 7, 10] as const;
