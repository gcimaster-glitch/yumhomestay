# YumHomeStay リリース監査レポート
**監査日**: 2026-03-04  
**監査基準**: 上場企業SaaSリリース水準  
**監査チーム**: 5名（機能・セキュリティ・UI/UX・モバイル・決済）

---

## 総合評価

| 領域 | 評価 | 状態 |
|------|------|------|
| アカウント登録・ログイン | ★★★★☆ | 実装済み（Manus OAuth） |
| 予約フロー（ゲスト→ホスト→成立） | ★★★☆☆ | **一部未実装** |
| 決済（Stripe） | ★★★★☆ | 実装済み（要テスト） |
| eKYC（本人確認） | ★★☆☆☆ | **UIのみ・バックエンド未実装** |
| 管理者機能 | ★★★★☆ | 実装済み（詳細確認要） |
| お問い合わせ | ★★★★☆ | 実装済み（notifyOwner経由） |
| セキュリティ | ★★★☆☆ | **helmet/rate-limit未設定** |
| 文字視認性 | ★★★★☆ | 概ね良好 |
| モバイル対応 | ★★★★☆ | 概ね良好 |
| パートナーLP単価非公開 | ★★★★★ | 実装済み |

---

## 詳細監査結果

### 1. アカウント登録・ログイン ✅

- **ゲスト**: Manus OAuth経由でログイン可能。新規登録はOAuthプロバイダー側で処理。
- **ホスト**: `/host/register` でStripe決済（登録料）後にホスト登録。承認フロー（pending→interview→approved）実装済み。
- **料理教室**: `/cooking-school/register` で登録。管理者承認フロー実装済み。
- **旅行代理店**: LP経由でリード登録。ダッシュボード（`/agent/dashboard`）実装済み。
- **管理者**: ロールベースアクセス制御（`adminProcedure`）実装済み。

**課題**: eメール認証フロー（`requestEmailChange` / `confirmEmailChange`）は実装済みだが、初回登録時のメール確認は未実装。

---

### 2. 予約フロー ⚠️ 一部未実装

**現在の実装**:
- ゲスト申込（`/apply`）→ `inquiry.submit` でinquiry作成 ✅
- 管理者がホストに連絡（`inquiry.adminContactHost`）✅
- 管理者がマッチング確定（`inquiry.confirm`）✅
- ホスト側の予約確認・完了（`booking.confirm` / `booking.complete`）✅

**未実装・不完全な点**:
1. **ホストが直接予約を受け入れる/断るフロー**: `booking.confirm` はホスト側から呼べるが、ゲストApplyからBookingへの変換フローが管理者依存。ホストが自分でinquiryに応答するUIが不明確。
2. **料理教室の予約フロー**: `CookingSchoolDetail.tsx` から直接予約できるか未確認。
3. **予約成立後の通知**: 実装済みだが、ゲストへのメール通知の完全性要確認。

---

### 3. 決済 ✅

- Stripe Checkout Session実装済み（`payment.createCheckout`）
- Webhook処理実装済み（`/api/stripe/webhook`）
- ホスト登録料決済実装済み
- テスト用カード: `4242 4242 4242 4242`
- **本番環境**: Settings → Payment でライブキー設定が必要

---

### 4. eKYC（本人確認） ❌ 未実装

**現状**:
- DBスキーマ: `identityStatus` フィールド存在（`unverified/pending/verified/failed`）
- `passportInfoEncrypted` フィールド存在（AES暗号化想定）
- Profile.tsxでステータス表示のみ
- **バックエンドのKYC提出エンドポイントが存在しない**
- **管理者によるKYC審査UIが不完全**（AdminDashboardでステータス表示のみ）

**必要な実装**:
1. `user.submitKyc` プロシージャ（パスポート画像アップロード + 暗号化保存）
2. `admin.approveKyc` / `admin.rejectKyc` プロシージャ
3. Profile.tsxにKYC申請フォーム追加
4. AdminDashboardにKYC審査UI追加

---

### 5. 管理者機能 ✅ 概ね実装済み

- ユーザー一覧・編集: AdminDashboardで実装済み
- ホスト審査（pending→interview→approved/rejected）: 実装済み
- 料理教室審査: 実装済み
- リード管理: 実装済み
- 問い合わせ管理: 実装済み
- 統計ダッシュボード: `admin.getStats` 実装済み
- **課題**: KYC審査機能が不完全

---

### 6. お問い合わせ ✅

- Contact.tsxで `trpc.system.notifyOwner` を使用してオーナーに通知
- 送信成功・失敗のフィードバック実装済み
- **課題**: お問い合わせ内容がDBに保存されない（メール通知のみ）。管理者が後から確認できない。

---

### 7. セキュリティ ⚠️ 要対応

**未設定**:
1. **helmet** (HTTPセキュリティヘッダー): 未設定。CSP, X-Frame-Options等が無防備。
2. **express-rate-limit**: APIレート制限なし。ブルートフォース攻撃に脆弱。
3. **CORS設定**: 明示的なCORS設定なし（Expressデフォルト）。
4. **Input sanitization**: zodによるバリデーションは実装済みだが、SQLインジェクション対策はDrizzle ORMに依存（OK）。

**実装済み**:
- JWT署名（`JWT_SECRET`）
- adminProcedureによるロールチェック
- Stripe webhook署名検証
- パスポート情報の暗号化フィールド（未使用）

---

### 8. 文字視認性 ✅ 概ね良好

- ライトテーマ（`defaultTheme="light"`）でCSS変数が適切に設定済み
- `bg-background text-foreground` ペアが一貫して使用されている
- **要確認**: ヒーロー画像上のテキスト（`text-white drop-shadow-lg` で対応済み）
- **要確認**: モバイルでの小さいフォントサイズ

---

### 9. モバイル対応 ✅ 概ね良好

- Tailwindのレスポンシブクラス（`sm:`, `md:`, `lg:`）が適切に使用されている
- タッチスワイプ対応（Home.tsx）
- **要確認**: AdminDashboardのテーブルがモバイルで横スクロールになるか
- **要確認**: 長いフォームのモバイル表示

---

## 実装優先度マトリクス

| 優先度 | 機能 | 工数見積 |
|--------|------|---------|
| P0（リリースブロッカー） | helmet + rate-limit セキュリティ設定 | 1h |
| P0 | eKYC提出エンドポイント（最小実装） | 3h |
| P0 | お問い合わせのDB保存 | 1h |
| P1 | 管理者KYC審査UI | 2h |
| P1 | BusinessAgent.tsxのトークン制御 | 1h |
| P2 | 料理教室予約フロー確認・補完 | 2h |
| P2 | UI/UX仕上げ（視認性・モバイル） | 3h |

---

## 結論

**現時点でのリリース可否**: 条件付き可（P0項目の対応後）

P0項目（セキュリティヘッダー、eKYC最小実装、お問い合わせDB保存）を対応すれば、ベータリリースとして公開可能。eKYCはフル実装でなくても「申請受付→管理者手動確認」フローで代替可能。
