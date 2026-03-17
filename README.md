# YUM HOME STAY

ホームステイマッチングプラットフォーム - https://www.yumhomestay.com

## 概要

YUM HOME STAYは、ゲストとホストをつなぐホームステイマッチングプラットフォームです。

## 技術スタック

- **フロントエンド**: React + TypeScript + Vite + TailwindCSS
- **バックエンド**: Node.js + tRPC + Express
- **データベース**: TiDB Cloud (MySQL互換) + Drizzle ORM
- **決済**: Stripe
- **メール**: Resend
- **ストレージ**: AWS S3互換

## 環境変数

本番環境では以下の環境変数が必要です（`.env`ファイルは`.gitignore`に含まれています）:

| 変数名 | 説明 |
|--------|------|
| `DATABASE_URL` | TiDB Cloud接続URL |
| `STRIPE_SECRET_KEY` | Stripe秘密鍵 |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe公開鍵 |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhookシークレット |
| `RESEND_API_KEY` | Resend APIキー |
| `JWT_SECRET` | セッション用JWTシークレット |

## 開発環境のセットアップ

```bash
pnpm install
pnpm dev
```

## データベースマイグレーション

```bash
pnpm db:push
```

## 管理アカウント

- **チームアカウント**: business@inre.co.jp
- **GitHub**: gcimaster-glitch/yumhomestay
- **本番URL**: https://www.yumhomestay.com

---

© YUM HOME STAY / INRE Co., Ltd.
