const crypto = require("crypto");

const PAAPI_HOST = "webservices.amazon.co.jp";
const PAAPI_REGION = "us-west-2";
const PAAPI_PATH = "/paapi5/searchitems";

let memoryCache = null;
let memoryCacheAt = 0;
const CACHE_TTL = 60 * 60 * 1000;

async function callPAAPI(payload, accessKey, secretKey) {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, "").slice(0, 15) + "Z";
  const dateStamp = amzDate.slice(0, 8);
  const service = "ProductAdvertisingAPI";
  const payloadStr = JSON.stringify(payload);
  const payloadHash = crypto.createHash("sha256").update(payloadStr).digest("hex");
  const canonicalHeaders =
    `content-encoding:amz-1.0\n` +
    `content-type:application/json; charset=utf-8\n` +
    `host:${PAAPI_HOST}\n` +
    `x-amz-date:${amzDate}\n` +
    `x-amz-target:com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems\n`;
  const signedHeaders = "content-encoding;content-type;host;x-amz-date;x-amz-target";
  const canonicalRequest = `POST\n${PAAPI_PATH}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  const credentialScope = `${dateStamp}/${PAAPI_REGION}/${service}/aws4_request`;
  const stringToSign =
    `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n` +
    crypto.createHash("sha256").update(canonicalRequest).digest("hex");
  const hmac = (key, data) => crypto.createHmac("sha256", key).update(data).digest();
  const signingKey = hmac(hmac(hmac(hmac("AWS4" + secretKey, dateStamp), PAAPI_REGION), service), "aws4_request");
  const signature = hmac(signingKey, stringToSign).toString("hex");
  const authHeader =
    `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;
  const response = await fetch(`https://${PAAPI_HOST}${PAAPI_PATH}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Encoding": "amz-1.0",
      "X-Amz-Date": amzDate,
      "X-Amz-Target": "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems",
      Authorization: authHeader,
      Host: PAAPI_HOST,
    },
    body: payloadStr,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PAAPI error ${response.status}: ${text}`);
  }
  return response.json();
}

function detectCategory(nodes, title) {
  const text = [...nodes, title].join(" ").toLowerCase();
  if (/(ホームベーカリー|製パン機|ヨーグルトメーカー|フードプロセッサー|ハンドミキサー|スタンドミキサー|電動ミキサー|オーブン|電子レンジ)/.test(text)) return "キッチン家電";
  if (/(ケーキ型|マフィン型|タルト型|パン型|クッキー型|抜き型|シリコン型|天板|焼き型|ドーナツ型|プリン型|ゼリー型|パウンド型)/.test(text)) return "製菓型・天板";
  if (/(絞り袋|デコレーション|アイシング|チョコペン|トッピング|スプリンクル|口金|ピーラー|デコ)/.test(text)) return "デコレーション用品";
  if (/(計量|スケール|温度計|タイマー|めん棒|スパチュラ|ゴムベラ|泡立て|ふるい|こし器|パレット|刷毛|ブラシ|ケーキクーラー|冷却|ターンテーブル|カード|スクレーパー)/.test(text)) return "調理・製造道具";
  if (/(薄力粉|ベーキング|砂糖|バター|チョコ|バニラ|粉砂糖|ゼラチン|コーンスターチ|ナッツ|アーモンド|抹茶|ラム酒|食用色素|ドライフルーツ)/.test(text)) return "製菓材料";
  if (/(クッキングシート|オーブンシート|ベーキングシート|アルミホイル|ワックスペーパー|シリコンマット)/.test(text)) return "クッキングシート・消耗品";
  if (/(ラッピング|ギフトボックス|袋|リボン|セロファン|梱包|包装|箱)/.test(text)) return "ラッピング・梱包";
  if (/(保存容器|タッパー|ジッパー|フリーザー|密閉|キャニスター)/.test(text)) return "保存容器";
  if (/(エプロン|手袋|ミトン|オーブンミトン|帽子|コック)/.test(text)) return "ウェア・小物";
  return "その他製菓用品";
}

function getMockItems() {
  return [
    { asin: "B001", title: "貝印 KAI シリコン マフィン型 6個取 DL-6287", brand: "貝印", imageUrl: null, price: 980, originalPrice: 1500, discountPercent: 35, detailPageUrl: "https://www.amazon.co.jp/dp/B001", category: "製菓型・天板", features: ["シリコン製で取り出し簡単", "食洗機対応", "6個取り"] },
    { asin: "B002", title: "WAHEI FREIZ ハンドミキサー 300W 5段階速度調節", brand: "WAHEI FREIZ", imageUrl: null, price: 2980, originalPrice: 4500, discountPercent: 34, detailPageUrl: "https://www.amazon.co.jp/dp/B002", category: "キッチン家電", features: ["300W パワフル", "5段階速度調節"] },
    { asin: "B003", title: "貝印 KAI タルト型 底取 21cm DL-6192", brand: "貝印", imageUrl: null, price: 890, originalPrice: 1300, discountPercent: 32, detailPageUrl: "https://www.amazon.co.jp/dp/B003", category: "製菓型・天板", features: ["底取れタイプ", "フッ素加工"] },
    { asin: "B004", title: "Wilton ウィルトン デコレーション絞り袋セット 45点", brand: "Wilton", imageUrl: null, price: 1560, originalPrice: 2200, discountPercent: 29, detailPageUrl: "https://www.amazon.co.jp/dp/B004", category: "デコレーション用品", features: ["45点フルセット", "口金24種類付き"] },
    { asin: "B005", title: "OXO グッドグリップス シリコン スパチュラ 3本セット", brand: "OXO", imageUrl: null, price: 1800, originalPrice: 2500, discountPercent: 28, detailPageUrl: "https://www.amazon.co.jp/dp/B005", category: "調理・製造道具", features: ["耐熱シリコン製", "食洗機対応"] },
    { asin: "B006", title: "タニタ デジタルクッキングスケール KD-321 1kg/0.1g", brand: "タニタ", imageUrl: null, price: 2480, originalPrice: 3200, discountPercent: 22, detailPageUrl: "https://www.amazon.co.jp/dp/B006", category: "調理・製造道具", features: ["0.1g単位", "ガラス天板"] },
    { asin: "B007", title: "パナソニック ホームベーカリー SD-MDX4-W", brand: "パナソニック", imageUrl: null, price: 18800, originalPrice: 25000, discountPercent: 25, detailPageUrl: "https://www.amazon.co.jp/dp/B007", category: "キッチン家電", features: ["天然酵母コース対応", "タイマー予約"] },
    { asin: "B008", title: "富澤商店 製菓用薄力粉 バイオレット 1kg", brand: "富澤商店", imageUrl: null, price: 398, originalPrice: 550, discountPercent: 28, detailPageUrl: "https://www.amazon.co.jp/dp/B008", category: "製菓材料", features: ["製菓専用薄力粉", "きめ細かい粒子"] },
    { asin: "B009", title: "クオカ 製菓用チョコレート クーベルチュール 500g", brand: "クオカ", imageUrl: null, price: 1280, originalPrice: 1800, discountPercent: 29, detailPageUrl: "https://www.amazon.co.jp/dp/B009", category: "製菓材料", features: ["クーベルチュール", "テンパリング不要"] },
    { asin: "B010", title: "共立食品 バニラエッセンス 30ml", brand: "共立食品", imageUrl: null, price: 198, originalPrice: 280, discountPercent: 29, detailPageUrl: "https://www.amazon.co.jp/dp/B010", category: "製菓材料", features: ["天然バニラ使用", "少量でしっかり香る"] },
    { asin: "B011", title: "東洋アルミ クッキングシート 30cm×50枚", brand: "東洋アルミ", imageUrl: null, price: 398, originalPrice: 580, discountPercent: 31, detailPageUrl: "https://www.amazon.co.jp/dp/B011", category: "クッキングシート・消耗品", features: ["両面シリコン加工", "50枚入り"] },
    { asin: "B012", title: "HEIKO ギフトボックス マカロン用 10枚セット", brand: "HEIKO", imageUrl: null, price: 480, originalPrice: 680, discountPercent: 29, detailPageUrl: "https://www.amazon.co.jp/dp/B012", category: "ラッピング・梱包", features: ["マカロン用設計", "おしゃれなデザイン"] },
    { asin: "B013", title: "iwaki イワキ 耐熱ガラス 保存容器 4点セット", brand: "iwaki", imageUrl: null, price: 2480, originalPrice: 3500, discountPercent: 29, detailPageUrl: "https://www.amazon.co.jp/dp/B013", category: "保存容器", features: ["耐熱ガラス製", "電子レンジ対応"] },
    { asin: "B014", title: "パール金属 ケーキクーラー 網 30×25cm", brand: "パール金属", imageUrl: null, price: 680, originalPrice: 980, discountPercent: 31, detailPageUrl: "https://www.amazon.co.jp/dp/B014", category: "調理・製造道具", features: ["30×25cmサイズ", "ステンレス製"] },
    { asin: "B015", title: "TESCOMA テスコマ ターンテーブル 31cm", brand: "TESCOMA", imageUrl: null, price: 3200, originalPrice: 4500, discountPercent: 29, detailPageUrl: "https://www.amazon.co.jp/dp/B015", category: "調理・製造道具", features: ["31cm大径", "スムーズ回転"] },
    { asin: "B016", title: "貝印 パレットナイフ 20cm DL-6240", brand: "貝印", imageUrl: null, price: 580, originalPrice: 850, discountPercent: 32, detailPageUrl: "https://www.amazon.co.jp/dp/B016", category: "調理・製造道具", features: ["ステンレス製", "L字型で使いやすい"] },
    { asin: "B017", title: "TESCOMA デジタル温度計 -50〜300℃", brand: "TESCOMA", imageUrl: null, price: 1480, originalPrice: 2000, discountPercent: 26, detailPageUrl: "https://www.amazon.co.jp/dp/B017", category: "調理・製造道具", features: ["-50〜300℃対応", "2秒即時測定"] },
    { asin: "B018", title: "クオカ アーモンドプードル 200g", brand: "クオカ", imageUrl: null, price: 480, originalPrice: 680, discountPercent: 29, detailPageUrl: "https://www.amazon.co.jp/dp/B018", category: "製菓材料", features: ["皮なしアーモンド100%", "マカロンに最適"] },
    { asin: "B019", title: "富澤商店 粉糖 500g（コーンスターチ不使用）", brand: "富澤商店", imageUrl: null, price: 380, originalPrice: 520, discountPercent: 27, detailPageUrl: "https://www.amazon.co.jp/dp/B019", category: "製菓材料", features: ["コーンスターチ不使用", "アイシングに最適"] },
    { asin: "B020", title: "貝印 クッキー型 12種セット DL-6260", brand: "貝印", imageUrl: null, price: 780, originalPrice: 1200, discountPercent: 35, detailPageUrl: "https://www.amazon.co.jp/dp/B020", category: "製菓型・天板", features: ["12種類の型", "ステンレス製"] },
    { asin: "B021", title: "cotta シリコンマット 40×30cm", brand: "cotta", imageUrl: null, price: 980, originalPrice: 1400, discountPercent: 30, detailPageUrl: "https://www.amazon.co.jp/dp/B021", category: "クッキングシート・消耗品", features: ["繰り返し使える", "目盛り付き"] },
    { asin: "B022", title: "HEIKO OPP袋 クッキー用 100枚入り", brand: "HEIKO", imageUrl: null, price: 380, originalPrice: 550, discountPercent: 31, detailPageUrl: "https://www.amazon.co.jp/dp/B022", category: "ラッピング・梱包", features: ["透明OPP素材", "100枚入りお得"] },
    { asin: "B023", title: "エコー金属 ステンレス ふるい 18cm", brand: "エコー金属", imageUrl: null, price: 480, originalPrice: 700, discountPercent: 31, detailPageUrl: "https://www.amazon.co.jp/dp/B023", category: "調理・製造道具", features: ["18cmサイズ", "目が細かく均一"] },
    { asin: "B024", title: "recolte ソロブレンダー RSB-3", brand: "recolte", imageUrl: null, price: 5980, originalPrice: 8000, discountPercent: 25, detailPageUrl: "https://www.amazon.co.jp/dp/B024", category: "キッチン家電", features: ["コンパクト設計", "蓋付きカップ付属"] },
    { asin: "B025", title: "貝印 シフォンケーキ型 17cm DL-6195", brand: "貝印", imageUrl: null, price: 1080, originalPrice: 1600, discountPercent: 33, detailPageUrl: "https://www.amazon.co.jp/dp/B025", category: "製菓型・天板", features: ["17cmサイズ", "アルミ製で熱伝導◎"] },
    { asin: "B026", title: "cotta 使い捨て絞り袋 100枚入り", brand: "cotta", imageUrl: null, price: 680, originalPrice: 980, discountPercent: 31, detailPageUrl: "https://www.amazon.co.jp/dp/B026", category: "デコレーション用品", features: ["使い捨てで衛生的", "100枚入り"] },
    { asin: "B027", title: "共立食品 食用色素 6色セット", brand: "共立食品", imageUrl: null, price: 880, originalPrice: 1280, discountPercent: 31, detailPageUrl: "https://www.amazon.co.jp/dp/B027", category: "デコレーション用品", features: ["6色セット", "少量で発色◎"] },
    { asin: "B028", title: "山崎実業 キッチンエプロン シンプル", brand: "山崎実業", imageUrl: null, price: 1480, originalPrice: 2200, discountPercent: 33, detailPageUrl: "https://www.amazon.co.jp/dp/B028", category: "ウェア・小物", features: ["汚れにくい素材", "サイズ調節可能"] },
    { asin: "B029", title: "パール金属 パウンドケーキ型 3本セット", brand: "パール金属", imageUrl: null, price: 680, originalPrice: 980, discountPercent: 31, detailPageUrl: "https://www.amazon.co.jp/dp/B029", category: "製菓型・天板", features: ["3本セット", "フッ素加工"] },
    { asin: "B030", title: "cotta ドレジェ カラーシュガー 50g×5色", brand: "cotta", imageUrl: null, price: 680, originalPrice: 980, discountPercent: 31, detailPageUrl: "https://www.amazon.co.jp/dp/B030", category: "デコレーション用品", features: ["5色セット", "ケーキ・クッキーに"] },
  ];
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const now = Date.now();
  if (memoryCache && now - memoryCacheAt < CACHE_TTL) {
    return res.json({ items: memoryCache, cachedAt: memoryCacheAt, nextUpdate: memoryCacheAt + CACHE_TTL, fromCache: true });
  }

  const accessKey = process.env.PAAPI_ACCESS_KEY;
  const secretKey = process.env.PAAPI_SECRET_KEY;
  const partnerTag = process.env.PAAPI_PARTNER_TAG;

  if (!accessKey || !secretKey || !partnerTag) {
    return res.json({ items: getMockItems(), cachedAt: now, nextUpdate: now + CACHE_TTL, fromCache: false, isMock: true });
  }

  const searches = [
    { keywords: "製菓型 セール", searchIndex: "Kitchen" },
    { keywords: "ハンドミキサー 製菓", searchIndex: "Kitchen" },
    { keywords: "製菓道具 割引", searchIndex: "Kitchen" },
    { keywords: "お菓子作り 型", searchIndex: "Kitchen" },
    { keywords: "クッキングシート 製菓", searchIndex: "Kitchen" },
    { keywords: "製菓材料 セール", searchIndex: "Grocery" },
    { keywords: "薄力粉 製菓用", searchIndex: "Grocery" },
    { keywords: "チョコレート 製菓用", searchIndex: "Grocery" },
    { keywords: "ラッピング お菓子用", searchIndex: "Kitchen" },
    { keywords: "デコレーション 製菓", searchIndex: "Kitchen" },
    { keywords: "保存容器 製菓", searchIndex: "Kitchen" },
    { keywords: "シリコンマット ベーキング", searchIndex: "Kitchen" },
  ];

  const allItems = [];
  const seen = new Set();

  for (const search of searches) {
    try {
      const data = await callPAAPI({
        Keywords: search.keywords,
        SearchIndex: search.searchIndex,
        PartnerTag: partnerTag,
        PartnerType: "Associates",
        Marketplace: "www.amazon.co.jp",
        Resources: [
          "Images.Primary.Medium",
          "ItemInfo.Title",
          "ItemInfo.ByLineInfo",
          "ItemInfo.Features",
          "Offers.Listings.Price",
          "Offers.Listings.SavingBasis",
          "BrowseNodeInfo.BrowseNodes",
        ],
        ItemCount: 10,
        MinSavingPercent: 5,
      }, accessKey, secretKey);

      const items = (data?.SearchResult?.Items || []).map((item) => {
        const listing = item.Offers?.Listings?.[0];
        const price = listing?.Price?.Amount ?? null;
        const basis = listing?.SavingBasis?.Amount ?? null;
        const discountPercent = basis && price ? Math.round(((basis - price) / basis) * 100) : null;
        const nodes = item.BrowseNodeInfo?.BrowseNodes?.map((n) => n.DisplayName || "") || [];
        const title = item.ItemInfo?.Title?.DisplayValue || "";
        return {
          asin: item.ASIN,
          title,
          brand: item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue ?? null,
          imageUrl: item.Images?.Primary?.Medium?.URL ?? null,
          price,
          originalPrice: basis,
          discountPercent,
          detailPageUrl: `https://www.amazon.co.jp/dp/${item.ASIN}?tag=${partnerTag}`,
          category: detectCategory(nodes, title),
          features: item.ItemInfo?.Features?.DisplayValues ?? [],
        };
      });

      for (const item of items) {
        if (!seen.has(item.asin) && item.discountPercent > 0) {
          seen.add(item.asin);
          allItems.push(item);
        }
      }
      await new Promise((r) => setTimeout(r, 1000));
    } catch (e) {
      console.error("PAAPI search error:", e.message);
    }
  }

  memoryCache = allItems;
  memoryCacheAt = now;
  return res.json({ items: allItems, cachedAt: now, nextUpdate: now + CACHE_TTL, fromCache: false });
};
