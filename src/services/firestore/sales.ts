import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
  increment,
  getCountFromServer,
  Timestamp,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/config/firebase.config";
import { cashRegisterService } from "@/services/firestore/cash-registers";
import type { Sale, CreateSaleInput } from "@/types";

const col = collection(db, "sales");

/** YYYY-MM-DD de una fecha en hora Lima (id de la caja del día). */
const limaDate = (d: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(d);

const fromFirestore = (id: string, data: DocumentData): Sale => ({
  id,
  store_id: data.store_id,
  created_by: data.created_by,
  items: data.items ?? [],
  total: data.total,
  payment_type: data.payment_type,
  status: data.status,
  note: data.note ?? undefined,
  client_id: data.client_id ?? undefined,
  client_name: data.client_name ?? undefined,
  created_at: data.created_at?.toDate() ?? new Date(),
  completed_at: data.completed_at?.toDate() ?? undefined,
});

export const saleService = {
  async create(store_id: string, created_by: string, input: CreateSaleInput): Promise<Sale> {
    const batch = writeBatch(db);
    const saleRef = doc(col);
    const now = serverTimestamp();

    batch.set(saleRef, {
      store_id,
      created_by,
      items: input.items,
      total: input.total,
      payment_type: input.payment_type,
      status: "completed",
      note: input.note ?? null,
      client_id: input.client_id ?? null,
      client_name: input.client_name ?? null,
      created_at: now,
      completed_at: now,
    });

    for (const item of input.items) {
      const productRef = doc(db, "products", item.product_id);
      batch.update(productRef, {
        stock: increment(-item.quantity),
        updated_at: now,
      });
      // Registra el movimiento de salida en el ledger.
      const moveRef = doc(collection(db, "stock_movements"));
      batch.set(moveRef, {
        store_id,
        product_id: item.product_id,
        type: "sale",
        delta: -item.quantity,
        created_at: now,
      });
    }

    // Venta a crédito (fiado): suma a la deuda del cliente de forma atómica.
    if (input.payment_type === "credit" && input.client_id) {
      const clientRef = doc(db, "clients", input.client_id);
      batch.update(clientRef, {
        debt: increment(input.total),
        updated_at: now,
      });
    }

    await batch.commit();

    const snap = await getDoc(saleRef);
    return fromFirestore(snap.id, snap.data()!);
  },

  /**
   * Todas las ventas a crédito (fiados) de la tienda, más recientes primero.
   * Usa dos filtros de igualdad (sin orderBy) para no requerir índice compuesto;
   * el orden se resuelve en memoria.
   */
  async getCredit(store_id: string): Promise<Sale[]> {
    const q = query(
      col,
      where("store_id", "==", store_id),
      where("payment_type", "==", "credit"),
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => fromFirestore(d.id, d.data()))
      .filter((s) => s.status === "completed")
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  },

  async getRecent(store_id: string, count = 50): Promise<Sale[]> {
    const q = query(
      col,
      where("store_id", "==", store_id),
      where("status", "==", "completed"),
      orderBy("created_at", "desc"),
      limit(count),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => fromFirestore(d.id, d.data()));
  },

  async getByDate(store_id: string, date: string): Promise<Sale[]> {
    const start = new Date(date + "T00:00:00-05:00");
    const end = new Date(date + "T23:59:59-05:00");
    const q = query(
      col,
      where("store_id", "==", store_id),
      where("status", "==", "completed"),
      where("created_at", ">=", Timestamp.fromDate(start)),
      where("created_at", "<=", Timestamp.fromDate(end)),
      orderBy("created_at", "desc"),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => fromFirestore(d.id, d.data()));
  },

  /** Ventas completadas dentro de un rango de fechas, más recientes primero. */
  async getByRange(store_id: string, start: Date, end: Date): Promise<Sale[]> {
    const q = query(
      col,
      where("store_id", "==", store_id),
      where("status", "==", "completed"),
      where("created_at", ">=", Timestamp.fromDate(start)),
      where("created_at", "<=", Timestamp.fromDate(end)),
      orderBy("created_at", "desc"),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => fromFirestore(d.id, d.data()));
  },

  /** Cuenta (agregación) las ventas completadas en un rango. */
  async countByRange(store_id: string, start: Date, end: Date): Promise<number> {
    // Mismo orderBy que getByRange para reutilizar el índice (store_id, status, created_at DESC).
    const q = query(
      col,
      where("store_id", "==", store_id),
      where("status", "==", "completed"),
      where("created_at", ">=", Timestamp.fromDate(start)),
      where("created_at", "<=", Timestamp.fromDate(end)),
      orderBy("created_at", "desc"),
    );
    const snap = await getCountFromServer(q);
    return snap.data().count;
  },

  async getById(id: string): Promise<Sale | null> {
    const snap = await getDoc(doc(db, "sales", id));
    if (!snap.exists()) return null;
    return fromFirestore(snap.id, snap.data());
  },

  /**
   * Anula una venta: la marca como cancelada, devuelve el stock de cada ítem
   * (con su movimiento de reversa) y, si fue fiado, descuenta la deuda del cliente.
   * La caja del día se revierte aparte (solo afecta a ventas no-fiado).
   */
  async voidSale(sale: Sale): Promise<void> {
    const batch = writeBatch(db);
    const now = serverTimestamp();

    batch.update(doc(db, "sales", sale.id), { status: "cancelled", cancelled_at: now });

    for (const item of sale.items) {
      batch.update(doc(db, "products", item.product_id), {
        stock: increment(item.quantity),
        updated_at: now,
      });
      const moveRef = doc(collection(db, "stock_movements"));
      batch.set(moveRef, {
        store_id: sale.store_id,
        product_id: item.product_id,
        type: "adjustment",
        delta: item.quantity,
        created_at: now,
      });
    }

    if (sale.payment_type === "credit" && sale.client_id) {
      batch.update(doc(db, "clients", sale.client_id), {
        debt: increment(-sale.total),
        updated_at: now,
      });
    }

    await batch.commit();

    if (sale.payment_type !== "credit") {
      await cashRegisterService
        .reverseSale(sale.store_id, limaDate(sale.created_at), sale.total, sale.payment_type)
        .catch((err) => console.error("Error revirtiendo caja:", err));
    }
  },
};
