import React, { useState } from "react";
import { SaleItem } from "../types";

interface Props { item: SaleItem; rank?: number; }

declare global {
  interface Window {
    trackAmazonClick?: (itemName: string, position: string) => void;
  }
}

const categoryColors: Record<string, string> = {
  "調理・製造道具": "bg-amber-100 text-amber-800",
  "キッチン家電": "bg-blue-100 text-blue-800",
  "製菓型・天板": "bg-pink-100 text-pink-800",
  "デコレーション用品": "bg-purple-100 text-purple-800",
  "製菓材料": "bg-green-100 text-green-800",
  "クッキングシート・消耗品": "bg-yellow-100 text-yellow-800",
  "ラッピング・梱包": "bg-rose-100 text-rose-800",
  "保存容器": "bg-cyan-100 text-cyan-800",
  "ウェア・小物": "bg-indigo-100 text-indigo-800",
  "調理・製菓道具": "bg-amber-100 text-amber-800",
  "製菓用品": "bg-pink-100 text-pink-800",
  "耐熱皿・焼き型": "bg-orange-100 text-orange-800",
  "製菓・製パン材料": "bg-green-100 text-green-800",
  "ベーキングツール・アクセサリ": "bg-purple-100 text-purple-800",
  "その他製菓用品": "bg-gray-100 text-gray-700",
};

const rankEmoji = (r: number) => r === 1 ? "🥇" : r === 2 ? "🥈" : r === 3 ? "🥉" : null;

export const ProductCard: React.FC<Props> = ({ item, rank }) => {
  const [imgError, setImgError] = useState(false);
  const fmt = (p: number) => `¥${p.toLocaleString("ja-JP")}`;
  const chip = categoryColors[item.category] || categoryColors["その他製菓用品"];
  const emoji = rank ? rankEmoji(rank) : null;

  return (
    <article className="bg-white rounded-2xl shadow hover:shadow-lg transition-shadow duration-200 flex flex-col overflow-hidden group relative">
      {emoji && (
        <div className="absolute top-2 left-2 z-10 text-xl leading-none">{emoji}</div>
      )}
      {!emoji && rank && rank <= 10 && (
        <div className="absolute top-2 left-2 z-10 bg-gray-800 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
          {rank}
        </div>
      )}

      <div className="relative bg-[#FFF3E0] aspect-square overflow-hidden">
        {item.imageUrl && !imgError ? (
          <img src={item.imageUrl} alt={item.title}
            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)} loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🧁</div>
        )}
        {item.discountPercent && item.discountPercent > 0 && (
          <div className="absolute top-2 right-2 bg-[#D84315] text-white text-xs font-bold rounded-full px-2.5 py-1 shadow">
            -{item.discountPercent}%
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-4 gap-2">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-fit ${chip}`}>
          {item.category}
        </span>
        <h3 className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug">{item.title}</h3>
        {item.brand && <p className="text-xs text-gray-400">{item.brand}</p>}
        <div className="flex-1" />
        <div className="mt-1">
          {item.price !== null && (
            <p className="text-xl font-bold text-[#D84315]">{fmt(item.price)}</p>
          )}
          {item.originalPrice !== null && (
            <p className="text-xs text-gray-400 line-through">{fmt(item.originalPrice)}</p>
          )}
          {item.price !== null && item.originalPrice !== null && (
            <p className="text-xs text-red-600 font-medium">{fmt(item.originalPrice - item.price)} OFF</p>
          )}
        </div>

        {item.rating !== null && (
          <div className="flex items-center gap-1.5 mt-1">
            <div className="flex text-[#E67300] text-xs">
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s}>{s <= Math.round(item.rating!) ? "★" : "☆"}</span>
              ))}
            </div>
            <span className="text-xs text-gray-500 font-medium">{item.rating}</span>
            {item.reviewCount !== null && (
              <a href={item.detailPageUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs text-[#D84315] hover:underline">
                （{item.reviewCount.toLocaleString("ja-JP")}件）
              </a>
            )}
          </div>
        )}

        <a href={item.detailPageUrl} target="_blank" rel="noopener noreferrer"
          onClick={() => { window.trackAmazonClick?.(item.title, rank ? `ランキング${rank}位` : ""); }}
          className="mt-3 block w-full text-center bg-[#D84315] hover:bg-[#E67300] text-white font-bold py-2.5 rounded-full text-sm active:scale-95 transition-all duration-150 shadow">
          Amazonで確認する
        </a>
      </div>
    </article>
  );
};
