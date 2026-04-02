import React, { useState } from "react";
import { SaleItem } from "../types";

interface Props { item: SaleItem; rank?: number; }

declare global {
  interface Window {
    trackAmazonClick?: (itemName: string, position: string) => void;
  }
}

const categoryColors: Record<string, string> = {
  "調理・製造道具": "bg-amber-50 text-amber-700 border-amber-200",
  "キッチン家電": "bg-blue-50 text-blue-700 border-blue-200",
  "製菓型・天板": "bg-pink-50 text-pink-700 border-pink-200",
  "デコレーション用品": "bg-purple-50 text-purple-700 border-purple-200",
  "製菓材料": "bg-green-50 text-green-700 border-green-200",
  "クッキングシート・消耗品": "bg-yellow-50 text-yellow-700 border-yellow-200",
  "ラッピング・梱包": "bg-rose-50 text-rose-700 border-rose-200",
  "保存容器": "bg-cyan-50 text-cyan-700 border-cyan-200",
  "ウェア・小物": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "その他製菓用品": "bg-gray-50 text-gray-600 border-gray-200",
};

const rankEmoji = (r: number) => r === 1 ? "🥇" : r === 2 ? "🥈" : r === 3 ? "🥉" : null;

export const ProductCard: React.FC<Props> = ({ item, rank }) => {
  const [imgError, setImgError] = useState(false);
  const fmt = (p: number) => `¥${p.toLocaleString("ja-JP")}`;
  const chip = categoryColors[item.category] || categoryColors["その他製菓用品"];
  const emoji = rank ? rankEmoji(rank) : null;

  return (
    <article className="bg-white rounded-xl border border-gray-200 hover:border-orange-400 hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden group">
      <div className="relative bg-gray-50 aspect-square overflow-hidden">
        {emoji && (
          <div className="absolute top-2 left-2 z-10 text-2xl leading-none">{emoji}</div>
        )}
        {!emoji && rank && rank <= 10 && (
          <div className="absolute top-2 left-2 z-10 bg-gray-800 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {rank}
          </div>
        )}
        {item.imageUrl && !imgError ? (
          <img src={item.imageUrl} alt={item.title}
            className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)} loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🧁</div>
        )}
        {item.discountPercent && item.discountPercent > 0 && (
          <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold rounded-lg px-2 py-1 shadow">
            -{item.discountPercent}%
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-3 gap-2">
        <span className={`text-xs font-medium px-2 py-0.5 rounded border w-fit ${chip}`}>
          {item.category}
        </span>
        <h3 className="text-sm font-bold text-gray-800 line-clamp-3 leading-snug">{item.title}</h3>
        {item.brand && <p className="text-xs text-gray-400">{item.brand}</p>}
        <div className="flex-1" />
        <div className="mt-1">
          {item.price !== null && (
            <p className="text-2xl font-bold text-orange-500">{fmt(item.price)}</p>
          )}
          <div className="flex items-center gap-2 mt-0.5">
            {item.originalPrice !== null && (
              <p className="text-xs text-gray-400 line-through">{fmt(item.originalPrice)}</p>
            )}
            {item.price !== null && item.originalPrice !== null && (
              <p className="text-xs text-red-500 font-bold">{fmt(item.originalPrice - item.price)} OFF</p>
            )}
          </div>
        </div>
        {item.rating !== null && (
          <div className="flex items-center gap-1.5">
            <div className="flex text-orange-400 text-xs">
              {[1,2,3,4,5].map(s => (
                <span key={s}>{s <= Math.round(item.rating!) ? "★" : "☆"}</span>
              ))}
            </div>
            <span className="text-xs text-gray-600 font-medium">{item.rating}</span>
            {item.reviewCount !== null && (
              <a href={item.detailPageUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs text-orange-500 hover:underline">
                ({item.reviewCount.toLocaleString("ja-JP")}件)
              </a>
            )}
          </div>
        )}
        <a href={item.detailPageUrl} target="_blank" rel="noopener noreferrer"
          onClick={() => { window.trackAmazonClick?.(item.title, rank ? `ランキング${rank}位` : ""); }}
          className="mt-2 block w-full text-center bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-lg text-sm transition-all duration-150">
          Amazonで確認する
        </a>
      </div>
    </article>
  );
};
