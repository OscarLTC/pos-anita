export type ProductUnit = "unit" | "kg" | "l";
export type ProductStatus = "active" | "archived";

export type product_unit = ProductUnit;
export type product_status = ProductStatus;

export interface Store {
  id: string;
  name: string;
  owner_id: string;
  currency: string;
  default_min_margin: number;
  /** Redondea a S/ 0.10 el subtotal de los productos vendidos por peso (kg/L). */
  round_weighted: boolean;
  // Datos del negocio — se imprimen en boletas y aparecen en mensajes de WhatsApp.
  ruc?: string;
  phone?: string;
  address?: string;
  district?: string;
  /** Horario de atención en formato "HH:MM" (24h). */
  open_time?: string;
  close_time?: string;
  logo_url?: string;
  notifications?: NotificationSettings;
  created_at: Date;
}

export interface Category {
  id: string;
  store_id: string;
  name: string;
  icon: string;
  color: string;
  order: number;
  created_at: Date;
}

export interface Product {
  id: string;
  store_id: string;
  category_id: string;
  name: string;
  unit: ProductUnit;
  cost_price: number;
  sale_price: number;
  stock: number;
  min_stock: number;
  barcode?: string;
  status: ProductStatus;
  min_margin?: number;
  created_at: Date;
  updated_at: Date;
}

export interface ProductWithMeta extends Product {
  category: Category;
  margin: number;
  margin_amount: number;
  is_low_stock: boolean;
  is_low_margin: boolean;
}

export interface PriceHistory {
  id: string;
  product_id: string;
  store_id: string;
  old_cost_price: number;
  new_cost_price: number;
  old_sale_price: number;
  new_sale_price: number;
  changed_by: string;
  changed_at: Date;
  note?: string;
}

export type CreateCategoryInput = Pick<Category, "name" | "icon" | "color">;

export type CreateProductInput = Omit<
  Product,
  "id" | "store_id" | "status" | "created_at" | "updated_at"
>;

export type UpdateProductInput = Partial<CreateProductInput>;

export type CreatePriceHistoryInput = Omit<PriceHistory, "id" | "changed_at">;

export type UpdateStoreInput = Partial<
  Pick<
    Store,
    | "name"
    | "currency"
    | "default_min_margin"
    | "round_weighted"
    | "ruc"
    | "phone"
    | "address"
    | "district"
    | "open_time"
    | "close_time"
    | "logo_url"
    | "notifications"
  >
>;

/** Preferencias de notificaciones de la tienda. */
export interface NotificationSettings {
  /** Recordatorios automáticos por WhatsApp a clientes con deuda. */
  debt_reminders: boolean;
  /** Cada cuántos días recordar (3 | 5 | 7 | 10). */
  debt_reminder_days: number;
  /** Avisar cuando un producto llega al stock mínimo. */
  low_stock: boolean;
  /** Avisar cuando una venta supera un monto. */
  big_sale: boolean;
  big_sale_amount: number;
  /** Resumen del día al cerrar caja. */
  daily_summary: boolean;
  /** Hora de envío del resumen "HH:MM". */
  daily_summary_time: string;
  /** Reproducir un sonido al registrar un cobro. */
  sound_on_sale: boolean;
}

export type PaymentType = "cash" | "yape" | "plin" | "card" | "credit";

// --- Usuarios y permisos ---

/** Roles dentro de una tienda. owner = Dueña, manager = Gerente, cashier = Cajero. */
export type MemberRole = "owner" | "manager" | "cashier";

/** Miembro activo de una tienda. Doc id = `${store_id}_${user_id}`. */
export interface StoreMember {
  id: string;
  store_id: string;
  user_id: string;
  email: string;
  name?: string;
  role: MemberRole;
  joined_at: Date;
  last_active_at?: Date;
}

/**
 * Invitación pendiente. El doc id es un token aleatorio: es el secreto del link
 * `posanita://invite/{token}`. `store_name` va denormalizado para mostrarlo en la
 * pantalla de aceptación sin necesidad de leer la tienda (aún no es miembro).
 */
export interface StoreInvite {
  id: string;
  store_id: string;
  store_name: string;
  /** A quién se pensó invitar (opcional, informativo). El link sirve para cualquier cuenta. */
  email?: string;
  /** Solo manager o cashier; la dueña no se invita. */
  role: Exclude<MemberRole, "owner">;
  invited_at: Date;
  invited_by?: string;
}

export type InviteRole = Exclude<MemberRole, "owner">;

export interface Client {
  id: string;
  store_id: string;
  name: string;
  nickname?: string;
  phone?: string;
  debt: number;
  created_at: Date;
  updated_at: Date;
}

export type CreateClientInput = Pick<Client, "name" | "nickname" | "phone">;

/** Métodos con los que se puede cobrar un abono de fiado. */
export type AbonoMethod = "cash" | "yape" | "plin";

export interface Payment {
  id: string;
  store_id: string;
  client_id: string;
  amount: number;
  method: AbonoMethod;
  created_at: Date;
}

export type CreatePaymentInput = Pick<Payment, "client_id" | "amount" | "method">;

export type SaleStatus = "pending" | "completed" | "cancelled";
export type RegisterStatus = "open" | "closed";

export interface SaleItem {
  product_id: string;
  product_name: string;
  unit: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  store_id: string;
  created_by: string;
  items: SaleItem[];
  total: number;
  payment_type: PaymentType;
  status: SaleStatus;
  note?: string;
  client_id?: string;
  client_name?: string;
  created_at: Date;
  completed_at?: Date;
}

export type StockMovementType = "sale" | "restock" | "adjustment";

export interface StockMovement {
  id: string;
  store_id: string;
  product_id: string;
  type: StockMovementType;
  delta: number; // negativo = salida (venta), positivo = entrada (reposición)
  created_at: Date;
}

export interface CashRegister {
  id: string;
  store_id: string;
  date: string;
  total_sales: number;
  total_cash: number;
  total_yape: number;
  total_plin: number;
  total_card: number;
  sales_count: number;
  opened_at: Date;
  closed_at?: Date;
  status: RegisterStatus;
}

export type CreateSaleInput = {
  items: SaleItem[];
  total: number;
  payment_type: PaymentType;
  note?: string;
  client_id?: string;
  client_name?: string;
};
