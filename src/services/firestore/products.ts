import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/config/firebase.config";
import type { Product, CreateProductInput, UpdateProductInput } from "@/types";
import { priceHistoryService } from "./price-history";

const col = collection(db, "products");

const fromFirestore = (id: string, data: DocumentData): Product => ({
  id,
  store_id: data.store_id,
  category_id: data.category_id,
  name: data.name,
  unit: data.unit,
  cost_price: data.cost_price,
  sale_price: data.sale_price,
  stock: data.stock,
  min_stock: data.min_stock,
  barcode: data.barcode,
  status: data.status,
  min_margin: data.min_margin,
  created_at: data.created_at?.toDate() ?? new Date(),
  updated_at: data.updated_at?.toDate() ?? new Date(),
});

export const productService = {
  async getAll(store_id: string): Promise<Product[]> {
    const q = query(
      col,
      where("store_id", "==", store_id),
      where("status", "==", "active"),
      orderBy("name"),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => fromFirestore(d.id, d.data()));
  },

  async getById(id: string): Promise<Product | null> {
    const snap = await getDoc(doc(db, "products", id));
    if (!snap.exists()) return null;
    return fromFirestore(snap.id, snap.data());
  },

  async create(store_id: string, input: CreateProductInput): Promise<Product> {
    const ref = await addDoc(col, {
      ...input,
      store_id,
      status: "active",
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    return (await this.getById(ref.id))!;
  },

  async update(id: string, input: UpdateProductInput, changed_by: string): Promise<void> {
    const current = await this.getById(id);

    await updateDoc(doc(db, "products", id), {
      ...input,
      updated_at: serverTimestamp(),
    });

    if (!current) return;

    const cost_changed =
      input.cost_price !== undefined && input.cost_price !== current.cost_price;
    const sale_changed =
      input.sale_price !== undefined && input.sale_price !== current.sale_price;

    if (cost_changed || sale_changed) {
      await priceHistoryService.create({
        product_id: id,
        store_id: current.store_id,
        old_cost_price: current.cost_price,
        new_cost_price: input.cost_price ?? current.cost_price,
        old_sale_price: current.sale_price,
        new_sale_price: input.sale_price ?? current.sale_price,
        changed_by,
      });
    }
  },

  async updateStock(id: string, delta: number): Promise<void> {
    await updateDoc(doc(db, "products", id), {
      stock: increment(delta),
      updated_at: serverTimestamp(),
    });
  },

  async archive(id: string): Promise<void> {
    await updateDoc(doc(db, "products", id), {
      status: "archived",
      updated_at: serverTimestamp(),
    });
  },
};
