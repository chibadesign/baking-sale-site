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
  if (/(ケーキ型|マフィン型|タルト型|パン型|クッキー型|抜き型|シリコン型|天板|焼き型|ドーナツ型|パウンド型|シフォン型|ロール型)/.test(text)) return "製菓型・天板";
  if (/(絞り袋|デコレーション|アイシング|チョコペン|トッピング|スプリンクル|口金|クリーム絞り|ピーシング)/.test(text)) return "絞り袋・デコレーション";
  if (/(クッキングシート|オーブンシート|アルミホイル|ベーキングシート|シリコンマット|クッキングペーパー)/.test(text)) return "クッキングシート・消耗品";
  if (/(ラッピング|ギフトボックス|袋|包装|リボン|梱包|プレゼント袋|OPP袋)/.test(text)) return "ラッピング・梱包";
  if (/(計量スプーン|計量カップ|温度計|タイマー|めん棒|スパチュラ|ゴムベラ|泡立て|ふるい|こし器|パレット|刷毛|ブラシ|スケール|はかり|ケーキクーラー|冷却|スクレーパー|カード|ターンテーブル)/.test(text)) return "調理・製造道具";
  if (/(薄力粉|ベーキングパウダー|重曹|砂糖|バター|チョコレート|バニラ|粉砂糖|ゼラチン|コーンスターチ|アーモンドプードル|ドライフルーツ|ナッツ|食用色素|カカオ|抹茶|ホットケーキ|ミックス粉)/.test(text)) return "製菓材料";
  if (/(保存容器|タッパー|ケーキボックス|持ち運び|ケーキスタンド|ディスプレイ)/.test(text)) return "保存・ディスプレイ";
  return "その他";
}

function getMockItems() {
  return [
    { asin: "B001", title: "貝印 KAI シリコン マフィン型 6個取 DL-6287", brand: "貝印", imageUrl: null, price: 980, originalPrice: 1500, discountPercent: 35, detailPageUrl: "https://www.amazon.co.jp/dp/B001", category: "製菓型・天板", features: ["シリコン製で取り出し簡単", "食洗機対応", "6個取り"] },
    { asin: "B002", title: "WAHEI FREIZ ハンドミキサー 300W 5段階速度調節", brand: "WAHEI FREIZ", imageUrl: null, price: 2980, originalPrice: 4500, discountPercent: 34, detailPageUrl: "https://www.amazon.co.jp/dp/B002", category: "キッチン家電", features: ["300W パワフルモーター", "5段階速度調節", "収納ケース付き"] },
    { asin: "B003", title: "貝印 KAI タルト型 底取れ 21cm DL-6192", brand: "貝印", imageUrl: null, price: 890, originalPrice: 1300, discountPercent: 32, detailPageUrl: "https://www.amazon.co.jp/dp/B003", category: "製菓型・天板", features: ["底取れタイプ", "フッ素加工", "21cm"] },
    { asin: "B004", title: "Wilton ウィルトン デコレーション絞り袋セット 45点", brand: "Wilton", imageUrl: null, price: 1560, originalPrice: 2200, discountPercent: 29, detailPageUrl: "https://www.amazon.co.jp/dp/B004", category: "絞り袋・デコレーション", features: ["45点フルセット", "口金24種類付き", "再利用可能"] },
    { asin: "B005", title: "OXO グッドグリップス シリコン スパチュラ 3本セット", brand: "OXO", imageUrl: null, price: 1800, originalPrice: 2500, discountPercent: 28, detailPageUrl: "https://www.amazon.co.jp/dp/B005", category: "調理・製造道具", features: ["耐熱シリコン製", "食洗機対応", "3サイズセット"] },
    { asin: "B006", title: "富澤商店 製菓用薄力粉 バイオレット 1kg", brand: "富澤商店", imageUrl: null, price: 398, originalPrice: 550, discountPercent: 28, detailPageUrl: "https://www.amazon.co.jp/dp/B006", category: "製菓材料", features: ["製菓専用薄力粉", "きめ細かい粒子"] },
    { asin: "B007", title: "タニタ デジタルクッキングスケール KD-321 1kg/0.1g", brand: "タニタ", imageUrl: null, price: 2480, originalPrice: 3200, discountPercent: 22, detailPageUrl: "https://www.amazon.co.jp/dp/B007", category: "調理・製造道具", features: ["0.1g単位", "ガラス天板", "風袋引き機能"] },
    { asin: "B008", title: "パナソニック ホームベーカリー SD-MDX4-W 1斤", brand: "パナソニック", imageUrl: null, price: 18800, originalPrice: 25000, discountPercent: 25, detailPageUrl: "https://www.amazon.co.jp/dp/B008", category: "キッチン家電", features: ["天然酵母コース対応", "タイマー予約機能"] },
    { asin: "B009", title: "東洋アルミ クッキングシート 30cm×50枚", brand: "東洋アルミ", imageUrl: null, price: 298, originalPrice: 420, discountPercent: 29, detailPageUrl: "https://www.amazon.co.jp/dp/B009", category: "クッキングシート・消耗品", features: ["両面使用可能", "耐熱230℃", "50枚入り"] },
    { asin: "B010", title: "asdfas OPP袋 ラッピング袋 100枚 クッキー用", brand: "HEIKO", imageUrl: null, price: 480, originalPrice: 700, discountPercent: 31, detailPageUrl: "https://www.amazon.co.jp/dp/B010", category: "ラッピング・梱包", features: ["100枚入り", "クッキー・焼き菓子用", "透明OPP"] },
    { asin: "B011", title: "貝印 パウンドケーキ型 18cm DL-6109", brand: "貝印", imageUrl: null, price: 650, originalPrice: 950, discountPercent: 32, detailPageUrl: "https://www.amazon.co.jp/dp/B011", category: "製菓型・天板", features: ["フッ素加工", "18cm標準サイズ", "お手入れ簡単"] },
    { asin: "B012", title: "LEYE シフォンケーキ型 17cm アルミ製", brand: "LEYE", imageUrl: null, price: 1200, originalPrice: 1800, discountPercent: 33, detailPageUrl: "https://www.amazon.co.jp/dp/B012", category: "製菓型・天板", features: ["アルミ製で熱伝導抜群", "17cm標準サイズ", "底取れ構造"] },
    { asin: "B013", title: "クックパー セパレート クッキングシート 27枚", brand: "旭化成", imageUrl: null, price: 350, originalPrice: 498, discountPercent: 30, detailPageUrl: "https://www.amazon.co.jp/dp/B013", category: "クッキングシート・消耗品", features: ["セパレートタイプ", "27枚入り", "使い捨て"] },
    { asin: "B014", title: "TRUSCO シリコーンマット 製菓用 40×30cm", brand: "TRUSCO", imageUrl: null, price: 880, originalPrice: 1300, discountPercent: 32, detailPageUrl: "https://www.amazon.co.jp/dp/B014", category: "クッキングシート・消耗品", features: ["繰り返し使用可能", "目盛り付き", "食洗機対応"] },
    { asin: "B015", title: "Wilton ケーキターンテーブル 30cm アルミ製", brand: "Wilton", imageUrl: null, price: 3200, originalPrice: 4500, discountPercent: 29, detailPageUrl: "https://www.amazon.co.jp/dp/B015", category: "調理・製造道具", features: ["滑らかな回転", "アルミ製で安定感", "デコレーション作業に最適"] },
    { asin: "B016", title: "パレットナイフ ステンレス 20cm L字型", brand: "貝印", imageUrl: null, price: 750, originalPrice: 1100, discountPercent: 32, detailPageUrl: "https://www.amazon.co.jp/dp/B016", category: "調理・製造道具", features: ["L字型で塗りやすい", "ステンレス製", "食洗機対応"] },
    { asin: "B017", title: "富澤商店 アーモンドプードル 200g", brand: "富澤商店", imageUrl: null, price: 480, originalPrice: 680, discountPercent: 29, detailPageUrl: "https://www.amazon.co.jp/dp/B017", category: "製菓材料", features: ["皮なしタイプ", "マカロン・フィナンシェに最適"] },
    { asin: "B018", title: "バレンタイン チョコレート クーベルチュール 500g", brand: "Van Houten", imageUrl: null, price: 1280, originalPrice: 1800, discountPercent: 29, detailPageUrl: "https://www.amazon.co.jp/dp/B018", category: "製菓材料", features: ["製菓用クーベルチュール", "500g大容量", "テンパリング不要"] },
    { asin: "B019", title: "TANITA 料理用温度計 TT-533 -50〜300℃", brand: "タニタ", imageUrl: null, price: 1580, originalPrice: 2200, discountPercent: 28, detailPageUrl: "https://www.amazon.co.jp/dp/B019", category: "調理・製造道具", features: ["−50〜300℃計測可能", "チョコ・飴・揚げ物に対応", "防水仕様"] },
    { asin: "B020", title: "ケーキボックス 白 6号 10枚セット", brand: "HEIKO", imageUrl: null, price: 680, originalPrice: 980, discountPercent: 31, detailPageUrl: "https://www.amazon.co.jp/dp/B020", category: "ラッピング・梱包", features: ["6号ケーキ対応", "10枚セット", "持ち手付き"] },
    { asin: "B021", title: "貝印 クッキー抜き型 12個セット ステンレス", brand: "貝印", imageUrl: null, price: 780, originalPrice: 1200, discountPercent: 35, detailPageUrl: "https://www.amazon.co.jp/dp/B021", category: "製菓型・天板", features: ["12種類の形", "ステンレス製", "収納ケース付き"] },
    { asin: "B022", title: "マーナ ケーキクーラー 角型 29×23cm", brand: "マーナ", imageUrl: null, price: 580, originalPrice: 850, discountPercent: 32, detailPageUrl: "https://www.amazon.co.jp/dp/B022", category: "調理・製造道具", features: ["29×23cmワイドサイズ", "ステンレス製", "折りたたみ可能"] },
    { asin: "B023", title: "富澤商店 粉砂糖 200g 純粉糖", brand: "富澤商店", imageUrl: null, price: 280, originalPrice: 400, discountPercent: 30, detailPageUrl: "https://www.amazon.co.jp/dp/B023", category: "製菓材料", features: ["純粉糖100%", "デコレーション・アイシングに最適"] },
    { asin: "B024", title: "LEKUE ロールパン型 シリコン 8個取", brand: "LEKUE", imageUrl: null, price: 2800, originalPrice: 4000, discountPercent: 30, detailPageUrl: "https://www.amazon.co.jp/dp/B024", category: "製菓型・天板", features: ["スペイン製シリコン", "8個取り", "オーブン・電子レンジ対応"] },
    { asin: "B025", title: "リボン 梱包用 25mm×30m ゴールド", brand: "HEIKO", imageUrl: null, price: 380, originalPrice: 550, discountPercent: 31, detailPageUrl: "https://www.amazon.co.jp/dp/B025", category: "ラッピング・梱包", features: ["25mm幅", "30m大巻き", "ゴールドカラー"] },
    { asin: "B026", title: "Matfer 木製 めん棒 40cm フランス製", brand: "Matfer", imageUrl: null, price: 1200, originalPrice: 1700, discountPercent: 29, detailPageUrl: "https://www.amazon.co.jp/dp/B026", category: "調理・製造道具", features: ["フランス製ブナ材", "40cm標準サイズ", "パン・タルト生地に最適"] },
    { asin: "B027", title: "富澤商店 バニラエッセンス 30ml", brand: "富澤商店", imageUrl: null, price: 320, originalPrice: 480, discountPercent: 33, detailPageUrl: "https://www.amazon.co.jp/dp/B027", category: "製菓材料", features: ["天然バニラ使用", "30ml大容量", "スポンジ・プリンに最適"] },
    { asin: "B028", title: "recolte レコルト ソロブレンダー RSB-3", brand: "recolte", imageUrl: null, price: 5980, originalPrice: 8000, discountPercent: 25, detailPageUrl: "https://www.amazon.co.jp/dp/B028", category: "キッチン家電", features: ["コンパクト設計", "蓋付きカップ付属", "分解して洗える"] },
    { asin: "B029", title: "使い捨て絞り袋 100枚入り 30cm", brand: "TIPSS", imageUrl: null, price: 580, originalPrice: 850, discountPercent: 32, detailPageUrl: "https://www.amazon.co.jp/dp/B029", category: "絞り袋・デコレーション", features: ["100枚大容量", "30cm使いやすいサイズ", "業務用品質"] },
    { asin: "B030", title: "貝印 ドーナツ型 6個取 シリコン DL-6299", brand: "貝印", imageUrl: null, price: 850, originalPrice: 1300, discountPercent: 35, detailPageUrl: "https://www.amazon.co.jp/dp/B030", category: "製菓型・天板", features: ["シリコン製", "6個取り", "揚げずに焼きドーナツが作れる"] },
    { asin: "B031", title: "ケーキスタンド アクリル 2段 28cm", brand: "HARIO", imageUrl: null, price: 2400, originalPrice: 3500, discountPercent: 31, detailPageUrl: "https://www.amazon.co.jp/dp/B031", category: "保存・ディスプレイ", features: ["2段タイプ", "アクリル製で清潔感あり", "パーティーやカフェ風演出に"] },
    { asin: "B032", title: "食用色素 12色セット 粉末タイプ", brand: "AmeriColor", imageUrl: null, price: 1280, originalPrice: 1800, discountPercent: 29, detailPageUrl: "https://www.amazon.co.jp/dp/B032", category: "製菓材料", features: ["12色フルセット", "アイシングクッキーに最適", "少量で鮮やかに着色"] },
    { asin: "B033", title: "Silikomart シリコン型 ボンボン 15個取", brand: "Silikomart", imageUrl: null, price: 1580, originalPrice: 2300, discountPercent: 31, detailPageUrl: "https://www.amazon.co.jp/dp/B033", category: "製菓型・天板", features: ["イタリア製高品質シリコン", "15個取り", "チョコボンボンに最適"] },
    { asin: "B034", title: "スプリンクル デコレーション 6種 アソートセット", brand: "Wilton", imageUrl: null, price: 780, originalPrice: 1100, discountPercent: 29, detailPageUrl: "https://www.amazon.co.jp/dp/B034", category: "絞り袋・デコレーション", features: ["6種類アソート", "カラフルで映える", "カップケーキ・ケーキトッピングに"] },
    { asin: "B035", title: "富澤商店 ゼラチン板 10枚入り", brand: "富澤商店", imageUrl: null, price: 380, originalPrice: 560, discountPercent: 32, detailPageUrl: "https://www.amazon.co.jp/dp/B035", category: "製菓材料", features: ["板ゼラチン10枚入り", "ムース・ゼリーに最適", "透明度が高い"] },
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

  // PA-API 検索（カテゴリ大幅拡張）
  const searches = [
    { keywords: "製菓型 シリコン セール", searchIndex: "Kitchen" },
    { keywords: "ハンドミキサー 製菓 割引", searchIndex: "Kitchen" },
    { keywords: "クッキングシート オーブンシート", searchIndex: "Kitchen" },
    { keywords: "製菓材料 薄力粉 セール", searchIndex: "Grocery" },
    { keywords: "ケーキ デコレーション 絞り袋", searchIndex: "Kitchen" },
    { keywords: "ラッピング袋 製菓 ギフト", searchIndex: "Kitchen" },
    { keywords: "製菓道具 スケール 温度計", searchIndex: "Kitchen" },
    { keywords: "チョコレート 製菓用 セール", searchIndex: "Grocery" },
    { keywords: "ケーキ型 天板 クッキー", searchIndex: "Kitchen" },
    { keywords: "ホームベーカリー 製菓家電", searchIndex: "Kitchen" },
    { keywords: "スプリンクル アイシング 食用色素", searchIndex: "Kitchen" },
    { keywords: "ケーキボックス 製菓 梱包", searchIndex: "Kitchen" },
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
          asin: item.ASIN, title,
          brand: item.ItemInfo?.ByLineInfo?.Brand?.DisplayValue ?? null,
          imageUrl: item.Images?.Primary?.Medium?.URL ?? null,
          price, originalPrice: basis, discountPercent,
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
