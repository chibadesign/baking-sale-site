import React, { useState } from "react";
import { Header } from "./components/Header";
import { ProductCard } from "./components/ProductCard";
import { SkeletonGrid, MobileFilterDrawer } from "./components/UI";
import { ArticleContent } from "./components/ArticleContent";
import { useSaleData, useFilteredItems } from "./hooks/useSaleData";
import { FilterState, Category } from "./types";

const DEFAULT_FILTER: FilterState = {
  category: "すべて",
  minDiscount: 0,
  maxPrice: null,
  sortBy: "discount",
};

const CATEGORIES: Category[] = [
  "すべて","調理・製造道具","キッチン家電","製菓型・天板",
  "デコレーション用品","製菓材料","クッキングシート・消耗品",
  "ラッピング・梱包","保存容器","ウェア・小物","その他製菓用品",
];

const SORT_OPTIONS = [
  { label: "割引率が高い順", value: "discount" as const },
  { label: "価格が安い順", value: "price_asc" as const },
  { label: "価格が高い順", value: "price_desc" as const },
];

const PRICE_OPTIONS = [
  { label: "上限なし", value: null },
  { label: "¥500以下", value: 500 },
  { label: "¥1,000以下", value: 1000 },
  { label: "¥3,000以下", value: 3000 },
  { label: "¥5,000以下", value: 5000 },
  { label: "¥10,000以下", value: 10000 },
];

const DISCOUNT_OPTIONS = [
  { label: "すべて", value: 0 },
  { label: "10%以上", value: 10 },
  { label: "20%以上", value: 20 },
  { label: "30%以上", value: 30 },
  { label: "50%以上", value: 50 },
];

export default function App() {
  const { data, loading, error, refetch } = useSaleData();
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const allItems = data?.items ?? [];
  const filteredItems = useFilteredItems(allItems, filter);
  const maxDiscount = allItems.length > 0
    ? Math.max(...allItems.map(i => i.discountPercent ?? 0))
    : 0;
  const set = (p: Partial<FilterState>) => setFilter(f => ({ ...f, ...p }));

  return (
    <div className="min-h-screen bg-[#F7F7F7] font-sans">
      <Header
        cachedAt={data?.cachedAt ?? null}
        nextUpdate={data?.nextUpdate ?? null}
        isMock={data?.isMock}
        onRefresh={refetch}
        loading={loading}
      />

      {/* ヒーロー */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                ベーキングセール <span className="text-[#FF8C00]">最安値ランキング</span>
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                製菓道具・お菓子材料のAmazonセールをリアルタイム比較
              </p>
            </div>
            <div className="flex gap-3">
              <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-2 text-center">
                <p className="text-xs text-gray-500">最高割引率</p>
                <p className="text-lg font-bold text-[#FF8C00]">最大{maxDiscount}%OFF</p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-2 text-center">
                <p className="text-xs text-gray-500">セール件数</p>
                <p className="text-lg font-bold text-[#FF8C00]">{allItems.length}件</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && !loading && (
          <div className="mb-4 bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* フィルターバー（上部） */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm">
          {/* カテゴリ */}
          <div className="flex flex-wrap gap-2 mb-3">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => set({ category: cat })}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-150 font-medium ${
                  filter.category === cat
                    ? "bg-[#FF8C00] text-white border-[#FF8C00]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[#FF8C00] hover:text-[#FF8C00]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* 割引・価格・並び替え */}
          <div className="flex flex-wrap items-center gap-3">
            {/* 割引率 */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 whitespace-nowrap">割引率：</span>
              <div className="flex gap-1">
                {DISCOUNT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => set({ minDiscount: opt.value })}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                      filter.minDiscount === opt.value
                        ? "bg-[#FF8C00] text-white border-[#FF8C00]"
                        : "bg-white text-gray-600 border-gray-200 hover:border-[#FF8C00]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 価格 */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 whitespace-nowrap">価格：</span>
              <select
                value={filter.maxPrice ?? ""}
                onChange={e => set({ maxPrice: e.target.value === "" ? null : Number(e.target.value) })}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-700 focus:outline-none focus:border-[#FF8C00]"
              >
                {PRICE_OPTIONS.map(opt => (
                  <option key={opt.label} value={opt.value ?? ""}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* 並び替え */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 whitespace-nowrap">並び替え：</span>
              <select
                value={filter.sortBy}
                onChange={e => set({ sortBy: e.target.value as FilterState["sortBy"] })}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-700 focus:outline-none focus:border-[#FF8C00]"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* 件数＋リセット */}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-gray-500">
                <span className="font-bold text-gray-800">{filteredItems.length}</span>件
              </span>
              <button
                onClick={() => setFilter(DEFAULT_FILTER)}
                className="text-xs text-gray-400 hover:text-[#FF8C00] transition-colors"
              >
                リセット
              </button>
            </div>
          </div>
        </div>

        {/* 商品グリッド */}
        {loading ? (
          <SkeletonGrid />
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-gray-200">
            <span className="text-5xl mb-4">🔍</span>
            <h2 className="te