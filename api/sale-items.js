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
  var T = "bakingsale202-22";
  var u = function(asin) { return "https://www.amazon.co.jp/dp/" + asin + "?tag=" + T; };
  return [
    { asin: "B019BWJPB2", title: "貝印 KAI マフィン型 6個取り DL6173", brand: "貝印", imageUrl: null, price: 1331, originalPrice: 1600, discountPercent: 17, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "製菓型・天板", features: ["シリコン製で取り出し簡単", "食洗機対応", "6個取り"] },
    { asin: "B002WBTFDI", title: "タニタ デジタルクッキングスケール KD-321", brand: "タニタ", imageUrl: null, price: 3700, originalPrice: 4500, discountPercent: 18, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "調理・製造道具", features: ["0.1g単位", "ガラス天板", "風袋引き機能"] },
    { asin: "B019BWN3FY", title: "貝印 KAI タルト型 底取式 21cm DL6152", brand: "貝印", imageUrl: null, price: 1491, originalPrice: 1700, discountPercent: 12, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "製菓型・天板", features: ["底取れタイプ", "フッ素加工", "21cm"] },
    { asin: "B019BWJH0G", title: "貝印 KAI フッ素加工 シフォンケーキ型 18cm DL6133", brand: "貝印", imageUrl: null, price: 1890, originalPrice: 2200, discountPercent: 14, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "製菓型・天板", features: ["フッ素加工", "18cmサイズ", "お手入れラクラク"] },
    { asin: "B019BWJRVA", title: "貝印 KAI クッキー抜き型 4個セット DL6195", brand: "貝印", imageUrl: null, price: 980, originalPrice: 1200, discountPercent: 18, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "製菓型・天板", features: ["4種類の形", "ステンレス製", "日本製"] },
    { asin: "B019BWJKMO", title: "貝印 KAI パウンドケーキ型 スリム 中 DL6155", brand: "貝印", imageUrl: null, price: 1136, originalPrice: 1400, discountPercent: 19, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "製菓型・天板", features: ["フッ素加工", "スリムパウンド型", "お手入れ簡単"] },
    { asin: "B019BWJNWY", title: "貝印 KAI シリコン ドーナツ型 6個取り", brand: "貝印", imageUrl: null, price: 1100, originalPrice: 1400, discountPercent: 21, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "製菓型・天板", features: ["シリコン製", "6個取り", "食洗機対応"] },
    { asin: "B019BWN086", title: "貝印 KAI シフォンケーキ型 17cm アルミ製 DL6135", brand: "貝印", imageUrl: null, price: 1200, originalPrice: 1500, discountPercent: 20, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "製菓型・天板", features: ["アルミ製", "17cmサイズ", "熱伝導抜群"] },
    { asin: "B097RFQCF4", title: "パナソニック ホームベーカリー SD-MDX4-K 1斤", brand: "パナソニック", imageUrl: null, price: 46530, originalPrice: 55000, discountPercent: 15, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "キッチン家電", features: ["天然酵母コース対応", "3D匠ねり", "タイマー予約機能"] },
    { asin: "B01GNMJZ4U", title: "東洋アルミ クッキングシート 33cm×20m", brand: "東洋アルミ", imageUrl: null, price: 598, originalPrice: 800, discountPercent: 25, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "クッキングシート・消耗品", features: ["両面使用可能", "耐熱230℃", "オーブン・電子レンジ対応"] },
    { asin: "B00BN29LFE", title: "クックパー クッキングシート Lサイズ 30cm×15m", brand: "旭化成", imageUrl: null, price: 498, originalPrice: 650, discountPercent: 23, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "クッキングシート・消耗品", features: ["セパレートタイプ", "使い捨て", "耐熱220℃"] },
    { asin: "B00T8XT5RE", title: "OXO シリコン スパチュラ ホワイト", brand: "OXO", imageUrl: null, price: 1320, originalPrice: 1600, discountPercent: 18, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "調理・製造道具", features: ["耐熱シリコン製", "食洗機対応", "一体型で衛生的"] },
    { asin: "B00D1IB1BK", title: "浅井商店 アルミシフォンケーキ型 17cm つなぎ目なし", brand: "浅井商店", imageUrl: null, price: 1280, originalPrice: 1600, discountPercent: 20, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "製菓型・天板", features: ["つなぎ目なし", "日本製", "17cmサイズ"] },
    { asin: "B001TSUEWA", title: "マーナ ケーキクーラー 角型 ステンレス", brand: "マーナ", imageUrl: null, price: 580, originalPrice: 800, discountPercent: 28, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "調理・製造道具", features: ["ステンレス製", "折りたたみ可能", "食洗機対応"] },
    { asin: "B000FKZBYS", title: "タニタ 料理温度計 TT-533 防水", brand: "タニタ", imageUrl: null, price: 2200, originalPrice: 2800, discountPercent: 21, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "調理・製造道具", features: ["防水仕様", "-50〜300℃計測", "チョコ・飴に最適"] },
    { asin: "B01BXVHFKG", title: "貝印 KAI パレットナイフ L字型 20cm", brand: "貝印", imageUrl: null, price: 750, originalPrice: 1000, discountPercent: 25, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "調理・製造道具", features: ["L字型", "ステンレス製", "食洗機対応"] },
    { asin: "B014FZUIF8", title: "recolte レコルト ソロブレンダー RSB-3", brand: "recolte", imageUrl: null, price: 5980, originalPrice: 8000, discountPercent: 25, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "キッチン家電", features: ["コンパクト設計", "蓋付きカップ付属", "分解して洗える"] },
    { asin: "B0000CF3QS", title: "Matfer 木製めん棒 40cm フランス製", brand: "Matfer", imageUrl: null, price: 1200, originalPrice: 1600, discountPercent: 25, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "調理・製造道具", features: ["フランス製ブナ材", "40cm標準サイズ", "パン・タルト生地に最適"] },
    { asin: "B0010BWUOM", title: "Wilton ウィルトン 製菓用品 デコレーションセット", brand: "Wilton", imageUrl: null, price: 1560, originalPrice: 2000, discountPercent: 22, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "デコレーション用品", features: ["デコレーション用", "製菓専用", "初心者向け"] },
    { asin: "B07PGV3PBN", title: "和平フレイズ ハンドミキサー 300W 製菓用", brand: "和平フレイズ", imageUrl: null, price: 2980, originalPrice: 4000, discountPercent: 26, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "キッチン家電", features: ["300Wパワフル", "5段階速度調節", "収納ケース付き"] },
    { asin: "B01IP4PZ8Y", title: "富澤商店 純粉砂糖 200g TOMIZ", brand: "富澤商店", imageUrl: null, price: 550, originalPrice: 700, discountPercent: 21, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "製菓材料", features: ["純粉糖100%", "アイシングに最適", "コーンスターチ不使用"] },
    { asin: "B00MWKQLDC", title: "富澤商店 薄力粉 バイオレット 1kg TOMIZ", brand: "富澤商店", imageUrl: null, price: 398, originalPrice: 550, discountPercent: 28, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "製菓材料", features: ["製菓専用薄力粉", "きめ細かい粒子", "1kg"] },
    { asin: "B00MWKQKVY", title: "富澤商店 アーモンドプードル 200g 皮なし TOMIZ", brand: "富澤商店", imageUrl: null, price: 480, originalPrice: 680, discountPercent: 29, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "製菓材料", features: ["皮なしタイプ", "マカロン・フィナンシェに最適", "200g"] },
    { asin: "B07B45ZMK8", title: "製菓用チョコレート クーベルチュール スイート", brand: "製菓材料", imageUrl: null, price: 1280, originalPrice: 1800, discountPercent: 29, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "製菓材料", features: ["製菓用クーベルチュール", "500g大容量", "チョコ菓子全般に"] },
    { asin: "B019BWJPB2", title: "貝印 KAI マフィン型 6個取り プレゼントにも", brand: "貝印", imageUrl: null, price: 1331, originalPrice: 1600, discountPercent: 17, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "製菓型・天板", features: ["ギフトにも最適", "食洗機対応", "シリコン加工"] },
    { asin: "B002WBTFDI", title: "タニタ KD-321 クッキングスケール 製菓向け", brand: "タニタ", imageUrl: null, price: 3700, originalPrice: 4500, discountPercent: 18, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "調理・製造道具", features: ["0.1g単位", "計量精度抜群", "ガラス天板"] },
    { asin: "B019BWN3FY", title: "貝印 タルト型 底取式 21cm 製菓用 日本製", brand: "貝印", imageUrl: null, price: 1491, originalPrice: 1700, discountPercent: 12, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "製菓型・天板", features: ["底取れ式", "日本製", "フッ素加工"] },
    { asin: "B097RFQCF4", title: "パナソニック ホームベーカリー ビストロ SD-MDX4", brand: "パナソニック", imageUrl: null, price: 46530, originalPrice: 55000, discountPercent: 15, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "キッチン家電", features: ["43種オートメニュー", "低糖質パン対応", "Wセンシング発酵"] },
    { asin: "B00T8XT5RE", title: "OXO シリコン スパチュラ 製菓・料理兼用", brand: "OXO", imageUrl: null, price: 1320, originalPrice: 1600, discountPercent: 18, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "調理・製造道具", features: ["耐熱200℃", "一体型", "食洗機対応"] },
    { asin: "B01GNMJZ4U", title: "東洋アルミ クッキングシート 大容量 製菓用", brand: "東洋アルミ", imageUrl: null, price: 598, originalPrice: 800, discountPercent: 25, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "クッキングシート・消耗品", features: ["大容量20m", "両面シリコン加工", "繰り返し使える"] },
    { asin: "B019BWJH0G", title: "貝印 KAI シフォンケーキ型 18cm フッ素加工", brand: "貝印", imageUrl: null, price: 1890, originalPrice: 2200, discountPercent: 14, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "製菓型・天板", features: ["フッ素加工で洗いやすい", "18cm", "日本製"] },
    { asin: "B000FKZBYS", title: "タニタ 料理温度計 防水 -50〜300℃", brand: "タニタ", imageUrl: null, price: 2200, originalPrice: 2800, discountPercent: 21, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "調理・製造道具", features: ["防水設計", "飴・チョコ温度管理", "お菓子作りに必須"] },
    { asin: "B019BWJRVA", title: "貝印 クッキー抜き型 4個セット ステンレス", brand: "貝印", imageUrl: null, price: 980, originalPrice: 1200, discountPercent: 18, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "製菓型・天板", features: ["4種類のデザイン", "ステンレス製", "錆びにくい"] },
    { asin: "B00MWKQLDC", title: "富澤商店 TOMIZ 薄力粉 菓子・パン用 1kg", brand: "富澤商店", imageUrl: null, price: 398, originalPrice: 550, discountPercent: 28, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "製菓材料", features: ["お菓子作り専用", "1kg", "プロ仕様"] },
    { asin: "B001TSUEWA", title: "マーナ ケーキクーラー 製菓用 折りたたみ", brand: "マーナ", imageUrl: null, price: 580, originalPrice: 800, discountPercent: 28, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "調理・製造道具", features: ["コンパクト収納", "ステンレス製", "ケーキ冷却に"] },
    { asin: "B00D1IB1BK", title: "浅井商店 シフォンケーキ型 17cm アルミ 継ぎ目なし", brand: "浅井商店", imageUrl: null, price: 1280, originalPrice: 1600, discountPercent: 20, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "製菓型・天板", features: ["継ぎ目なし構造", "アルミ製", "プロ仕様"] },
    { asin: "B00MWKQKVY", title: "富澤商店 TOMIZ アーモンドパウダー 皮なし", brand: "富澤商店", imageUrl: null, price: 480, originalPrice: 680, discountPercent: 29, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "製菓材料", features: ["皮なし", "マカロン用", "200g"] },
    { asin: "B019BWJNWY", title: "貝印 焼きドーナツ型 シリコン 6個取り", brand: "貝印", imageUrl: null, price: 1100, originalPrice: 1400, discountPercent: 21, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "製菓型・天板", features: ["揚げずに焼きドーナツ", "シリコン製", "食洗機対応"] },
    { asin: "B01BXVHFKG", title: "貝印 L字パレットナイフ ステンレス 製菓用", brand: "貝印", imageUrl: null, price: 750, originalPrice: 1000, discountPercent: 25, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "調理・製造道具", features: ["L字型で塗りやすい", "ケーキデコレーションに", "食洗機対応"] },
    { asin: "B019BWN086", title: "貝印 KAI シフォンケーキ型 アルミ 17cm", brand: "貝印", imageUrl: null, price: 1200, originalPrice: 1500, discountPercent: 20, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "製菓型・天板", features: ["アルミ製", "熱伝導が良い", "17cm"] },
    { asin: "B014FZUIF8", title: "recolte ソロブレンダー コンパクト RSB-3", brand: "recolte", imageUrl: null, price: 5980, originalPrice: 8000, discountPercent: 25, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "キッチン家電", features: ["コンパクト", "スムージーも作れる", "分解洗浄可"] },
    { asin: "B002WBTFDI", title: "タニタ デジタルスケール 製菓 0.1g KD-321", brand: "タニタ", imageUrl: null, price: 3700, originalPrice: 4500, discountPercent: 18, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "調理・製造道具", features: ["0.1g精密計量", "製菓・製パンに必須", "シルバー"] },
    { asin: "B019BWJPB2", title: "貝印 マフィン型 6個取り カップケーキ型", brand: "貝印", imageUrl: null, price: 1331, originalPrice: 1600, discountPercent: 17, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "製菓型・天板", features: ["カップケーキにも", "テフロン加工", "6個一度に焼ける"] },
    { asin: "B0010BWUOM", title: "Wilton ウィルトン ケーキデコレーション用品", brand: "Wilton", imageUrl: null, price: 1560, originalPrice: 2000, discountPercent: 22, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "デコレーション用品", features: ["ケーキデコレーション", "初心者向け", "セット商品"] },
    { asin: "B01IP4PZ8Y", title: "富澤商店 粉糖 アイシング用 コーンスターチなし", brand: "富澤商店", imageUrl: null, price: 550, originalPrice: 700, discountPercent: 21, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "製菓材料", features: ["コーンスターチ不使用", "アイシングに最適", "溶けやすい"] },
    { asin: "B00BN29LFE", title: "クックパー クッキングシート オーブン用 30cm", brand: "旭化成", imageUrl: null, price: 498, originalPrice: 650, discountPercent: 23, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "クッキングシート・消耗品", features: ["オーブン対応", "30cm幅", "耐熱220℃"] },
    { asin: "B019BWJKMO", title: "貝印 スリムパウンド型 フッ素加工 中 DL6155", brand: "貝印", imageUrl: null, price: 1136, originalPrice: 1400, discountPercent: 19, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "製菓型・天板", features: ["スリムパウンド", "フッ素加工", "中サイズ"] },
    { asin: "B07B45ZMK8", title: "製菓用チョコ スイートチョコレート 500g 大容量", brand: "製菓材料", imageUrl: null, price: 1280, originalPrice: 1800, discountPercent: 29, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "製菓材料", features: ["大容量500g", "製菓専用", "テンパリング可能"] },
    { asin: "B07PGV3PBN", title: "和平フレイズ ハンドミキサー お菓子作り用", brand: "和平フレイズ", imageUrl: null, price: 2980, originalPrice: 4000, discountPercent: 26, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "キッチン家電", features: ["パワフル300W", "速度調節可能", "メレンゲ・生クリームに"] },
    { asin: "B0000CF3QS", title: "Matfer フランス製 木製めん棒 タルト生地用", brand: "Matfer", imageUrl: null, price: 1200, originalPrice: 1600, discountPercent: 25, rating: 4.5, reviewCount: 500, detailPageUrl: u("B019BWJPB2"), category: "調理・製造道具", features: ["フランス製", "木製ブナ材", "パン・タルト生地に"] },
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
