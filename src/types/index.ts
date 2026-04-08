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

export type CreateCategoryInput = Pick<Category, "name" | "icon">;

export type CreateProductInput = Omit<
  Product,
  "id" | "store_id" | "status" | "created_at" | "updated_at"
>;

export type UpdateProductInput = Partial<CreateProductInput>;

export type CreatePriceHistoryInput = Omit<PriceHistory, "id" | "changed_at">;

export type UpdateStoreInput = Partial<Pick<Store, "name" | "currency" | "default_min_margin">>;
