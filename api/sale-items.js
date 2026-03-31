// api/sale-items.js
// Vercel Serverless Function（無料枠で動作）
// PA-APIへのリクエストをここで行い、CORSとキャッシュを処理する

const crypto = require("crypto");

const PAAPI_HOST = "webservices.amazon.co.jp";
const PAAPI_REGION = "us-west-2";
const PAAPI_PATH = "/paapi5/searchitems";

// メモリキャッシュ（Vercelのインスタンスが生きている間だけ有効）
let memoryCache = null;
let memoryCacheAt = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1時間

// AWS署名v4でPAAPIを呼び出す
async function callPAAPI(payload, accessKey, secretKey) {
  const now = new Date();
  const amzDate =
    now.toISOString().replace(/[:\-]|\.\d{3}/g, "").slice(0, 15) + "Z";
  const dateStamp = amzDate.slice(0, 8);
  const service = "ProductAdvertisingAPI";

  const payloadStr = JSON.stringify(payload);
  const payloadHash = crypto
    .createHash("sha256")
    .update(payloadStr)
    .digest("hex");

  const canonicalHeaders =
    `content-encoding:amz-1.0\n` +
    `content-type:application/json; charset=utf-8\n` +
    `host:${PAAPI_HOST}\n` +
    `x-amz-date:${amzDate}\n` +
    `x-amz-target:com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems\n`;

  const signedHeaders =
    "content-encoding;content-type;host;x-amz-date;x-amz-target";

  const canonicalRequest =
    `POST\n${PAAPI_PATH}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

  const credentialScope = `${dateStamp}/${PAAPI_REGION}/${service}/aws4_request`;
  const stringToSign =
    `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n` +
    crypto.createHash("sha256").update(canonicalRequest).digest("hex");

  const hmac = (key, data) =>
    crypto.createHmac("sha256", key).update(data).digest();

  const signingKey = hmac(
    hmac(
      hmac(hmac("AWS4" + secretKey, dateStamp), PAAPI_REGION),
      service
    ),
    "aws4_request"
  );
  const signature = hmac(signingKey, stringToSign).toString("hex");

  const authHeader =
    `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const response = await fetch(
    `https://${PAAPI_HOST}${PAAPI_PATH}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Encoding": "amz-1.0",
        "X-Amz-Date": amzDate,
        "X-Amz-Target":
          "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems",
        Authorization: authHeader,
        Host: PAAPI_HOST,
      },
      body: payloadStr,
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PAAPI error ${response.status}: ${text}`);
  }
  return response.json();
}

function detectCategory(nodes, title) {
  const text = [...nodes, title].join(" ").toLowerCase();
  if (/(ホームベーカリー|製パン機|ヨーグルトメーカー|フードプロセッサー|ハンドミキサー|スタンドミキサー|電動)/.test(text))
    return "キッチン家電";
  if (/(ケーキ型|マフィン型|タルト型|パン型|クッキー型|抜き型|シリコン型|天板|焼き型)/.test(text))
    return "製菓型・天板";
  if (/(絞り袋|デコレーション|アイシング|チョコペン|トッピング|スプリンクル)/.test(text))
    return "デコレーション用品";
  if (/(計量|スケール|温度計|タイマー|めん棒|スパチュラ|ゴムベラ|泡立て|ふるい|こし器|パレット|刷毛|ブラシ)/.test(text))
    return "調理・製造道具";
  if (/(薄力粉|ベーキング|砂糖|バター|チョコ|バニラ|粉砂糖|ゼラチン|コーンスターチ)/.test(text))
    return "製菓材料";
  return "その他";
}

function getMockItems() {
  return [
    {
      asin: "B08XYZ1234", title: "貝印 KAI 製菓 シリコン マフィン型 6個取 DL-6287",
      brand: "貝印", imageUrl: null, price: 980, originalPrice: 1500,
      discountPercent: 35, detailPageUrl: "https://www.amazon.co.jp/dp/B08XYZ1234",
      category: "製菓型・天板", features: ["シリコン製で取り出し簡単", "食洗機対応"],
    },
    {
      asin: "B07ABC5678", title: "WAHEI FREIZ ハンドミキサー 300W 5段階速度調節",
      brand: "WAHEI FREIZ", imageUrl: null, price: 2980, originalPrice: 4500,
      discountPercent: 34, detailPageUrl: "https://www.amazon.co.jp/dp/B07ABC5678",
      category: "キッチン家電", features: ["300W パワフルモーター", "5段階速度調節"],
    },
    {
      asin: "B09DEF9012", title: "OXO グッドグリップス シリコン スパチュラ 3本セット",
      brand: "OXO", imageUrl: null, price: 1800, originalPrice: 2500,
      discountPercent: 28, detailPageUrl: "https://www.amazon.co.jp/dp/B09DEF9012",
      category: "調理・製造道具", features: ["耐熱シリコン製", "食洗機対応"],
    },
    {
      asin: "B06GHI3456", title: "タニタ デジタルクッキングスケール KD-321 1kg/0.1g",
      brand: "タニタ", imageUrl: null, price: 2480, originalPrice: 3200,
      discountPercent: 22, detailPageUrl: "https://www.amazon.co.jp/dp/B06GHI3456",
      category: "調理・製造道具", features: ["0.1g単位の精密計量", "ガラス天板"],
    },
    {
      asin: "B05JKL7890", title: "パナソニック ホームベーカリー SD-MDX4-W",
      brand: "パナソニック", imageUrl: null, price: 18800, originalPrice: 25000,
      discountPercent: 25, detailPageUrl: "https://www.amazon.co.jp/dp/B05JKL7890",
      category: "キッチン家電", features: ["天然酵母コース対応", "タイマー予約機能"],
    },
    {
      asin: "B04MNO2345", title: "Wilton ウィルトン デコレーション絞り袋セット 45点",
      brand: "Wilton", imageUrl: null, price: 1560, originalPrice: 2200,
      discountPercent: 29, detailPageUrl: "https://www.amazon.co.jp/dp/B04MNO2345",
      category: "デコレーション用品", features: ["45点フルセット", "口金24種類付き"],
    },
    {
      asin: "B03PQR6789", title: "富澤商店 製菓用薄力粉 バイオレット 1kg",
      brand: "富澤商店", imageUrl: null, price: 398, originalPrice: 550,
      discountPercent: 28, detailPageUrl: "https://www.amazon.co.jp/dp/B03PQR6789",
      category: "製菓材料", features: ["製菓専用薄力粉", "きめ細かい粒子"],
    },
    {
      asin: "B02STU1234", title: "貝印 KAI タルト型 底取 21cm DL-6192",
      brand: "貝印", imageUrl: null, price: 890, originalPrice: 1300,
      discountPercent: 32, detailPageUrl: "https://www.amazon.co.jp/dp/B02STU1234",
      category: "製菓型・天板", features: ["底取れタイプ", "フッ素加工"],
    },
  ];
}

module.exports = async function handler(req, res) {
  // CORS設定
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const now = Date.now();

  // メモリキャッシュが有効なら返す
  if (memoryCache && now - memoryCacheAt < CACHE_TTL) {
    return res.json({
      items: memoryCache,
      cachedAt: memoryCacheAt,
      nextUpdate: memoryCacheAt + CACHE_TTL,
      fromCache: true,
    });
  }

  const accessKey = process.env.PAAPI_ACCESS_KEY;
  const secretKey = process.env.PAAPI_SECRET_KEY;
  const partnerTag = process.env.PAAPI_PARTNER_TAG;

  // 認証情報がなければモックデータ
  if (!accessKey || !secretKey || !partnerTag) {
    return res.json({
      items: getMockItems(),
      cachedAt: now,
      nextUpdate: now + CACHE_TTL,
      fromCache: false,
      isMock: true,
    });
  }

  // PA-API 呼び出し
  const searches = [
    { keywords: "製菓道具 セール", searchIndex: "Kitchen" },
    { keywords: "お菓子作り 型 セール", searchIndex: "Kitchen" },
    { keywords: "ハンドミキサー 製菓", searchIndex: "Kitchen" },
    { keywords: "製菓用品 割引", searchIndex: "Kitchen" },
  ];

  const allItems = [];
  const seen = new Set();

  for (const search of searches) {
    try {
      const data = await callPAAPI(
        {
          Keywords: search.keywords,
          SearchIndex: search.searchIndex,
          PartnerTag: partnerTag,
          PartnerType: "Associates",
          Marketplace: "www.amazon.co.jp",
          Resources: [
            "Images.Primary.Medium",
            "ItemInfo.Title",
            "ItemInfo.ByLineInfo",
            "Offers.Listings.Price",
            "Offers.Listings.SavingBasis",
            "BrowseNodeInfo.BrowseNodes",
          ],
          ItemCount: 10,
          MinSavingPercent: 5,
        },
        accessKey,
        secretKey
      );

      const items = (data?.SearchResult?.Items || []).map((item) => {
        const listing = item.Offers?.Listings?.[0];
        const price = listing?.Price?.Amount ?? null;
        const basis = listing?.SavingBasis?.Amount ?? null;
        const discountPercent =
          basis && price
            ? Math.round(((basis - price) / basis) * 100)
            : null;
        const nodes =
          item.BrowseNodeInfo?.BrowseNodes?.map((n) => n.DisplayName || "") || [];
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

      // レートリミット対策
      await new Promise((r) => setTimeout(r, 1000));
    } catch (e) {
      console.error("PAAPI search error:", e.message);
    }
  }

  memoryCache = allItems;
  memoryCacheAt = now;

  return res.json({
    items: allItems,
    cachedAt: now,
    nextUpdate: now + CACHE_TTL,
    fromCache: false,
  });
};
