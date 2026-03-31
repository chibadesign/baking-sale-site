# 🍰 製菓道具 セール情報サイト（Vercel版・完全無料）

## 構成

| 役割 | サービス | 料金 |
|---|---|---|
| フロントエンド | Vercel Hosting | 無料 |
| APIサーバー | Vercel Serverless Functions | 無料 |
| キャッシュ | メモリ + localStorage | 無料 |
| Amazon連携 | PA-API v5 | 無料（アソシエイト登録必要） |

---

## セットアップ手順

### ステップ1：GitHubにコードをアップロード

1. https://github.com にアクセスしてアカウント作成（または既存アカウントでログイン）
2. 右上「＋」→「New repository」をクリック
3. Repository name: `baking-sale-site`
4. 「Create repository」をクリック
5. ターミナルで以下を実行：

```bash
cd baking-sale-site-vercel   # このフォルダに移動
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/あなたのユーザー名/baking-sale-site.git
git push -u origin main
```

---

### ステップ2：Vercelにデプロイ

1. https://vercel.com にアクセス
2. 「Sign Up」→「Continue with GitHub」でGitHubでログイン
3. 「Add New Project」→ `baking-sale-site` リポジトリを選択
4. 「Deploy」をクリック（設定不要でそのまま）
5. しばらく待つとURLが発行される（例: `https://baking-sale-site.vercel.app`）

この時点でデモデータが表示されるサイトが完成！

---

### ステップ3：PA-API キーを設定する（本番データ表示）

**① Amazonアソシエイトに登録**
https://affiliate.amazon.co.jp/

**② PA-APIのアクセスキーを取得**
アソシエイト登録後、以下から申請：
https://affiliate.amazon.co.jp/assoc_credentials/home

**③ VercelにAPIキーを設定**

Vercelのダッシュボードで：
1. プロジェクト → 「Settings」タブ
2. 「Environment Variables」をクリック
3. 以下の3つを追加：

| 変数名 | 値 |
|---|---|
| `PAAPI_ACCESS_KEY` | アクセスキーID |
| `PAAPI_SECRET_KEY` | シークレットキー |
| `PAAPI_PARTNER_TAG` | トラッキングID（例: yourname-22） |

4. 「Save」後、「Deployments」タブから「Redeploy」

これで本番データが表示されます！

---

## ローカルで動作確認する方法

```bash
npm install
npm start
```

ブラウザで http://localhost:3000 を開く。
（PA-APIキーなしでもデモデータで動作確認できます）

---

## ファイル構成

```
baking-sale-site-vercel/
├── api/
│   └── sale-items.js      ← サーバー側API（PA-API呼び出し・キャッシュ）
├── src/
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── FilterBar.tsx
│   │   ├── ProductCard.tsx
│   │   └── UI.tsx         ← Skeleton + MobileFilterDrawer
│   ├── hooks/
│   │   └── useSaleData.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── index.tsx
│   └── index.css
├── public/
│   └── index.html
├── vercel.json
└── package.json
```
