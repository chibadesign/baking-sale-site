import React, { useState } from "react";
import { Header } from "./components/Header";
import { FilterBar } from "./components/FilterBar";
import { ProductCard } from "./components/ProductCard";
import { SkeletonGrid, MobileFilterDrawer } from "./components/UI";
import { ArticleContent } from "./components/ArticleContent";
import { useSaleData, useFilteredItems } from "./hooks/useSaleData";
import { FilterState } from "./types";

const DEFAULT_FILTER: FilterState = {
  category: "すべて",
  minDiscount: 0,
  maxPrice: null,
  sortBy: "discount",
};

export default function App() {
  const { data, loading, error, refetch } = useSaleData();
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const allItems = data?.items ?? [];
  const filteredItems = useFilteredItems(allItems, filter);
  const hasActiveFilter =
    filter.category !== "すべて" || filter.minDiscount > 0 || filter.maxPrice !== null;
  const maxDiscount = allItems.length > 0
    ? Math.max(...allItems.map(i => i.discountPercent ?? 0))
    : 0;

  return (
    <div className="min-h-screen bg-[#FFF8F6] font-sans">
      <Header
        cachedAt={data?.cachedAt ?? null}
        nextUpdate={data?.nextUpdate ?? null}
        isMock={data?.isMock}
        onRefresh={refetch}
        loading={loading}
      />

      {/* Hero */}
      <div className="bg-[#FF8C00] text-white py-10 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-widest text-orange-200 uppercase mb-2">
            2026年最新版 · 毎時自動更新
          </p>
          <h1 className="text-2xl sm:text-4xl font-bold leading-tight mb-3">
            ベーキングセール 最安値ランキング
          </h1>
          <p className="text-sm sm:text-base text-white/80 max-w-xl mx-auto mb-6">
            お菓子作り道具・製菓材料のAmazonセールをリアルタイム収集。<br className="hidden sm:block" />
            「ベーキング セール」「お菓子材料 安い」を今すぐ比較できます。
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <div className="inline-flex items-center gap-3 bg-white/15 border border-white/30 rounded-2xl px-5 py-3">
              <span className="text-2xl">🏆</span>
              <div className="text-left">
                <p className="text-xs text-white/70">本日の最高割引率</p>
                <p className="text-xl font-bold">
                  {maxDiscount > 0 ? `最大 ${maxDiscount}% OFF` : "取得中..."}
                </p>
              </div>
            </div>
            <div className="inline-flex items-center gap-3 bg-white/15 border border-white/30 rounded-2xl px-5 py-3">
              <span className="text-2xl">📦</span>
              <div className="text-left">
                <p className="text-xs text-white/70">本日のセール件数</p>
                <p className="text-xl font-bold">{allItems.length}件</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && !loading && (
          <div className="mb-4 bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {/* 導入文 */}
        <section className="mb-8 bg-white rounded-2xl shadow p-6 border-l-4 border-[#FF8C00]">
          <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span>📢</span> 今日の結論：どこが一番安いか
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            <strong className="text-[#FF8C00]">今日Amazonで最もお得なのは製菓型・天板カテゴリ</strong>です。
            シリコン型・タルト型が30〜35%OFFと高割引率が続いており、まとめ買いのチャンスです。
            キッチン家電（ハンドミキサー・ホームベーカリー）も25〜34%OFFのセールが複数出ています。
            在庫は変動が激しいため、<strong>気になる商品は早めに確認</strong>することを強くおすすめします。
          </p>
        </section>

        {/* 商品一覧 */}
        <div className="flex gap-6">
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="sticky top-4">
              <FilterBar
                filter={filter}
                onChange={setFilter}
                totalCount={allItems.length}
                filteredCount={filteredItems.length}
              />
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <span className="bg-[#FF8C00] text-white text-xs px-2 py-0.5 rounded-full">LIVE</span>
                セールランキング TOP{filteredItems.length}
              </h2>
              <div className="lg:hidden flex items-center gap-2">
                <p className="text-sm text-gray-600"><span className="font-semibold">{filteredItems.length}</span>件</p>
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="flex items-center gap-1.5 border border-[#85736E] text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium hover:bg-[#F5DED8] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                  </svg>
                  絞り込み
                  {hasActiveFilter && <span className="bg-[#FF8C00] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">!</span>}
                </button>
              </div>
              <p className="hidden lg:block text-sm text-gray-500">
                <span className="font-semibold text-gray-800">{filteredItems.length}</span>件のセール商品
              </p>
            </div>

            {loading ? (
              <SkeletonGrid />
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="text-6xl mb-4">🔍</span>
                <h2 className="text-lg font-semibold text-gray-700 mb-2">該当する商品が見つかりません</h2>
                <p className="text-sm text-gray-500 mb-6">フィルター条件を変更してみてください</p>
                <button onClick={() => setFilter(DEFAULT_FILTER)} className="bg-[#FF8C00] text-white px-6 py-2.5 rounded-full text-sm font-medium">
                  フィルターをリセット
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {filteredItems.map((item, index) => (
                  <ProductCard key={item.asin} item={item} rank={index + 1} />
                ))}
              </div>
            )}
          </div>
        </div>

        <ArticleContent items={allItems} />
      </main>

      <footer className="border-t border-[#F5DED8] mt-12 py-8 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs text-gray-500 leading-relaxed">
            当サイトはAmazon.co.jpを宣伝しリンクすることによってサイトが紹介料を獲得できる手段を提供することを目的に設定されたアフィリエイトプログラムである、Amazonアソシエイト・プログラムの参加者です。
          </p>
          <p className="text-xs text-gray-400 mt-2">
            価格・在庫状況は変動します。購入前に必ずAmazonでご確認ください。商品情報は{new Date().toLocaleDateString("ja-JP")}時点のものです。
          </p>
        </div>
      </footer>

      <MobileFilterDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filter={filter}
        onChange={setFilter}
        totalCount={allItems.length}
        filteredCount={filteredItems.length}
      />
    </div>
  );
}
