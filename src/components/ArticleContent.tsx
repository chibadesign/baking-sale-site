import React, { useState } from "react";
import { SaleItem } from "../types";

interface Props {
  items: SaleItem[];
}

const BUYING_GUIDE = [
  {
    icon: "🎯",
    title: "目的を決める",
    body: "「型を増やしたい」「計量を正確にしたい」など目的を絞ると選びやすい。初心者はまずシリコン型と計量スケールを揃えるのが正解。",
  },
  {
    icon: "💰",
    title: "割引率より元値を確認",
    body: "「50%OFF」でも元値が高ければ損することがある。元値と割引後価格を必ず両方確認すること。",
  },
  {
    icon: "⭐",
    title: "レビュー件数を見る",
    body: "レビューが100件以上あり、評価4.0以上なら安心して買える目安。レビューが極端に少ない商品はセールでも避けた方が無難。",
  },
  {
    icon: "📦",
    title: "まとめ買いで節約",
    body: "製菓材料（薄力粉・砂糖など）はまとめ買いで1個あたりのコストを下げられる。賞味期限を確認してから購入すること。",
  },
];

const CAUTIONS = [
  {
    icon: "⚡",
    title: "在庫切れに注意",
    desc: "人気セール商品は数時間で売り切れることがある。「気になったら即確認」が鉄則。",
  },
  {
    icon: "📈",
    title: "価格変動に注意",
    desc: "Amazonの価格は1日に何度も変動する。本サイトの価格は参考値。必ずAmazonで最終確認してから購入すること。",
  },
  {
    icon: "🔍",
    title: "類似品・粗悪品に注意",
    desc: "セール価格が安すぎる場合は品質に問題がある可能性がある。有名ブランド（貝印・OXO・タニタ等）を優先するのが安全。",
  },
  {
    icon: "📅",
    title: "タイムセールの時間を確認",
    desc: "Amazonのタイムセールは時間限定のことがある。終了時刻を必ず確認してから購入すること。",
  },
];

export const ArticleContent: React.FC<Props> = ({ items }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const top5 = [...items]
    .sort((a, b) => (b.discountPercent ?? 0) - (a.discountPercent ?? 0))
    .slice(0, 5);

  const fmt = (p: number) => `¥${p.toLocaleString("ja-JP")}`;

  const faqs = [
    {
      q: "ベーキングセールはいつが一番安いですか？",
      a: "Amazonのタイムセール祭り・プライムデー・ブラックフライデーが年間で最も割引率が高くなります。通常でも毎時セール情報を更新しているため、本サイトをブックマークしておくのがおすすめです。",
    },
    {
      q: "お菓子材料を安く買うコツは？",
      a: "①まとめ買いで単価を下げる ②Amazonの定期おトク便を使う ③セール時にまとめて購入する、の3つが効果的です。薄力粉・砂糖・バターなどの消耗品はセール時のまとめ買いが最もお得です。",
    },
    {
      q: "製菓道具はどこで買うのが最安ですか？",
      a: "Amazonのセール時が最安になることが多いです。特にタイムセール期間中は定価の20〜50%OFFになる商品が多く出ます。本サイトで割引率の高い順に並び替えて探すのが効率的です。",
    },
    {
      q: "初心者が最初に買うべき製菓道具は？",
      a: "①デジタルスケール（計量の精度が仕上がりを左右する） ②シリコンスパチュラ ③シリコン型 の3点がまず揃えるべき基本セットです。どれもセール時に1,000〜3,000円で揃えられます。",
    },
  ];

  return (
    <div className="mt-12 space-y-10 max-w-4xl mx-auto">

      {/* ② ランキング表 */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 mb-1 flex items-center gap-2">
          <span className="text-2xl">🏆</span>
          セールランキング TOP{top5.length}（割引率順）
        </h2>
        <p className="text-sm text-gray-500 mb-4">価格の安さ・入手しやすさ・割引率で総合評価</p>

        {top5.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl shadow">
            <table className="w-full text-sm bg-white">
              <thead>
                <tr className="bg-[#8B4513] text-white">
                  <th className="px-3 py-3 text-left w-12">順位</th>
                  <th className="px-3 py-3 text-left">商品名</th>
                  <th className="px-3 py-3 text-center w-20">割引率</th>
                  <th className="px-3 py-3 text-right w-24">セール価格</th>
                  <th className="px-3 py-3 text-center w-20 hidden sm:table-cell">カテゴリ</th>
                </tr>
              </thead>
              <tbody>
                {top5.map((item, i) => (
                  <tr key={item.asin} className={`border-b border-[#F5DED8] ${i % 2 === 0 ? "bg-white" : "bg-[#FFF8F6]"}`}>
                    <td className="px-3 py-3 text-center font-bold">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}位`}
                    </td>
                    <td className="px-3 py-3">
                      <a
                        href={item.detailPageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#8B4513] hover:underline font-medium line-clamp-2 leading-snug"
                      >
                        {item.title}
                      </a>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="bg-red-100 text-red-700 font-bold text-xs px-2 py-1 rounded-full">
                        -{item.discountPercent}%
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-[#8B4513]">
                      {item.price !== null ? fmt(item.price) : "—"}
                    </td>
                    <td className="px-3 py-3 text-center hidden sm:table-cell">
                      <span className="text-xs text-gray-500">{item.category}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-400">
            セール情報を取得中です...
          </div>
        )}
      </section>

      {/* ③ 各商品の詳細解説 */}
      {top5.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-1 flex items-center gap-2">
            <span className="text-2xl">🔍</span>
            各セール商品の詳細解説
          </h2>
          <p className="text-sm text-gray-500 mb-4">メリット・デメリット・おすすめ度を正直にレビュー</p>
          <div className="space-y-4">
            {top5.map((item, i) => (
              <div key={item.asin} className="bg-white rounded-2xl shadow p-5">
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl flex-shrink-0">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800 text-sm leading-snug mb-1">
                      {item.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                      {item.price !== null && (
                        <span className="text-lg font-bold text-[#8B4513]">{fmt(item.price)}</span>
                      )}
                      {item.originalPrice !== null && (
                        <span className="text-xs text-gray-400 line-through">{fmt(item.originalPrice)}</span>
                      )}
                      <span className="bg-red-100 text-red-700 font-bold text-xs px-2 py-0.5 rounded-full">
                        -{item.discountPercent}% OFF
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 mb-4">
                  <div className="bg-green-50 rounded-xl p-3">
                    <p className="text-xs font-bold text-green-700 mb-1.5">✅ メリット</p>
                    <ul className="text-xs text-green-800 space-y-1">
                      <li>・割引率{item.discountPercent}%と高めのセール対象</li>
                      {item.features.slice(0, 2).map((f, fi) => (
                        <li key={fi}>・{f}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-3">
                    <p className="text-xs font-bold text-orange-700 mb-1.5">⚠️ デメリット</p>
                    <ul className="text-xs text-orange-800 space-y-1">
                      <li>・在庫に限りがある場合がある</li>
                      <li>・価格は変動するため購入前に要確認</li>
                      <li>・セール終了時期は不明</li>
                    </ul>
                  </div>
                </div>

                <a
                  href={item.detailPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center bg-[#8B4513] text-white font-bold py-2.5 rounded-full text-sm hover:bg-[#7a3b10] transition-colors"
                >
                  Amazonで最安値を確認する →
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ④ おすすめ商品カテゴリ別 */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 mb-1 flex items-center gap-2">
          <span className="text-2xl">🎁</span>
          カテゴリ別おすすめ商品
        </h2>
        <p className="text-sm text-gray-500 mb-4">用途別に最適な選択肢を提示します</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            {
              icon: "🔧",
              title: "調理・製造道具",
              who: "精度を上げたい人に",
              rec: "デジタルスケールとシリコンスパチュラのセットが最もコスパが高い。まず揃えるべき2アイテム。",
              tag: "初心者向け",
            },
            {
              icon: "⚡",
              title: "キッチン家電",
              who: "作業を効率化したい人に",
              rec: "ハンドミキサーは1台あると作れるものの幅が格段に広がる。セール時なら3,000円以下で入手可能。",
              tag: "中級者向け",
            },
            {
              icon: "🎂",
              title: "製菓型・天板",
              who: "種類を増やしたい人に",
              rec: "シリコン型は洗いやすく初心者に最適。まとめ買いでも場所を取らないため、セール時に複数購入がおすすめ。",
              tag: "初心者向け",
            },
            {
              icon: "🎨",
              title: "デコレーション用品",
              who: "見た目をきれいにしたい人に",
              rec: "絞り袋セットは一度買えば長く使える。口金の種類が多いセット品がコスパ◎。",
              tag: "中級者向け",
            },
          ].map((cat) => (
            <div key={cat.title} className="bg-white rounded-2xl shadow p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{cat.icon}</span>
                <div>
                  <h3 className="font-bold text-gray-800 text-sm">{cat.title}</h3>
                  <span className="text-xs text-[#8B4513] font-medium">{cat.who}</span>
                </div>
                <span className="ml-auto text-xs bg-[#FFDBC9] text-[#8B4513] px-2 py-0.5 rounded-full font-medium">
                  {cat.tag}
                </span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{cat.rec}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ⑤ 失敗しない選び方 */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 mb-1 flex items-center gap-2">
          <span className="text-2xl">📚</span>
          失敗しない選び方（初心者向け）
        </h2>
        <p className="text-sm text-gray-500 mb-4">これを知っておけばセールで損しない</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {BUYING_GUIDE.map((g) => (
            <div key={g.title} className="bg-white rounded-2xl shadow p-5 flex gap-3">
              <span className="text-2xl flex-shrink-0">{g.icon}</span>
              <div>
                <h3 className="font-bold text-gray-800 text-sm mb-1">{g.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{g.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ⑥ 注意点 */}
      <section className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
        <h2 className="text-base font-bold text-amber-800 mb-4 flex items-center gap-2">
          <span>⚠️</span> セール購入前に必ず確認すること
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {CAUTIONS.map((c) => (
            <div key={c.title} className="flex gap-3">
              <span className="text-xl flex-shrink-0">{c.icon}</span>
              <div>
                <p className="font-bold text-amber-900 text-sm mb-0.5">{c.title}</p>
                <p className="text-xs text-amber-800 leading-relaxed">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ（SEO対策） */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-2xl">❓</span>
          よくある質問
        </h2>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white rounded-2xl shadow overflow-hidden">
              <button
                className="w-full text-left px-5 py-4 flex items-center justify-between gap-3"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span className="text-sm font-semibold text-gray-800">{faq.q}</span>
                <svg
                  className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-[#F5DED8] pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ⑦ まとめ */}
      <section className="bg-[#8B4513] text-white rounded-2xl p-6">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <span>🎯</span> まとめ：今買うべき結論
        </h2>
        <div className="space-y-2 text-sm text-white/90 leading-relaxed mb-5">
          <p>✅ <strong>製菓型・天板</strong>は今が買い時。30〜35%OFFのセールが継続中。</p>
          <p>✅ <strong>キッチン家電</strong>（ハンドミキサー等）も25%以上OFF多数。初めての一台に最適。</p>
          <p>✅ <strong>調理道具</strong>（スケール・スパチュラ）はセットで揃えると効率的でコスパ◎。</p>
          <p>⚡ セール価格は変動する。気になる商品は<strong>今すぐ確認</strong>が正解。</p>
        </div>
        <a
          href="#top"
          onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          className="inline-block bg-white text-[#8B4513] font-bold px-6 py-3 rounded-full text-sm hover:bg-orange-50 transition-colors"
        >
          ↑ セール商品一覧に戻る
        </a>
      </section>
    </div>
  );
};
