export type product_unit = "unit" | "kg" | "l";
export type product_status = "active" | "archived";

export interface Store {
  id: string;
  name: string;
  owner_id: string;
  currency: string;
  created_at: Date;
}

export interface Category {
  id: string;
  store_id: string;
  name: string;
  icon: string;
  order: number;
  created_at: Date;
}

export interface Product {
  id: string;
  store_id: string;
  category_id: string;
  name: string;
  unit: product_unit;
  cost_price: number;
  sale_price: number;
  stock: number;
  min_stock: number;
  barcode?: string;
  status: product_status;
  created_at: Date;
  updated_at: Date;
}

export interface ProductWithMeta extends Product {
  category: Category;
  margin: number;
  margin_amount: number;
  is_low_stock: boolean;
}

export type CreateProductInput = Omit<
  Product,
  "id" | "store_id" | "status" | "created_at" | "updated_at"
>;

export type UpdateProductInput = Partial<CreateProductInput>;
