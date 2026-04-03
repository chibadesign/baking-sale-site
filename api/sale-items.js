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
    "content-encoding:amz-1.0\n" +
    "content-type:application/json; charset=utf-8\n" +
    "host:" + PAAPI_HOST + "\n" +
    "x-amz-date:" + amzDate + "\n" +
    "x-amz-target:com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems\n";
  const signedHeaders = "content-encoding;content-type;host;x-amz-date;x-amz-target";
  const canonicalRequest = "POST\n" + PAAPI_PATH + "\n\n" + canonicalHeaders + "\n" + signedHeaders + "\n" + payloadHash;
  const credentialScope = dateStamp + "/" + PAAPI_REGION + "/" + service + "/aws4_request";
  const stringToSign = "AWS4-HMAC-SHA256\n" + amzDate + "\n" + credentialScope + "\n" +
    crypto.createHash("sha256").update(canonicalRequest).digest("hex");
  const hmac = (key, data) => crypto.createHmac("sha256", key).update(data).digest();
  const signingKey = hmac(hmac(hmac(hmac("AWS4" + secretKey, dateStamp), PAAPI_REGION), service), "aws4_request");
  const signature = hmac(signingKey, stringToSign).toString("hex");
  const authHeader = "AWS4-HMAC-SHA256 Credential=" + accessKey + "/" + credentialScope + ", " +
    "SignedHeaders=" + signedHeaders + ", Signature=" + signature;
  const response = await fetch("https://" + PAAPI_HOST + PAAPI_PATH, {
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
    throw new Error("PAAPI error " + response.status + ": " + text);
  }
  return response.json();
}

function detectCategory(nodes, title) {
  const text = [...nodes, title].join(" ").toLowerCase();
  if (/(ホームベーカリー|製パン機|ヨーグルトメーカー|フードプロセッサー|ハンドミキサー|スタンドミキサー|電動ミキサー|オーブン|電子レンジ)/.test(text)) return "キッチン家電";
  if (/(ケーキ型|マフィン型|タルト型|パン型|クッキー型|抜き型|シリコン型|天板|焼き型|ドーナツ型|プリン型|ゼリー型|パウンド型)/.test(text)) return "製菓型・天板";
  if (/(耐熱皿|パイ皿|グラタン|キャセロール|耐熱容器|ロールケーキ型)/.test(text)) return "耐熱皿・焼き型";
  if (/(絞り袋|デコレーション|アイシング|チョコペン|トッピング|スプリンクル|口金|デコ)/.test(text)) return "デコレーション用品";
  if (/(ケーキスタンド|ディスプレイスタンド|ケーキトッパー|クッキースタンプ|デコペン|ベーキングツール)/.test(text)) return "ベーキングツール・アクセサリ";
  if (/(計量|スケール|温度計|タイマー|めん棒|スパチュラ|ゴムベラ|泡立て|ふるい|こし器|パレット|刷毛|ブラシ|ケーキクーラー|冷却|ターンテーブル|カード|スクレーパー)/.test(text)) return "調理・製造道具";
  if (/(調理器具|包丁|フライパン|鍋|ボウル|ざる|まな板|泡立て器|ピーラー)/.test(text)) return "調理・製菓道具";
  if (/(製菓用品|お菓子用|菓子作り|製菓セット)/.test(text)) return "製菓用品";
  if (/(薄力粉|ベーキング|砂糖|バター|チョコ|バニラ|粉砂糖|ゼラチン|コーンスターチ|ナッツ|アーモンド|抹茶|ラム酒|食用色素|ドライフルーツ)/.test(text)) return "製菓材料";
  if (/(イースト|ドライイースト|強力粉|パン作り|製パン材料|パン材料)/.test(text)) return "製菓・製パン材料";
  if (/(クッキングシート|オーブンシート|ベーキングシート|アルミホイル|ワックスペーパー|シリコンマット)/.test(text)) return "クッキングシート・消耗品";
  if (/(ラッピング|ギフトボックス|袋|リボン|セロファン|梱包|包装|箱)/.test(text)) return "ラッピング・梱包";
  if (/(保存容器|タッパー|ジッパー|フリーザー|密閉|キャニスター)/.test(text)) return "保存容器";
  if (/(エプロン|手袋|ミトン|オーブンミトン|帽子|コック)/.test(text)) return "ウェア・小物";
  return "その他製菓用品";
}

function getMockItems() {
  return [
    { asin: "B001", title: "貝印 KAI シリコン マフィン型 6個取 DL-6287", brand: "貝印", imageUrl: null, price: 980, originalPrice: 1500, discountPercent: 35, rating: 4.5, reviewCount: 1243, detailPageUrl: "https://www.amazon.co.jp/dp/B001", category: "製菓型・天板", features: ["シリコン製で取り出し簡単", "食洗機対応"] },
    { asin: "B002", title: "WAHEI FREIZ ハンドミキサー 300W 5段階速度調節", brand: "WAHEI FREIZ", imageUrl: null, price: 2980, originalPrice: 4500, discountPercent: 34, rating: 4.3, reviewCount: 876, detailPageUrl: "https://www.amazon.co.jp/dp/B002", category: "キッチン家電", features: ["300W パワフル", "5段階速度調節"] },
    { asin: "B003", title: "貝印 KAI タルト型 底取 21cm DL-6192", brand: "貝印", imageUrl: null, price: 890, originalPrice: 1300, discountPercent: 32, rating: 4.6, reviewCount: 2105, detailPageUrl: "https://www.amazon.co.jp/dp/B003", category: "製菓型・天板", features: ["底取れタイプ", "フッ素加工"] },
    { asin: "B004", title: "Wilton ウィルトン デコレーション絞り袋セット 45点", brand: "Wilton", imageUrl: null, price: 1560, originalPrice: 2200, discountPercent: 29, rating: 4.4, reviewCount: 654, detailPageUrl: "https://www.amazon.co.jp/dp/B004", category: "デコレーション用品", features: ["45点フルセット", "口金24種類付き"] },
    { asin: "B005", title: "OXO グッドグリップス シリコン スパチュラ 3本セット", brand: "OXO", imageUrl: null, price: 1800, originalPrice: 2500, discountPercent: 28, rating: 4.7, reviewCount: 3421, detailPageUrl: "https://www.amazon.co.jp/dp/B005", category: "調理・製造道具", features: ["耐熱シリコン製", "食洗機対応"] },
    { asin: "B006", title: "タニタ デジタルクッキングスケール KD-321 1kg/0.1g", brand: "タニタ", imageUrl: null, price: 2480, originalPrice: 3200, discountPercent: 22, rating: 4.5, reviewCount: 5832, detailPageUrl: "https://www.amazon.co.jp/dp/B006", category: "調理・製造道具", features: ["0.1g単位", "ガラス天板"] },
    { asin: "B007", title: "パナソニック ホームベーカリー SD-MDX4-W", brand: "パナソニック", imageUrl: null, price: 18800, originalPrice: 25000, discountPercent: 25, rating: 4.4, reviewCount: 1987, detailPageUrl: "https://www.amazon.co.jp/dp/B007", category: "キッチン家電", features: ["天然酵母コース対応", "タイマー予約"] },
    { asin: "B008", title: "富澤商店 製菓用薄力粉 バイオレット 1kg", brand: "富澤商店", imageUrl: null, price: 398, originalPrice: 550, discountPercent: 28, rating: 4.6, reviewCount: 4312, detailPageUrl: "https://www.amazon.co.jp/dp/B008", category: "製菓材料", features: ["製菓専用薄力粉", "きめ細かい粒子"] },
    { asin: "B009", title: "クオカ 製菓用チョコレート クーベルチュール 500g", brand: "クオカ", imageUrl: null, price: 1280, originalPrice: 1800, discountPercent: 29, rating: 4.5, reviewCount: 789, detailPageUrl: "https://www.amazon.co.jp/dp/B009", category: "製菓材料", features: ["クーベルチュール", "テンパリング不要"] },
    { asin: "B010", title: "共立食品 バニラエッセンス 30ml", brand: "共立食品", imageUrl: null, price: 198, originalPrice: 280, discountPercent: 29, rating: 4.3, reviewCount: 2341, detailPageUrl: "https://www.amazon.co.jp/dp/B010", category: "製菓材料", features: ["天然バニラ使用", "少量でしっかり香る"] },
    { asin: "B011", title: "東洋アルミ クッキングシート 30cm×50枚", brand: "東洋アルミ", imageUrl: null, price: 398, originalPrice: 580, discountPercent: 31, rating: 4.7, reviewCount: 6721, detailPageUrl: "https://www.amazon.co.jp/dp/B011", category: "クッキングシート・消耗品", features: ["両面シリコン加工", "50枚入り"] },
    { asin: "B012", title: "HEIKO ギフトボックス マカロン用 10枚セット", brand: "HEIKO", imageUrl: null, price: 480, originalPrice: 680, discountPercent: 29, rating: 4.2, reviewCount: 345, detailPageUrl: "https://www.amazon.co.jp/dp/B012", category: "ラッピング・梱包", features: ["マカロン用設計", "おしゃれなデザイン"] },
    { asin: "B013", title: "iwaki イワキ 耐熱ガラス 保存容器 4点セット", brand: "iwaki", imageUrl: null, price: 2480, originalPrice: 3500, discountPercent: 29, rating: 4.6, reviewCount: 4123, detailPageUrl: "https://www.amazon.co.jp/dp/B013", category: "保存容器", features: ["耐熱ガラス製", "電子レンジ対応"] },
    { asin: "B014", title: "パール金属 ケーキクーラー 網 30×25cm", brand: "パール金属", imageUrl: null, price: 680, originalPrice: 980, discountPercent: 31, rating: 4.3, reviewCount: 876, detailPageUrl: "https://www.amazon.co.jp/dp/B014", category: "調理・製造道具", features: ["30×25cmサイズ", "ステンレス製"] },
    { asin: "B015", title: "TESCOMA テスコマ ターンテーブル 31cm", brand: "TESCOMA", imageUrl: null, price: 3200, originalPrice: 4500, discountPercent: 29, rating: 4.4, reviewCount: 532, detailPageUrl: "https://www.amazon.co.jp/dp/B015", category: "調理・製造道具", features: ["31cm大径", "スムーズ回転"] },
    { asin: "B016", title: "貝印 パレットナイフ 20cm DL-6240", brand: "貝印", imageUrl: null, price: 580, originalPrice: 850, discountPercent: 32, rating: 4.5, reviewCount: 1243, detailPageUrl: "https://www.amazon.co.jp/dp/B016", category: "調理・製造道具", features: ["ステンレス製", "L字型で使いやすい"] },
    { asin: "B017", title: "TESCOMA デジタル温度計 -50〜300度", brand: "TESCOMA", imageUrl: null, price: 1480, originalPrice: 2000, discountPercent: 26, rating: 4.3, reviewCount: 678, detailPageUrl: "https://www.amazon.co.jp/dp/B017", category: "調理・製造道具", features: ["-50〜300度対応", "2秒即時測定"] },
    { asin: "B018", title: "クオカ アーモンドプードル 200g", brand: "クオカ", imageUrl: null, price: 480, originalPrice: 680, discountPercent: 29, rating: 4.6, reviewCount: 1567, detailPageUrl: "https://www.amazon.co.jp/dp/B018", category: "製菓材料", features: ["皮なしアーモンド100%", "マカロンに最適"] },
    { asin: "B019", title: "富澤商店 粉糖 500g コーンスターチ不使用", brand: "富澤商店", imageUrl: null, price: 380, originalPrice: 520, discountPercent: 27, rating: 4.5, reviewCount: 2341, detailPageUrl: "https://www.amazon.co.jp/dp/B019", category: "製菓材料", features: ["コーンスターチ不使用", "アイシングに最適"] },
    { asin: "B020", title: "貝印 クッキー型 12種セット DL-6260", brand: "貝印", imageUrl: null, price: 780, originalPrice: 1200, discountPercent: 35, rating: 4.4, reviewCount: 987, detailPageUrl: "https://www.amazon.co.jp/dp/B020", category: "製菓型・天板", features: ["12種類の型", "ステンレス製"] },
    { asin: "B021", title: "cotta シリコンマット 40×30cm", brand: "cotta", imageUrl: null, price: 980, originalPrice: 1400, discountPercent: 30, rating: 4.5, reviewCount: 743, detailPageUrl: "https://www.amazon.co.jp/dp/B021", category: "クッキングシート・消耗品", features: ["繰り返し使える", "目盛り付き"] },
    { asin: "B022", title: "HEIKO OPP袋 クッキー用 100枚入り", brand: "HEIKO", imageUrl: null, price: 380, originalPrice: 550, discountPercent: 31, rating: 4.3, reviewCount: 432, detailPageUrl: "https://www.amazon.co.jp/dp/B022", category: "ラッピング・梱包", features: ["透明OPP素材", "100枚入りお得"] },
    { asin: "B023", title: "エコー金属 ステンレス ふるい 18cm", brand: "エコー金属", imageUrl: null, price: 480, originalPrice: 700, discountPercent: 31, rating: 4.4, reviewCount: 654, detailPageUrl: "https://www.amazon.co.jp/dp/B023", category: "調理・製造道具", features: ["18cmサイズ", "目が細かく均一"] },
    { asin: "B024", title: "recolte ソロブレンダー RSB-3", brand: "recolte", imageUrl: null, price: 5980, originalPrice: 8000, discountPercent: 25, rating: 4.2, reviewCount: 1234, detailPageUrl: "https://www.amazon.co.jp/dp/B024", category: "キッチン家電", features: ["コンパクト設計", "蓋付きカップ付属"] },
    { asin: "B025", title: "貝印 シフォンケーキ型 17cm DL-6195", brand: "貝印", imageUrl: null, price: 1080, originalPrice: 1600, discountPercent: 33, rating: 4.6, reviewCount: 1876, detailPageUrl: "https://www.amazon.co.jp/dp/B025", category: "製菓型・天板", features: ["17cmサイズ", "アルミ製で熱伝導抜群"] },
    { asin: "B026", title: "cotta 使い捨て絞り袋 100枚入り", brand: "cotta", imageUrl: null, price: 680, originalPrice: 980, discountPercent: 31, rating: 4.4, reviewCount: 543, detailPageUrl: "https://www.amazon.co.jp/dp/B026", category: "デコレーション用品", features: ["使い捨てで衛生的", "100枚入り"] },
    { asin: "B027", title: "共立食品 食用色素 6色セット", brand: "共立食品", imageUrl: null, price: 880, originalPrice: 1280, discountPercent: 31, rating: 4.3, reviewCount: 876, detailPageUrl: "https://www.amazon.co.jp/dp/B027", category: "デコレーション用品", features: ["6色セット", "少量で発色抜群"] },
    { asin: "B028", title: "山崎実業 キッチンエプロン シンプル", brand: "山崎実業", imageUrl: null, price: 1480, originalPrice: 2200, discountPercent: 33, rating: 4.2, reviewCount: 2341, detailPageUrl: "https://www.amazon.co.jp/dp/B028", category: "ウェア・小物", features: ["汚れにくい素材", "サイズ調節可能"] },
    { asin: "B029", title: "パール金属 パウンドケーキ型 3本セット", brand: "パール金属", imageUrl: null, price: 680, originalPrice: 980, discountPercent: 31, rating: 4.4, reviewCount: 1123, detailPageUrl: "https://www.amazon.co.jp/dp/B029", category: "製菓型・天板", features: ["3本セット", "フッ素加工"] },
    { asin: "B030", title: "cotta ドレジェ カラーシュガー 50g×5色", brand: "cotta", imageUrl: null, price: 680, originalPrice: 980, discountPercent: 31, rating: 4.1, reviewCount: 234, detailPageUrl: "https://www.amazon.co.jp/dp/B030", category: "デコレーション用品", features: ["5色セット", "ケーキ・クッキーに"] },
    { asin: "B031", title: "野田琺瑯 耐熱皿 ロースター 角型 27cm", brand: "野田琺瑯", imageUrl: null, price: 2800, originalPrice: 3800, discountPercent: 26, rating: 4.5, reviewCount: 987, detailPageUrl: "https://www.amazon.co.jp/dp/B031", category: "耐熱皿・焼き型", features: ["ホーロー製", "オーブン対応", "直火OK"] },
    { asin: "B032", title: "富士ホーロー パイ皿 24cm ホーロー製", brand: "富士ホーロー", imageUrl: null, price: 1980, originalPrice: 2800, discountPercent: 29, rating: 4.4, reviewCount: 654, detailPageUrl: "https://www.amazon.co.jp/dp/B032", category: "耐熱皿・焼き型", features: ["24cmサイズ", "ホーロー製で均一加熱"] },
    { asin: "B033", title: "ニトリ 耐熱ガラス グラタン皿 2枚セット", brand: "ニトリ", imageUrl: null, price: 890, originalPrice: 1280, discountPercent: 30, rating: 4.3, reviewCount: 2341, detailPageUrl: "https://www.amazon.co.jp/dp/B033", category: "耐熱皿・焼き型", features: ["耐熱ガラス製", "2枚セット", "食洗機対応"] },
    { asin: "B034", title: "KOKUBO ロールケーキ天板 28×28cm", brand: "KOKUBO", imageUrl: null, price: 1280, originalPrice: 1800, discountPercent: 29, rating: 4.2, reviewCount: 432, detailPageUrl: "https://www.amazon.co.jp/dp/B034", category: "耐熱皿・焼き型", features: ["28×28cmスクエア", "フッ素加工"] },
    { asin: "B035", title: "日清製粉 強力粉 カメリヤ 1kg", brand: "日清製粉", imageUrl: null, price: 298, originalPrice: 420, discountPercent: 29, rating: 4.7, reviewCount: 8921, detailPageUrl: "https://www.amazon.co.jp/dp/B035", category: "製菓・製パン材料", features: ["パン作りの定番", "グルテン豊富"] },
    { asin: "B036", title: "赤サフ ドライイースト 125g", brand: "Lesaffre", imageUrl: null, price: 580, originalPrice: 820, discountPercent: 29, rating: 4.8, reviewCount: 5432, detailPageUrl: "https://www.amazon.co.jp/dp/B036", category: "製菓・製パン材料", features: ["プロ仕様ドライイースト", "発酵力抜群"] },
    { asin: "B037", title: "富澤商店 全粒粉 500g 国産小麦", brand: "富澤商店", imageUrl: null, price: 480, originalPrice: 680, discountPercent: 29, rating: 4.5, reviewCount: 1234, detailPageUrl: "https://www.amazon.co.jp/dp/B037", category: "製菓・製パン材料", features: ["国産小麦100%", "食物繊維豊富"] },
    { asin: "B038", title: "cotta パン型 食パン型 1斤用", brand: "cotta", imageUrl: null, price: 1280, originalPrice: 1800, discountPercent: 29, rating: 4.4, reviewCount: 876, detailPageUrl: "https://www.amazon.co.jp/dp/B038", category: "製菓・製パン材料", features: ["1斤サイズ", "フッ素加工"] },
    { asin: "B039", title: "貝印 製菓用品 セット 8点 DL-6100", brand: "貝印", imageUrl: null, price: 2480, originalPrice: 3500, discountPercent: 29, rating: 4.5, reviewCount: 1543, detailPageUrl: "https://www.amazon.co.jp/dp/B039", category: "製菓用品", features: ["8点セット", "初心者に最適"] },
    { asin: "B040", title: "KATO'S キッチン製菓セット 初心者向け 12点", brand: "KATO'S", imageUrl: null, price: 1980, originalPrice: 2800, discountPercent: 29, rating: 4.3, reviewCount: 876, detailPageUrl: "https://www.amazon.co.jp/dp/B040", category: "製菓用品", features: ["12点フルセット", "収納袋付き"] },
    { asin: "B041", title: "パール金属 製菓道具セット 6点 ステンレス", brand: "パール金属", imageUrl: null, price: 1580, originalPrice: 2200, discountPercent: 28, rating: 4.2, reviewCount: 654, detailPageUrl: "https://www.amazon.co.jp/dp/B041", category: "製菓用品", features: ["ステンレス製6点", "錆びにくい"] },
    { asin: "B042", title: "Wilton ケーキスタンド 回転式 30cm", brand: "Wilton", imageUrl: null, price: 3200, originalPrice: 4500, discountPercent: 29, rating: 4.6, reviewCount: 987, detailPageUrl: "https://www.amazon.co.jp/dp/B042", category: "ベーキングツール・アクセサリ", features: ["回転式", "30cmプレート"] },
    { asin: "B043", title: "貝印 クッキースタンプ アルファベット 26個セット", brand: "貝印", imageUrl: null, price: 980, originalPrice: 1400, discountPercent: 30, rating: 4.3, reviewCount: 543, detailPageUrl: "https://www.amazon.co.jp/dp/B043", category: "ベーキングツール・アクセサリ", features: ["アルファベット26種", "プラスチック製"] },
    { asin: "B044", title: "TESCOMA ケーキトッパー スター 24本セット", brand: "TESCOMA", imageUrl: null, price: 680, originalPrice: 980, discountPercent: 31, rating: 4.1, reviewCount: 321, detailPageUrl: "https://www.amazon.co.jp/dp/B044", category: "ベーキングツール・アクセサリ", features: ["24本セット", "誕生日・パーティーに"] },
    { asin: "B045", title: "パール金属 シリコン製菓ブラシ 2本セット", brand: "パール金属", imageUrl: null, price: 480, originalPrice: 700, discountPercent: 31, rating: 4.4, reviewCount: 765, detailPageUrl: "https://www.amazon.co.jp/dp/B045", category: "ベーキングツール・アクセサリ", features: ["耐熱シリコン", "食洗機対応"] },
    { asin: "B046", title: "貝印 ステンレス ボウル 3点セット 18/20/23cm", brand: "貝印", imageUrl: null, price: 1980, originalPrice: 2800, discountPercent: 29, rating: 4.6, reviewCount: 3421, detailPageUrl: "https://www.amazon.co.jp/dp/B046", category: "調理・製菓道具", features: ["3サイズセット", "ステンレス製"] },
    { asin: "B047", title: "OXO ミニ泡立て器 22cm", brand: "OXO", imageUrl: null, price: 880, originalPrice: 1280, discountPercent: 31, rating: 4.7, reviewCount: 2341, detailPageUrl: "https://www.amazon.co.jp/dp/B047", category: "調理・製菓道具", features: ["ステンレスワイヤー", "握りやすいグリップ"] },
    { asin: "B048", title: "パール金属 めん棒 45cm ステンレス芯", brand: "パール金属", imageUrl: null, price: 780, originalPrice: 1100, discountPercent: 29, rating: 4.3, reviewCount: 876, detailPageUrl: "https://www.amazon.co.jp/dp/B048", category: "調理・製菓道具", features: ["45cmロング", "ステンレス芯で均一に伸ばせる"] },
    { asin: "B049", title: "富澤商店 製菓材料セット 初心者向け 6点", brand: "富澤商店", imageUrl: null, price: 1980, originalPrice: 2800, discountPercent: 29, rating: 4.5, reviewCount: 654, detailPageUrl: "https://www.amazon.co.jp/dp/B049", category: "製菓材料", features: ["薄力粉・砂糖・バニラ等6点", "すぐ作れる"] },
    { asin: "B050", title: "cotta ラッピング袋 リボン付き 50枚セット", brand: "cotta", imageUrl: null, price: 580, originalPrice: 820, discountPercent: 29, rating: 4.4, reviewCount: 543, detailPageUrl: "https://www.amazon.co.jp/dp/B050", category: "ラッピング・梱包", features: ["リボン付き", "50枚入り"] },
    { asin: "B051", title: "貝印 スケッパー カード型 DL-6225", brand: "貝印", imageUrl: null, price: 380, originalPrice: 550, discountPercent: 31, rating: 4.3, reviewCount: 765, detailPageUrl: "https://www.amazon.co.jp/dp/B051", category: "調理・製菓道具", features: ["カード型スケッパー", "生地を綺麗に切れる"] },
    { asin: "B052", title: "パール金属 シリコン ケーキ型 ハート 6個取", brand: "パール金属", imageUrl: null, price: 780, originalPrice: 1100, discountPercent: 29, rating: 4.2, reviewCount: 432, detailPageUrl: "https://www.amazon.co.jp/dp/B052", category: "製菓型・天板", features: ["ハート型6個取", "シリコン製"] },
    { asin: "B053", title: "cotta 抹茶パウダー 製菓用 50g", brand: "cotta", imageUrl: null, price: 480, originalPrice: 680, discountPercent: 29, rating: 4.6, reviewCount: 1234, detailPageUrl: "https://www.amazon.co.jp/dp/B053", category: "製菓材料", features: ["製菓専用抹茶", "色鮮やか"] },
    { asin: "B054", title: "富澤商店 グラニュー糖 1kg", brand: "富澤商店", imageUrl: null, price: 298, originalPrice: 420, discountPercent: 29, rating: 4.7, reviewCount: 5432, detailPageUrl: "https://www.amazon.co.jp/dp/B054", category: "製菓材料", features: ["製菓用グラニュー糖", "溶けやすい"] },
    { asin: "B055", title: "明治 ミルクチョコレート 製菓用 500g", brand: "明治", imageUrl: null, price: 980, originalPrice: 1400, discountPercent: 30, rating: 4.5, reviewCount: 3421, detailPageUrl: "https://www.amazon.co.jp/dp/B055", category: "製菓材料", features: ["製菓専用チョコ", "溶かしやすい板状"] },
    { asin: "B056", title: "貝印 ピザカッター ステンレス DL-6230", brand: "貝印", imageUrl: null, price: 580, originalPrice: 820, discountPercent: 29, rating: 4.4, reviewCount: 876, detailPageUrl: "https://www.amazon.co.jp/dp/B056", category: "調理・製菓道具", features: ["ステンレス刃", "洗いやすい"] },
    { asin: "B057", title: "パール金属 ワイヤーラック 2段 冷却用", brand: "パール金属", imageUrl: null, price: 1280, originalPrice: 1800, discountPercent: 29, rating: 4.3, reviewCount: 543, detailPageUrl: "https://www.amazon.co.jp/dp/B057", category: "ベーキングツール・アクセサリ", features: ["2段式", "省スペース"] },
    { asin: "B058", title: "HEIKO リボン 10色セット 10m×10巻", brand: "HEIKO", imageUrl: null, price: 880, originalPrice: 1280, discountPercent: 31, rating: 4.5, reviewCount: 765, detailPageUrl: "https://www.amazon.co.jp/dp/B058", category: "ラッピング・梱包", features: ["10色セット", "10m×10巻たっぷり"] },
    { asin: "B059", title: "貝印 タルトストーン セラミック 500g", brand: "貝印", imageUrl: null, price: 480, originalPrice: 680, discountPercent: 29, rating: 4.4, reviewCount: 654, detailPageUrl: "https://www.amazon.co.jp/dp/B059", category: "製菓用品", features: ["セラミック製", "繰り返し使用可能"] },
    { asin: "B060", title: "cotta アルミカップ 丸型 100枚入り", brand: "cotta", imageUrl: null, price: 380, originalPrice: 550, discountPercent: 31, rating: 4.3, reviewCount: 987, detailPageUrl: "https://www.amazon.co.jp/dp/B060", category: "クッキングシート・消耗品", features: ["アルミ製", "100枚入り"] },
    { asin: "B061", title: "富澤商店 無塩バター 200g 製菓用", brand: "富澤商店", imageUrl: null, price: 480, originalPrice: 680, discountPercent: 29, rating: 4.6, reviewCount: 2341, detailPageUrl: "https://www.amazon.co.jp/dp/B061", category: "製菓材料", features: ["無塩タイプ", "製菓専用"] },
    { asin: "B062", title: "パール金属 シリコン ドーナツ型 6個取", brand: "パール金属", imageUrl: null, price: 680, originalPrice: 980, discountPercent: 31, rating: 4.3, reviewCount: 543, detailPageUrl: "https://www.amazon.co.jp/dp/B062", category: "製菓型・天板", features: ["ドーナツ型6個取", "シリコン製"] },
    { asin: "B063", title: "貝印 絞り口金 セット 20個 DL-6270", brand: "貝印", imageUrl: null, price: 980, originalPrice: 1400, discountPercent: 30, rating: 4.5, reviewCount: 876, detailPageUrl: "https://www.amazon.co.jp/dp/B063", category: "デコレーション用品", features: ["20種類セット", "ステンレス製"] },
    { asin: "B064", title: "KOKUBO シリコン アイスキューブ型 星形 15個取", brand: "KOKUBO", imageUrl: null, price: 380, originalPrice: 550, discountPercent: 31, rating: 4.1, reviewCount: 321, detailPageUrl: "https://www.amazon.co.jp/dp/B064", category: "製菓型・天板", features: ["星形15個取", "チョコ・ゼリーにも"] },
    { asin: "B065", title: "貝印 ケーキ分割器 12等分 DL-6250", brand: "貝印", imageUrl: null, price: 680, originalPrice: 980, discountPercent: 31, rating: 4.4, reviewCount: 654, detailPageUrl: "https://www.amazon.co.jp/dp/B065", category: "ベーキングツール・アクセサリ", features: ["12等分カッター", "均等に切れる"] },
    { asin: "B066", title: "cotta グラシン紙 20×20cm 100枚", brand: "cotta", imageUrl: null, price: 280, originalPrice: 400, discountPercent: 30, rating: 4.4, reviewCount: 765, detailPageUrl: "https://www.amazon.co.jp/dp/B066", category: "クッキングシート・消耗品", features: ["グラシン紙100枚", "焼き菓子の仕切りに"] },
    { asin: "B067", title: "パール金属 ステンレス 計量スプーン 5本セット", brand: "パール金属", imageUrl: null, price: 480, originalPrice: 680, discountPercent: 29, rating: 4.6, reviewCount: 3421, detailPageUrl: "https://www.amazon.co.jp/dp/B067", category: "調理・製菓道具", features: ["5本セット", "ステンレス製"] },
    { asin: "B068", title: "OXO 計量カップ 500ml ガラス製", brand: "OXO", imageUrl: null, price: 1280, originalPrice: 1800, discountPercent: 29, rating: 4.7, reviewCount: 4321, detailPageUrl: "https://www.amazon.co.jp/dp/B068", category: "調理・製菓道具", features: ["500mlサイズ", "目盛り見やすい"] },
    { asin: "B069", title: "富澤商店 ゼラチン パウダー 500g", brand: "富澤商店", imageUrl: null, price: 880, originalPrice: 1280, discountPercent: 31, rating: 4.5, reviewCount: 1234, detailPageUrl: "https://www.amazon.co.jp/dp/B069", category: "製菓材料", features: ["粉末タイプ", "溶けやすい"] },
    { asin: "B070", title: "HEIKO ケーキ箱 4号 10枚セット", brand: "HEIKO", imageUrl: null, price: 680, originalPrice: 980, discountPercent: 31, rating: 4.3, reviewCount: 543, detailPageUrl: "https://www.amazon.co.jp/dp/B070", category: "ラッピング・梱包", features: ["4号サイズ", "10枚セット"] },
    { asin: "B071", title: "貝印 シリコン プリン型 6個取 DL-6290", brand: "貝印", imageUrl: null, price: 680, originalPrice: 980, discountPercent: 31, rating: 4.4, reviewCount: 876, detailPageUrl: "https://www.amazon.co.jp/dp/B071", category: "製菓型・天板", features: ["プリン型6個取", "シリコン製"] },
    { asin: "B072", title: "cotta ホワイトチョコレート 製菓用 200g", brand: "cotta", imageUrl: null, price: 480, originalPrice: 680, discountPercent: 29, rating: 4.5, reviewCount: 987, detailPageUrl: "https://www.amazon.co.jp/dp/B072", category: "製菓材料", features: ["ホワイトチョコ", "製菓専用"] },
    { asin: "B073", title: "パール金属 ステンレス タルトリング 9cm 3個セット", brand: "パール金属", imageUrl: null, price: 980, originalPrice: 1400, discountPercent: 30, rating: 4.3, reviewCount: 432, detailPageUrl: "https://www.amazon.co.jp/dp/B073", category: "製菓型・天板", features: ["9cmサイズ3個", "底なし"] },
    { asin: "B074", title: "Wilton フォンダン ローラー セット 5本", brand: "Wilton", imageUrl: null, price: 1280, originalPrice: 1800, discountPercent: 29, rating: 4.2, reviewCount: 321, detailPageUrl: "https://www.amazon.co.jp/dp/B074", category: "ベーキングツール・アクセサリ", features: ["フォンダン用", "5本セット"] },
    { asin: "B075", title: "富澤商店 コーンスターチ 500g 製菓用", brand: "富澤商店", imageUrl: null, price: 280, originalPrice: 400, discountPercent: 30, rating: 4.6, reviewCount: 2341, detailPageUrl: "https://www.amazon.co.jp/dp/B075", category: "製菓材料", features: ["製菓専用", "サクサク食感に"] },
    { asin: "B076", title: "貝印 ブレッドナイフ 21cm パン切り用", brand: "貝印", imageUrl: null, price: 1480, originalPrice: 2100, discountPercent: 30, rating: 4.7, reviewCount: 5432, detailPageUrl: "https://www.amazon.co.jp/dp/B076", category: "調理・製菓道具", features: ["21cmロング刃", "波刃でパンがきれい"] },
    { asin: "B077", title: "cotta マドレーヌ型 シリコン 12個取", brand: "cotta", imageUrl: null, price: 880, originalPrice: 1280, discountPercent: 31, rating: 4.4, reviewCount: 654, detailPageUrl: "https://www.amazon.co.jp/dp/B077", category: "製菓型・天板", features: ["マドレーヌ型12個", "シリコン製"] },
    { asin: "B078", title: "パール金属 アイシングカラー 12色セット", brand: "パール金属", imageUrl: null, price: 1280, originalPrice: 1800, discountPercent: 29, rating: 4.3, reviewCount: 543, detailPageUrl: "https://www.amazon.co.jp/dp/B078", category: "デコレーション用品", features: ["12色セット", "クッキーデコレーションに"] },
    { asin: "B079", title: "HEIKO セロファン袋 クリア 100枚入り", brand: "HEIKO", imageUrl: null, price: 480, originalPrice: 680, discountPercent: 29, rating: 4.4, reviewCount: 765, detailPageUrl: "https://www.amazon.co.jp/dp/B079", category: "ラッピング・梱包", features: ["透明セロファン", "100枚入り"] },
    { asin: "B080", title: "貝印 ステンレス 菜箸 33cm DL-6210", brand: "貝印", imageUrl: null, price: 380, originalPrice: 550, discountPercent: 31, rating: 4.5, reviewCount: 1234, detailPageUrl: "https://www.amazon.co.jp/dp/B080", category: "調理・製菓道具", features: ["33cm長め", "チョコテンパリングに"] },
    { asin: "B081", title: "富澤商店 ドライフルーツ ミックス 200g", brand: "富澤商店", imageUrl: null, price: 580, originalPrice: 820, discountPercent: 29, rating: 4.5, reviewCount: 876, detailPageUrl: "https://www.amazon.co.jp/dp/B081", category: "製菓材料", features: ["レーズン・クランベリー等", "パンやケーキに"] },
    { asin: "B082", title: "cotta スクエア型 18cm アルミ製", brand: "cotta", imageUrl: null, price: 980, originalPrice: 1400, discountPercent: 30, rating: 4.5, reviewCount: 654, detailPageUrl: "https://www.amazon.co.jp/dp/B082", category: "製菓型・天板", features: ["18cm正方形", "アルミ製"] },
    { asin: "B083", title: "パール金属 ベーキングシート 30枚入り 厚手", brand: "パール金属", imageUrl: null, price: 480, originalPrice: 680, discountPercent: 29, rating: 4.4, reviewCount: 987, detailPageUrl: "https://www.amazon.co.jp/dp/B083", category: "クッキングシート・消耗品", features: ["厚手タイプ", "30枚入り"] },
    { asin: "B084", title: "Wilton デコレーションペン 12色セット", brand: "Wilton", imageUrl: null, price: 880, originalPrice: 1280, discountPercent: 31, rating: 4.2, reviewCount: 432, detailPageUrl: "https://www.amazon.co.jp/dp/B084", category: "デコレーション用品", features: ["12色セット", "チョコペン"] },
    { asin: "B085", title: "貝印 ケーキ型 丸型 18cm アルミ DL-6180", brand: "貝印", imageUrl: null, price: 780, originalPrice: 1100, discountPercent: 29, rating: 4.6, reviewCount: 3421, detailPageUrl: "https://www.amazon.co.jp/dp/B085", category: "製菓型・天板", features: ["18cm丸型", "アルミ製"] },
    { asin: "B086", title: "富澤商店 ラム酒 製菓用 200ml", brand: "富澤商店", imageUrl: null, price: 680, originalPrice: 980, discountPercent: 31, rating: 4.6, reviewCount: 1543, detailPageUrl: "https://www.amazon.co.jp/dp/B086", category: "製菓材料", features: ["製菓専用ラム", "フルーツケーキに"] },
    { asin: "B087", title: "パール金属 クッキー型 動物セット 8個", brand: "パール金属", imageUrl: null, price: 580, originalPrice: 820, discountPercent: 29, rating: 4.3, reviewCount: 654, detailPageUrl: "https://www.amazon.co.jp/dp/B087", category: "製菓型・天板", features: ["動物型8種類", "子供に人気"] },
    { asin: "B088", title: "KOKUBO シリコン製菓ブラシ ハケ 3本セット", brand: "KOKUBO", imageUrl: null, price: 380, originalPrice: 550, discountPercent: 31, rating: 4.2, reviewCount: 321, detailPageUrl: "https://www.amazon.co.jp/dp/B088", category: "調理・製菓道具", features: ["3本セット", "シリコン製"] },
    { asin: "B089", title: "cotta ドライイチゴパウダー 30g", brand: "cotta", imageUrl: null, price: 380, originalPrice: 550, discountPercent: 31, rating: 4.5, reviewCount: 765, detailPageUrl: "https://www.amazon.co.jp/dp/B089", category: "製菓材料", features: ["フリーズドライ", "色鮮やかなピンク"] },
    { asin: "B090", title: "貝印 ガトーショコラ型 18cm DL-6185", brand: "貝印", imageUrl: null, price: 880, originalPrice: 1280, discountPercent: 31, rating: 4.4, reviewCount: 543, detailPageUrl: "https://www.amazon.co.jp/dp/B090", category: "製菓型・天板", features: ["18cmサイズ", "フッ素加工"] },
    { asin: "B091", title: "富澤商店 ナパージュ 200g ケーキコーティング用", brand: "富澤商店", imageUrl: null, price: 480, originalPrice: 680, discountPercent: 29, rating: 4.3, reviewCount: 432, detailPageUrl: "https://www.amazon.co.jp/dp/B091", category: "製菓材料", features: ["ケーキのコーティングに", "つやが出る"] },
    { asin: "B092", title: "パール金属 耐熱ガラス パイ皿 22cm", brand: "パール金属", imageUrl: null, price: 880, originalPrice: 1280, discountPercent: 31, rating: 4.5, reviewCount: 876, detailPageUrl: "https://www.amazon.co.jp/dp/B092", category: "耐熱皿・焼き型", features: ["22cmパイ皿", "耐熱ガラス"] },
    { asin: "B093", title: "cotta 強力粉 はるゆたかブレンド 1kg", brand: "cotta", imageUrl: null, price: 480, originalPrice: 680, discountPercent: 29, rating: 4.7, reviewCount: 2341, detailPageUrl: "https://www.amazon.co.jp/dp/B093", category: "製菓・製パン材料", features: ["はるゆたかブレンド", "パンが美味しく"] },
    { asin: "B094", title: "貝印 キャニスター 密閉容器 1.2L", brand: "貝印", imageUrl: null, price: 980, originalPrice: 1400, discountPercent: 30, rating: 4.4, reviewCount: 654, detailPageUrl: "https://www.amazon.co.jp/dp/B094", category: "保存容器", features: ["1.2L容量", "密閉性抜群"] },
    { asin: "B095", title: "Wilton スプリングフォーム型 24cm", brand: "Wilton", imageUrl: null, price: 1480, originalPrice: 2100, discountPercent: 30, rating: 4.5, reviewCount: 987, detailPageUrl: "https://www.amazon.co.jp/dp/B095", category: "製菓型・天板", features: ["底が外れる", "24cmサイズ"] },
    { asin: "B096", title: "パール金属 シフォンナイフ 製菓用", brand: "パール金属", imageUrl: null, price: 580, originalPrice: 820, discountPercent: 29, rating: 4.3, reviewCount: 432, detailPageUrl: "https://www.amazon.co.jp/dp/B096", category: "調理・製菓道具", features: ["シフォンケーキ用", "細い刃"] },
    { asin: "B097", title: "cotta ピスタチオパウダー 100g", brand: "cotta", imageUrl: null, price: 680, originalPrice: 980, discountPercent: 31, rating: 4.6, reviewCount: 765, detailPageUrl: "https://www.amazon.co.jp/dp/B097", category: "製菓材料", features: ["鮮やかな緑色", "マカロンに最適"] },
    { asin: "B098", title: "HEIKO ケーキドーム 透明 30cm用", brand: "HEIKO", imageUrl: null, price: 880, originalPrice: 1280, discountPercent: 31, rating: 4.2, reviewCount: 321, detailPageUrl: "https://www.amazon.co.jp/dp/B098", category: "ベーキングツール・アクセサリ", features: ["30cmケーキ対応", "埃防止"] },
    { asin: "B099", title: "富澤商店 純ココアパウダー 100g", brand: "富澤商店", imageUrl: null, price: 380, originalPrice: 550, discountPercent: 31, rating: 4.7, reviewCount: 4321, detailPageUrl: "https://www.amazon.co.jp/dp/B099", category: "製菓材料", features: ["純ココア100%", "チョコ菓子に"] },
    { asin: "B100", title: "貝印 マジパン ローラー セット 製菓用", brand: "貝印", imageUrl: null, price: 1280, originalPrice: 1800, discountPercent: 29, rating: 4.3, reviewCount: 543, detailPageUrl: "https://www.amazon.co.jp/dp/B100", category: "ベーキングツール・アクセサリ", features: ["マジパン用ローラー", "模様つけに"] },
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
    { keywords: "耐熱皿 製菓", searchIndex: "Kitchen" },
    { keywords: "ドライイースト パン作り", searchIndex: "Grocery" },
    { keywords: "ケーキスタンド 製菓", searchIndex: "Kitchen" },
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
          "CustomerReviews.Count",
          "CustomerReviews.StarRating",
        ],
        ItemCount: 10,
        MinSavingPercent: 5,
      }, accessKey, secretKey);

      const items = (data && data.SearchResult && data.SearchResult.Items ? data.SearchResult.Items : []).map(function(item) {
        const listing = item.Offers && item.Offers.Listings && item.Offers.Listings[0] ? item.Offers.Listings[0] : null;
        const price = listing && listing.Price ? listing.Price.Amount : null;
        const basis = listing && listing.SavingBasis ? listing.SavingBasis.Amount : null;
        const discountPercent = basis && price ? Math.round(((basis - price) / basis) * 100) : null;
        const nodes = item.BrowseNodeInfo && item.BrowseNodeInfo.BrowseNodes ? item.BrowseNodeInfo.BrowseNodes.map(function(n) { return n.DisplayName || ""; }) : [];
        const title = item.ItemInfo && item.ItemInfo.Title ? item.ItemInfo.Title.DisplayValue : "";
        return {
          asin: item.ASIN,
          title: title,
          brand: item.ItemInfo && item.ItemInfo.ByLineInfo && item.ItemInfo.ByLineInfo.Brand ? item.ItemInfo.ByLineInfo.Brand.DisplayValue : null,
          imageUrl: item.Images && item.Images.Primary && item.Images.Primary.Medium ? item.Images.Primary.Medium.URL : null,
          price: price,
          originalPrice: basis,
          discountPercent: discountPercent,
          detailPageUrl: "https://www.amazon.co.jp/dp/" + item.ASIN + "?tag=" + partnerTag,
          category: detectCategory(nodes, title),
          features: item.ItemInfo && item.ItemInfo.Features ? item.ItemInfo.Features.DisplayValues : [],
          rating: item.CustomerReviews && item.CustomerReviews.StarRating ? item.CustomerReviews.StarRating.Value : null,
          reviewCount: item.CustomerReviews && item.CustomerReviews.Count ? item.CustomerReviews.Count : null,
        };
      });

      for (const item of items) {
        if (!seen.has(item.asin) && item.discountPercent > 0) {
          seen.add(item.asin);
          allItems.push(item);
        }
      }
      await new Promise(function(r) { setTimeout(r, 1000); });
    } catch (e) {
      console.error("PAAPI search error:", e.message);
    }
  }

  memoryCache = allItems;
  memoryCacheAt = now;
  return res.json({ items: allItems, cachedAt: now, nextUpdate: now + CACHE_TTL, fromCache: false });
};
// ※ この行は追加用ダミー - 実際の追加はgetMockItemsに行います
