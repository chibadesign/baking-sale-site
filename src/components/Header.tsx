import React from "react";

interface Props {
  cachedAt: number | null;
  nextUpdate: number | null;
  isMock?: boolean;
  onRefresh: () => void;
  loading: boolean;
}

export const Header: React.FC<Props> = ({ cachedAt, nextUpdate, isMock, onRefresh, loading }) => {
  const today = new Date().toLocaleDateString("ja-JP", { year:"numeric", month:"long", day:"numeric", weekday:"long" });
  const fmt = (ts: number) => new Date(ts).toLocaleTimeString("ja-JP", { hour:"2-digit", minute:"2-digit" });

  return (
    <header className="bg-[#D84315] text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🍰</span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold leading-tight">製菓道具 セール情報</h1>
              <p className="text-xs text-white/70 mt-0.5">Amazon タイムセール</p>
            </div>
          </div>
          <button onClick={onRefresh} disabled={loading}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 disabled:opacity-50 px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition-colors">
            <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden sm:inline">更新</span>
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pb-3 text-xs text-white/75">
          <span>📅 {today}</span>
          {cachedAt && <span>最終取得: {fmt(cachedAt)}</span>}
          {nextUpdate && <span>次回更新: {fmt(nextUpdate)}</span>}
          {isMock && (
            <span className="bg-yellow-400/30 text-yellow-100 px-2 py-0.5 rounded-full border border-yellow-300/30">
              ⚠ デモデータ表示中（PA-API未設定）
            </span>
          )}
        </div>
      </div>
    </header>
  );
};
