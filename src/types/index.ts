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
  rating: number | null;
  reviewCount: number | null;
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
  | "クッキングシート・消耗品"
  | "ラッピング・梱包"
  | "保存容器"
  | "ウェア・小物"
  | "その他製菓用品";

export interface FilterState {
  category: Category;
  minDiscount: number;
  maxPrice: number | null;
  sortBy: "discount" | "price_asc" | "price_desc";
}
