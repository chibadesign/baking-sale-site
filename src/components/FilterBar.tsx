import React from "react";
import { FilterState, Category } from "../types";

interface Props {
  filter: FilterState;
  onChange: (f: FilterState) => void;
  totalCount: number;
  filteredCount: number;
}

const CATEGORIES: Category[] = ["すべて","調理・製造道具","キッチン家電","製菓型・天板","デコレーション用品","製菓材料","その他"];
const DISCOUNT_OPTIONS = [{label:"すべて",value:0},{label:"10%以上",value:10},{label:"20%以上",value:20},{label:"30%以上",value:30},{label:"50%以上",value:50}];
const PRICE_OPTIONS = [{label:"上限なし",value:null},{label:"¥1,000以下",value:1000},{label:"¥3,000以下",value:3000},{label:"¥5,000以下",value:5000},{label:"¥10,000以下",value:10000}];
const SORT_OPTIONS = [{label:"割引率が高い順",value:"discount"},{label:"価格が安い順",value:"price_asc"},{label:"価格が高い順",value:"price_desc"}];

export const FilterBar: React.FC<Props> = ({ filter, onChange, totalCount, filteredCount }) => {
  const set = (p: Partial<FilterState>) => onChange({ ...filter, ...p });

  return (
    <aside className="bg-white rounded-2xl shadow p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">フィルター</span>
        <span className="text-xs text-gray-500 bg-[#F5DED8] px-2 py-1 rounded-full">{filteredCount}/{totalCount}件</span>
      </div>

      <section>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">カテゴリ</p>
        <div className="flex flex-col gap-1">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => set({ category: cat })}
              className={`text-left text-sm px-3 py-2 rounded-lg transition-colors duration-150 ${filter.category === cat ? "bg-[#FFDBC9] text-[#31100C] font-semibold" : "text-gray-700 hover:bg-[#F5DED8]"}`}>
              {cat}
            </button>
          ))}
        </div>
      </section>

      <hr className="border-[#D8C2BC]" />

      <section>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">割引率</p>
        <div className="flex flex-wrap gap-2">
          {DISCOUNT_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => set({ minDiscount: opt.value })}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors duration-150 ${filter.minDiscount === opt.value ? "bg-[#8B4513] text-white border-[#8B4513]" : "border-[#D8C2BC] text-gray-600 hover:bg-[#F5DED8]"}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      <hr className="border-[#D8C2BC]" />

      <section>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">価格</p>
        <select value={filter.maxPrice ?? ""} onChange={e => set({ maxPrice: e.target.value === "" ? null : Number(e.target.value) })}
          className="w-full text-sm border border-[#D8C2BC] rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8B4513]">
          {PRICE_OPTIONS.map(opt => <option key={opt.label} value={opt.value ?? ""}>{opt.label}</option>)}
        </select>
      </section>

      <hr className="border-[#D8C2BC]" />

      <section>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">並び替え</p>
        <select value={filter.sortBy} onChange={e => set({ sortBy: e.target.value as FilterState["sortBy"] })}
          className="w-full text-sm border border-[#D8C2BC] rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#8B4513]">
          {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      </section>

      <button onClick={() => onChange({ category: "すべて", minDiscount: 0, maxPrice: null, sortBy: "discount" })}
        className="w-full text-sm text-[#8B4513] border border-[#8B4513] rounded-full py-2 hover:bg-[#FFDBC9] transition-colors duration-150">
        リセット
      </button>
    </aside>
  );
};
