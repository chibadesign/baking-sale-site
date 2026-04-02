export interface SaleItem {
  asin: string;
  title: string;
  brand: string | null;
  imageUrl: string | null;
  price: number | null;
  originalPrice: number | null;
  discountPercent: number | null;
  detailPageUrl: string;
  category: string;
  features: string[];
}

export interface SaleData {
  items: SaleItem[];
  cachedAt: number;
  nextUpdate: number;
  fromCache: boolean;
  isMock?: boolean;
}

export type Category =
  | "すべて"
  | "調理・製造道具"
  | "キッチン家電"
  | "製菓型・天板"
  | "デコレーション用品"
  | "製菓材料"
  | "その他";

export interface FilterState {
  category: Category;
  minDiscount: number;
  maxPrice: number | null;
  sortBy: "discount" | "price_asc" | "price_desc";
}
