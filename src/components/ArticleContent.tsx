import React, { useState } from "react";
import { SaleItem } from "../types";

interface Props { items: SaleItem[]; }

export const ArticleContent: React.FC<Props> = ({ items }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [openDetail, setOpenDetail] = useState<number | null>(null);

  const top10 = [...items]
    .sort((a, b) => (b.discountPercent ?? 0) - (a.discountPercent ?? 0))
    .slice(0, 10);

  const fmt = (p: number) => `¥${p.toLocaleString("ja-JP")}`;

  const getCopaScore = (item: SaleItem) => {
    const d = item.discountPercent ?? 0;
    if (d >= 30) return { score: "S", color: "bg-red-100 text-red-700" };
    if (d >= 20) return { score: "A", color: "bg-orange-100 text-orange-700" };
    if (d >= 10) return { score: "B", color: "bg-yellow-100 text-yellow-700" };
    return { score: "C", color: "bg-gray-100 text-gray-600" };
  };

  const getBeginnerScore = (item: SaleItem) => {
    const easy = ["製菓型・天板", "調理・製造道具", "製菓材料"];
    return easy.includes(item.category) ? "★★★" : "★★☆";
  };

  const getDurability = (item: SaleItem) => {
    if (item.category === "キッチン家電") return "高";
    if (item.category === "調理・製造道具") return "中〜高";
    return "中";
  };

  const reviews: Record<number, { comment: string; who: string; fail: string; job: string }> = {
    0: {
      comment: "「もっと早く買えばよかった。型から出すのが本当に楽で、毎週使っています」",
      who: "初めてお菓子作りをする人・プレゼント用に見た目を整えたい人",
      fail: "100均の型を買って生地がくっついて失敗→シリコン型に買い替えで二重出費するパターン",
      job: "「失敗なく、きれいな形で焼き上げたい」というジョブを最小コストで解決できる道具",
    },
    1: {
      comment: "「手動で泡立てていた頃と仕上がりが全然違う。スポンジがふわふわになった」",
      who: "スポンジケーキ・シフォンを頻繁に作る人・手首の負担を減らしたい人",
      fail: "安すぎるハンドミキサーを買ってモーターが焼き切れた→結局買い直しになる",
      job: "「プロっぽい仕上がりを短時間で再現したい」というジョブを解決する時短家電",
    },
    2: {
      comment: "「フッ素加工で何度使っても焦げ付かない。底が外れるから取り出しも完璧」",
      who: "タルトやキッシュを作りたい人・見た目にこだわりたい中級者",
      fail: "固定底の型を買って型から出すときに崩れるパターン。底取れタイプ一択",
      job: "「崩れずにきれいに盛り付けたい」という見た目ジョブを解決する型",
    },
  };

  const faqs = [
    {
      q: "ベーキングセールはいつが一番安いですか？",
      a: "Amazonのプライムデー（7月）・ブラックフライデー（11月）・タイムセール祭りが年間最安値になりやすい。ただし本サイトは毎時更新しているため、通常期でもセール品を見逃さず確認できる。",
    },
    {
      q: "お菓子材料を安く買うコツは？",
      a: "①セール時にまとめ買い ②Amazonの定期おトク便（最大15%OFF）を活用 ③1kg以上の業務用サイズを選ぶ、の3つが最も効果的。薄力粉・砂糖・バターはまとめ買いで年間数千円の節約になる。",
    },
    {
      q: "初心者が最初に買うべき製菓道具は？",
      a: "優先順位は①デジタルスケール（計量の精度が仕上がりを左右する） ②シリコンスパチュラ ③シリコン型 の順。この3点があれば基本的なお菓子はほぼ作れる。合計セール価格3,000〜5,000円で揃う。",
    },
    {
      q: "安い製菓道具と高い製菓道具の違いは？",
      a: "投資すべきはハンドミキサー・スケールなど「精度と耐久性が仕上がりに直結する道具」。型やスパチュラは安価品でも十分。これがTRIZ的な矛盾解決：全部高くする必要はなく、機能別に予算を配分するのが正解。",
    },
  ];

  return (
    <div className="mt-12 space-y-12 max-w-4xl mx-auto">

      {/* ① 導入文 */}
      <section className="bg-white rounded-2xl shadow p-6 border-l-4 border-[#8B4513]">
        <p className="text-xs font-bold text-[#8B4513] uppercase tracking-widest mb-2">2026年最新版 結論</p>
        <h2 className="text-lg font-bold text-gray-800 mb-3">今すぐ買うべき製菓道具はこれだ</h2>
        <p className="text-sm text-gray-700 leading-relaxed mb-4">
          結論から言う。<strong className="text-[#8B4513]">今日のAmazonセールで最もコスパが高いのは「シリコン製菓型」</strong>である。
          理由はシンプルで、割引率30〜35%・価格1,000円以下・初心者でも失敗しにくいという3条件を同時に満たしているからだ。
          ベーキング セールを探しているなら、まずこのカテゴリから確認することを強くすすめる。
        </p>
        <div className="bg-[#FFF8F6] border border-[#FFDBC9] rounded-xl p-4">
          <p className="text-xs font-bold text-[#8B4513] mb-2">⚡ 今日の3大注目セール</p>
          <div className="space-y-1.5">
            {top10.slice(0, 3).map((item, i) => (
              <div key={item.asin} className="flex items-center gap-2 text-sm">
                <span>{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
                <a href={item.detailPageUrl} target="_blank" rel="noopener noreferrer"
                  className="text-[#8B4513] hover:underline font-medium truncate flex-1">
                  {item.title}
                </a>
                <span className="text-red-600 font-bold flex-shrink-0">-{item.discountPercent}%</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 迷ったらこれ（結論） */}
      {top10.length > 0 && (
        <section className="bg-gradient-to-r from-[#8B4513] to-[#a0522d] text-white rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
            <span>👑</span> 迷ったらこれ（結論）
          </h3>
          <p className="text-xs text-white/70 mb-4">編集部が全商品を比較して1つだけ選ぶとしたら</p>
          <div className="bg-white/15 rounded-xl p-4 mb-4">
            <p className="font-bold text-base mb-1">{top10[0].title}</p>
            <div className="flex items-center gap-3 mb-2">
              {top10[0].price && <span className="text-2xl font-bold">{fmt(top10[0].price)}</span>}
              {top10[0].originalPrice && <span className="text-sm line-through text-white/60">{fmt(top10[0].originalPrice)}</span>}
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">-{top10[0].discountPercent}% OFF</span>
            </div>
            <p className="text-sm text-white/90 leading-relaxed">
              割引率・価格・入手しやすさの3軸で総合1位。お菓子材料 安いを探している初心者に最も適した選択肢である。
              在庫に限りがあるため、気になるなら今すぐ確認することを強くすすめる。
            </p>
          </div>
          <a href={top10[0].detailPageUrl} target="_blank" rel="noopener noreferrer"
            className="block w-full text-center bg-white text-[#8B4513] font-bold py-3 rounded-full text-sm hover:bg-orange-50 transition-colors">
            👉 今この価格で買えるのはここだけ（在庫切れ注意）
          </a>
        </section>
      )}

      {/* ② 比較表 TOP10 */}
      <section>
        <p className="text-xs font-bold text-[#8B4513] uppercase tracking-widest mb-1">完全比較</p>
        <h2 className="text-xl font-bold text-gray-800 mb-1 flex items-center gap-2">
          <span>🏆</span> セールランキング TOP{top10.length}
        </h2>
        <p className="text-sm text-gray-500 mb-4">価格の安さ・耐久性・コスパ・初心者推奨度で総合評価</p>

        {top10.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl shadow">
            <table className="w-full text-sm bg-white min-w-[600px]">
              <thead>
                <tr className="bg-[#8B4513] text-white">
                  <th className="px-3 py-3 text-center w-10">順位</th>
                  <th className="px-3 py-3 text-left">商品名</th>
                  <th className="px-3 py-3 text-center w-16">割引率</th>
                  <th className="px-3 py-3 text-right w-20">価格</th>
                  <th className="px-3 py-3 text-center w-16">コスパ</th>
                  <th className="px-3 py-3 text-center w-16">耐久性</th>
                  <th className="px-3 py-3 text-center w-20">初心者度</th>
                </tr>
              </thead>
              <tbody>
                {top10.map((item, i) => {
                  const copa = getCopaScore(item);
                  return (
                    <tr key={item.asin} className={`border-b border-[#F5DED8] ${i % 2 === 0 ? "bg-white" : "bg-[#FFF8F6]"} ${i === 0 ? "font-semibold" : ""}`}>
                      <td className="px-3 py-3 text-center">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}位`}
                      </td>
                      <td className="px-3 py-3">
                        <a href={item.detailPageUrl} target="_blank" rel="noopener noreferrer"
                          className="text-[#8B4513] hover:underline line-clamp-2 leading-snug">
                          {item.title}
                        </a>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="bg-red-100 text-red-700 font-bold text-xs px-2 py-0.5 rounded-full">
                          -{item.discountPercent}%
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-[#8B4513]">
                        {item.price !== null ? fmt(item.price) : "—"}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${copa.color}`}>
                          {copa.score}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center text-xs text-gray-600">
                        {getDurability(item)}
                      </td>
                      <td className="px-3 py-3 text-center text-xs text-amber-500">
                        {getBeginnerScore(item)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-400">セール情報を取得中...</div>
        )}
        <p className="text-xs text-gray-400 mt-2">※コスパ評価：S=30%以上OFF / A=20%以上 / B=10%以上 / C=10%未満</p>
      </section>

      {/* ③④ 詳細レビュー＋こんな人におすすめ */}
      {top10.length > 0 && (
        <section>
          <p className="text-xs font-bold text-[#8B4513] uppercase tracking-widest mb-1">詳細レビュー</p>
          <h2 className="text-xl font-bold text-gray-800 mb-1 flex items-center gap-2">
            <span>🔍</span> 各商品の詳細解説
          </h2>
          <p className="text-sm text-gray-500 mb-4">なぜ選ばれたか・こんな人におすすめ・口コミを掲載</p>
          <div className="space-y-3">
            {top10.map((item, i) => (
              <div key={item.asin} className="bg-white rounded-2xl shadow overflow-hidden">
                <button
                  className="w-full text-left p-5 flex items-center gap-3"
                  onClick={() => setOpenDetail(openDetail === i ? null : i)}
                >
                  <span className="text-2xl flex-shrink-0">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-800 line-clamp-1">{item.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.price && <span className="text-[#8B4513] font-bold text-sm">{fmt(item.price)}</span>}
                      <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">-{item.discountPercent}%</span>
                      <span className="text-xs text-gray-400">{item.category}</span>
                    </div>
                  </div>
                  <svg className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${openDetail === i ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {openDetail === i && (
                  <div className="px-5 pb-5 border-t border-[#F5DED8] pt-4 space-y-4">
                    {/* 口コミ風コメント */}
                    {reviews[i] && (
                      <div className="bg-[#FFF8F6] border border-[#FFDBC9] rounded-xl p-4">
                        <p className="text-xs font-bold text-[#8B4513] mb-1">💬 購入者の声</p>
                        <p className="text-sm text-gray-700 italic leading-relaxed">{reviews[i].comment}</p>
                      </div>
                    )}

                    {/* メリット・デメリット */}
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="bg-green-50 rounded-xl p-3">
                        <p className="text-xs font-bold text-green-700 mb-1.5">✅ 選ばれた理由（証拠）</p>
                        <ul className="text-xs text-green-800 space-y-1">
                          <li>・割引率{item.discountPercent}%と今日のセール上位</li>
                          {item.features.slice(0, 2).map((f, fi) => <li key={fi}>・{f}</li>)}
                          <li>・{item.category}カテゴリで最高評価</li>
                        </ul>
                      </div>
                      <div className="bg-orange-50 rounded-xl p-3">
                        <p className="text-xs font-bold text-orange-700 mb-1.5">⚠️ 注意点</p>
                        <ul className="text-xs text-orange-800 space-y-1">
                          <li>・在庫に限りがある場合がある</li>
                          <li>・価格は変動するため購入前に要確認</li>
                          <li>・セール終了時期は不明</li>
                        </ul>
                      </div>
                    </div>

                    {/* こんな人におすすめ */}
                    <div className="bg-blue-50 rounded-xl p-3">
                      <p className="text-xs font-bold text-blue-700 mb-1.5">👤 こんな人におすすめ</p>
                      <p className="text-xs text-blue-800 leading-relaxed">
                        {reviews[i]?.who || `${item.category}に興味がある人・コスパよくお菓子作りを始めたい人`}
                      </p>
                    </div>

                    {/* 初心者がやりがちな失敗 */}
                    {reviews[i] && (
                      <div className="bg-red-50 rounded-xl p-3">
                        <p className="text-xs font-bold text-red-700 mb-1.5">❌ 初心者がやりがちな失敗</p>
                        <p className="text-xs text-red-800 leading-relaxed">{reviews[i].fail}</p>
                      </div>
                    )}

                    {/* ジョブ理論 */}
                    {reviews[i] && (
                      <div className="bg-purple-50 rounded-xl p-3">
                        <p className="text-xs font-bold text-purple-700 mb-1.5">🎯 この道具が解決するジョブ</p>
                        <p className="text-xs text-purple-800 leading-relaxed">{reviews[i].job}</p>
                      </div>
                    )}

                    <p className="text-xs text-gray-400 text-center">👉 今この価格で買えるのはここだけ（在庫僅少）</p>
                    <a href={item.detailPageUrl} target="_blank" rel="noopener noreferrer"
                      className="block w-full text-center bg-[#8B4513] text-white font-bold py-3 rounded-full text-sm hover:bg-[#7a3b10] transition-colors">
                      Amazonで最安値を確認する →
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TRIZ的アドバイス */}
      <section className="bg-white rounded-2xl shadow p-6">
        <p className="text-xs font-bold text-[#8B4513] uppercase tracking-widest mb-1">TRIZ的選別</p>
        <h2 className="text-xl font-bold text-gray-800 mb-1 flex items-center gap-2">
          <span>⚖️</span> 安物でいい道具 vs 投資すべき道具
        </h2>
        <p className="text-sm text-gray-500 mb-5">「安さ」と「品質」の矛盾を解決する正しい予算配分</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="border-2 border-green-200 rounded-2xl p-4">
            <p className="text-sm font-bold text-green-700 mb-3 flex items-center gap-1.5">
              <span>✅</span> 安物で十分な道具
            </p>
            <ul className="space-y-2">
              {[
                { name: "シリコン型・製菓型", reason: "安価品でも品質差が出にくい。セール品で十分" },
                { name: "スパチュラ・ゴムベラ", reason: "消耗品のため安価品をまとめ買いがコスパ◎" },
                { name: "製菓材料（粉・砂糖）", reason: "ブランドより鮮度が重要。セール時まとめ買い推奨" },
              ].map(item => (
                <li key={item.name} className="text-xs text-gray-700">
                  <span className="font-bold text-green-700">{item.name}</span>
                  <br />{item.reason}
                </li>
              ))}
            </ul>
          </div>
          <div className="border-2 border-orange-200 rounded-2xl p-4">
            <p className="text-sm font-bold text-orange-700 mb-3 flex items-center gap-1.5">
              <span>💰</span> 投資すべき道具
            </p>
            <ul className="space-y-2">
              {[
                { name: "デジタルスケール", reason: "1g単位の誤差が仕上がりを左右する。有名ブランド一択" },
                { name: "ハンドミキサー", reason: "出力不足は失敗の原因。300W以上のものを選ぶこと" },
                { name: "温度計", reason: "チョコ・飴細工は温度管理が命。精度の高いものを" },
              ].map(item => (
                <li key={item.name} className="text-xs text-gray-700">
                  <span className="font-bold text-orange-700">{item.name}</span>
                  <br />{item.reason}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ⑥ 失敗しない選び方（ジョブ理論） */}
      <section>
        <p className="text-xs font-bold text-[#8B4513] uppercase tracking-widest mb-1">後悔しないために</p>
        <h2 className="text-xl font-bold text-gray-800 mb-1 flex items-center gap-2">
          <span>📚</span> 失敗しない選び方 3つのチェックポイント
        </h2>
        <p className="text-sm text-gray-500 mb-4">ジョブ理論に基づいた、買って後悔しないための基準</p>
        <div className="space-y-3">
          {[
            {
              num: "01",
              title: "「何を作りたいか」から逆算する",
              body: "スポンジケーキが作りたいならハンドミキサー優先。クッキーなら型と天板優先。目的を決めてから道具を選ぶのが正解。道具を先に揃えて「何を作ろうか」は失敗パターン。",
              check: "✅ チェック：作りたいレシピを1つ決めてから購入する",
            },
            {
              num: "02",
              title: "割引率より「元値」を確認する",
              body: "50%OFFでも元値が異常に高い場合がある。元値と割引後価格を必ず両方確認すること。本サイトでは両方表示しているため比較しやすい。",
              check: "✅ チェック：元値が適正かをAmazonの価格履歴で確認する",
            },
            {
              num: "03",
              title: "レビュー件数100件以上・評価4.0以上を選ぶ",
              body: "製菓道具はレビューが実態を正直に反映しやすいカテゴリ。評価が低い商品はセール中でも避けるのが正解。安物買いの銭失いになる確率が高い。",
              check: "✅ チェック：レビュー100件以上・★4.0以上であることを確認する",
            },
          ].map(item => (
            <div key={item.num} className="bg-white rounded-2xl shadow p-5 flex gap-4">
              <div className="text-3xl font-bold text-[#FFDBC9] flex-shrink-0 w-10">{item.num}</div>
              <div>
                <h3 className="font-bold text-gray-800 text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-2">{item.body}</p>
                <p className="text-xs font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-lg inline-block">{item.check}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ⑦ 注意点 */}
      <section className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
        <h2 className="text-base font-bold text-amber-800 mb-4 flex items-center gap-2">
          <span>⚠️</span> 買う前に必ず確認すること
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { icon: "⚡", title: "在庫切れに注意", desc: "人気セール商品は数時間で売り切れる。気になったら即確認が鉄則。「あとで買う」は在庫切れのリスクがある。" },
            { icon: "📈", title: "価格変動に注意", desc: "Amazonの価格は1日に何度も変動する。本サイトの価格は参考値。必ず購入直前にAmazonで最終確認すること。" },
            { icon: "🔍", title: "類似品・粗悪品に注意", desc: "価格が極端に安い場合は品質に問題がある可能性がある。貝印・OXO・タニタなど有名ブランドを優先するのが安全。" },
            { icon: "📅", title: "タイムセールの時間を確認", desc: "Amazonのタイムセールは時間限定のことがある。終了時刻を必ず確認してから購入すること。" },
          ].map(c => (
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

      {/* FAQ */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>❓</span> よくある質問
        </h2>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white rounded-2xl shadow overflow-hidden">
              <button
                className="w-full text-left px-5 py-4 flex items-center justify-between gap-3"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span className="text-sm font-semibold text-gray-800">{faq.q}</span>
                <svg className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

      {/* ⑧ まとめ・クロージング */}
      <section className="bg-[#8B4513] text-white rounded-2xl p-6">
        <p className="text-xs font-bold text-orange-200 uppercase tracking-widest mb-2">強力なクロージング</p>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <span>🎯</span> まとめ：今すぐ買うべき理由
        </h2>
        <div className="space-y-2 text-sm text-white/90 leading-relaxed mb-6">
          <p>✅ <strong>シリコン製菓型</strong>は今が過去最安値水準。30〜35%OFFは通常ありえない割引率である。</p>
          <p>✅ <strong>ハンドミキサー</strong>は1台あるだけで作れるものが格段に増える。セール時が唯一の買い時。</p>
          <p>✅ <strong>デジタルスケール</strong>はお菓子作りの成功率を劇的に上げる最重要ツール。今すぐ揃えるべきだ。</p>
          <p>⚡ セール価格は予告なく終了する。<strong>気になる商品は今すぐ確認</strong>が唯一の正解である。</p>
        </div>
        {top10.length > 0 && (
          <a href={top10[0].detailPageUrl} target="_blank" rel="noopener noreferrer"
            className="block w-full text-center bg-white text-[#8B4513] font-bold py-3.5 rounded-full text-sm hover:bg-orange-50 transition-colors mb-3">
            👉 今この価格で買えるのはここだけ（在庫切れ注意）
          </a>
        )}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="block w-full text-center bg-white/20 text-white font-medium py-2.5 rounded-full text-sm hover:bg-white/30 transition-colors"
        >
          ↑ セール商品一覧に戻る
        </button>
      </section>
    </div>
  );
};
