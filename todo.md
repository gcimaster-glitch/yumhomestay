# YumHomeStay - Project TODO

## Sprint 1: 基盤構築・DBスキーマ・認証・管理者ダッシュボード

- [x] DBスキーマ設計（users拡張, hosts, experiences, bookings, payments, payouts, reviews, messages, audit_logs, agents）
- [x] DBマイグレーション実行
- [x] サーバーサイドルーター構造整備（機能別ファイル分割）
- [x] 認証フロー（ロールベースアクセス制御）
- [x] 監査ログ記録（J-SOX対応）
- [x] ロールベースアクセス制御（guest/host/agent/admin）
- [x] 管理者ダッシュボード（KPI概要・ユーザー管理・ホスト審査・体験審査）
- [x] 管理者：監査ログ閲覧
- [ ] 管理者：代理操作（impersonation）機能

## Sprint 2: ホスト登録・eKYC・体験管理

- [x] ホスト登録フロー（プロフィール入力・審査申請）
- [x] ホストダッシュボード（予約管理・収益レポート）
- [x] 体験（Experience）登録・管理・運営承認フロー
- [ ] Stripe Identity eKYC連携（Stripe設定後に実装）
- [ ] Stripe Connect Expressアカウント作成フロー（Stripe設定後に実装）
- [x] ホストカレンダー（空き日程管理）

## Sprint 3: ランディングページ・検索・予約・決済・通知

- [x] 多言語対応ランディングページ（i18next: 日本語・英語・中国語・韓国語）
- [x] ホスト・体験検索（エリア・日程・言語・食事制限）
- [x] 体験詳細ページ
- [x] 予約リクエストフロー（ゲスト→ホスト承認）
- [x] Stripe Payment Intents多通貨決済（バックエンド実装済み）
- [x] Stripeウェブフックエンドポイント（/api/stripe/webhook）
- [x] 為替レート自動取得・表示
- [x] Resendメール通知サービス（email.ts実装済み）
- [ ] リマインダー自動送信スケジューラー（10日前・3日前・前日・当日・3時間前）
- [ ] ゲスト本人確認（パスポート情報入力・暗号化保存）

## Sprint 4: 信頼性・安全性・代理店機能

- [x] プラットフォーム内メッセージング（バックエンド実装済み）
- [x] 双方向ブラインドレビューページ（ReviewPage.tsx）
- [x] 代理店ダッシュボード（AgentDashboard.tsx）
- [ ] トラブル報告機能UI
- [ ] 代理店実績レポート・手数料管理詳細
- [ ] ホストへの自動送金（末締め翌末払いバッチ処理）
- [ ] 財務レポートページ（収益認識・為替差損益）
- [ ] 割引クーポン発行・管理UI

## 料理教室（Cooking School）ホスト対応

- [x] DBスキーマ拡張：cooking_schoolsテーブル追加
- [x] DBスキーマ拡張：hostsテーブルにhostType（individual/cooking_school）追加
- [x] バックエンド：料理教室登録・管理ルーター（cookingSchool）
- [x] フロントエンド：料理教室登録ページ（CookingSchoolRegister.tsx）
- [x] フロントエンド：料理教室ダッシュボード（CookingSchoolDashboard.tsx）
- [x] フロントエンド：料理教室一覧・検索ページ（CookingSchools.tsx）
- [x] フロントエンド：体験検索に「ホームステイ体験」「料理教室体験」タブ追加
- [x] フロントエンド：ランディングページに料理教室セクション追加
- [ ] 管理者：料理教室審査・承認フロー

## 横断的対応

- [x] i18next多言語対応（全UI: 日本語・英語・中国語・韓国語）
- [x] 個人情報暗号化（住所・パスポート・緊急連絡先 - DBスキーマ設計済み）
- [x] レスポンシブデザイン
- [x] Vitestユニットテスト（22テスト全パス）
- [ ] Stripe設定（STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET）
- [ ] Resend設定（RESEND_API_KEY）
- [ ] MFA（多要素認証）UI

## ランディングページ強化

- [x] ランディングページに「料理教室での体験」セクション追加（初期ユーザー獲得強化）

## サンプルデータ登録

- [x] 料理教室サンプルデータ（6件）をDBに挿入
- [x] ホームステイ体験サンプルデータ（6件）をDBに挿入

## ランディングページ ヒーロー画像

- [x] 料理・家庭雰囲気の高品質画像を検索・取得
- [x] 画像をCDNにアップロードしてヒーローセクションに組み込む
- [x] ヒーローセクションをフルブリード画像デザインに改修（フローティングカード付き）

## 料理教室体験データ・詳細ページ

- [x] 料理教室用ホストレコードをDBに追加（6件）
- [x] 料理教室体験データ（メニュー・価格・時間）をDBに挿入（11件）
- [x] バックエンド：getExperiencesByCookingSchoolId関数追加
- [x] バックエンド：cookingSchool.getExperiencesプロシージャ追加
- [x] フロントエンド：料理教室詳細ページ（CookingSchoolDetail.tsx）新規作成
- [x] App.tsxにルート追加（/cooking-schools/:id）

## ヒーローセクション スライドショー化

- [x] 日本の家庭料理雰囲気の追加画像を検索・取得（5枚）
- [x] 追加画像をCDNにアップロード
- [x] Home.tsxのヒーローセクションをオートプレイ付きスライドショーに改修（6枚・5秒間隔）
- [x] スライドショー：フェードトランジション実装（700ms）
- [x] スライドショー：ドットインジケーター・矢印ナビゲーション追加
- [x] スライドショー：各スライドにキャプション（料理名・エリア）表示

## ヒーローキャプション リンク化

- [ ] HERO_SLIDESの各スライドにlinkフィールドを追加（体験カテゴリURL）
- [ ] キャプションをwouterのLinkコンポーネントでラップしてクリッカブルに変更
- [ ] ホバー時のビジュアルフィードバック（矢印アイコン・アンダーライン）追加

## スライドショー機能強化

- [x] キャプションにリンク追加（HERO_SLIDESにlinkフィールド・ChevronRightアイコン）
- [x] ホバーで自動再生一時停止（onMouseEnter/onMouseLeave）
- [x] モバイルスワイプ対応（touchstart/touchend）

## インフラ・外部連携

- [ ] GitHubリポジトリへコードをエクスポート
- [ ] Cloudflare連携の準備・案内

## 口コミ・評価システム

- [x] DBスキーマ：experienceReviewsテーブル追加（rating, comment, userId, experienceId/cookingSchoolId, createdAt）
- [x] バックエンド：review.submitExperienceReview（認証済みユーザーのみ）・review.getByExperience/getByCookingSchoolプロシージャ
- [x] バックエンド：平均評価・件数の集計（getExperienceRatingSummary/getCookingSchoolRatingSummary）
- [x] フロントエンド：ReviewSectionコンポーネント（投稿フォーム＋一覧）
- [x] フロントエンド：ExperienceDetail.tsxに口コミセクション追加
- [x] フロントエンド：CookingSchoolDetail.tsxに口コミセクション追加

## スタティックページ全作成

- [x] 現在のページ構成・フッター・ルーティングを確認
- [x] 会社概要ページ（/about）：ガストロノミーエクスペリエンス株式会社情報・ミッション・チーム
- [x] 利用規約ページ（/terms）
- [x] プライバシーポリシーページ（/privacy）
- [x] 特定商取引法に基づく表記ページ（/legal）
- [x] お問い合わせページ（/contact）：フォーム付き・notifyOwner連携
- [x] よくある質問ページ（/faq）：ゲスト向け・ホスト向けタブ切り替え
- [x] フッターを5カラム構成に刷新（会社住所・メール・全ページリンク）
- [x] App.tsxに全ルートを登録（/about /terms /privacy /legal /contact /faq）

## 体験検索タブ・ホストカレンダー・外部サービス連携

- [x] 体験検索ページ（/experiences）にホームステイ/料理教室タブを追加
- [x] ホストカレンダー（空き日程管理）ページを実装
- [x] 予約フローに空き時間スロット表示を統合（ExperienceDetail.tsx）
- [x] 管理者：料理教室審査・承認フロー実装
- [x] Resend APIキー設定とメール送信テスト
- [ ] Stripe設定確認とWebhookテスト
- [ ] トラブル報告機能UI実装
- [ ] GitHubリポジトリへコードをエクスポート

## 管理者：料理教室審査・承認フロー
- [x] バックエンド：admin.listCookingSchools（全件取得・ステータスフィルター）プロシージャ確認・追加
- [x] バックエンド：admin.approveCookingSchool・admin.rejectCookingSchool プロシージャ確認・追加
- [x] フロントエンド：AdminDashboard.tsxに料理教室審査タブを追加
- [x] フロントエンド：料理教室一覧テーブル（名前・オーナー・エリア・ステータス・申請日）
- [x] フロントエンド：詳細モーダル（料理教室情報・ホスト情報・承認/却下ボタン）
- [x] フロントエンド：却下時の理由入力ダイアログ
- [x] フロントエンド：承認/却下後のオーナー通知（notifyOwner連携）

## 審査結果メール通知（Resend）
- [x] email.tsに料理教室審査結果通知メール関数を追加（承認・却下・停止）
- [x] admin.approveCookingSchool / rejectCookingSchool / suspendCookingSchool でメール自動送信
- [x] メール本文：日本語・教室名・理由・次のアクション案内

## 料理教室オーナー向けダッシュボード
- [x] バックエンド：cookingSchool.mySchool（自分の教室情報取得）
- [x] バックエンド：cookingSchool.myExperiences（自分の体験一覧）
- [x] バックエンド：cookingSchool.myBookings（自分の予約一覧）
- [x] バックエンド：cookingSchool.updateMySchool（教室情報更新）
- [x] フロントエンド：CookingSchoolDashboard.tsxページ新規作成
- [x] フロントエンド：審査ステータス表示・次のアクション案内
- [x] フロントエンド：体験プログラム一覧・追加・編集
- [x] フロントエンド：予約一覧（ゲスト情報・日時・ステータス）
- [x] App.tsxにルート追加（/cooking-school/dashboard）
- [x] Navbarに料理教室オーナー向けリンク追加

## 仕様書整合：原点回帰リファクタリング

### 料金体系（固定料金制）
- [x] DBスキーマ：bookingsテーブルに固定料金フィールド追加済み（basePriceJpy, extraAdultPriceJpy, extraChildPriceJpy, extraInfantPriceJpy, agentFeeJpy, agentBonusFeeJpy, cardFeeJpy, affiliateFeeJpy）
- [x] バックエンド：料金計算ロジックを正確な固定料金制に修正済み（基本2名¥55,000・追加大人¥22,000・子供¥11,000・幼児¥5,500）
- [x] バックエンド：代理店手数料計算済み（¥8,800）
- [x] フロントエンド：予約画面の料金表示を固定料金制に修正済み

### ホスト登録フロー（仕様書準拠）
- [x] DBスキーマ：hostsテーブルに登録条件フィールド追加済み（familyMemberCount, canCookTogether, hasSpecialCertification, hasInsurance）
- [x] フロントエンド：ホスト登録フォームを仕様書準拠に修正済み（家族人数・保険・登録料・ZOOM面談日程）
- [x] バックエンド：ホスト審査フロー実装済み（pending→interview→approved/rejected）

### ゲスト申込フロー（仕様書準拠）
- [ ] フロントエンド：申込フォームに人数・エリア・出身国・希望条件・食事制限を追加
- [ ] バックエンド：申込受付後の担当者確認フロー（マッチング→ホスト連絡→決定通知→請求リンク送信）
- [ ] バックエンド：入金確認後のホスト本決定通知メール
- [ ] バックエンド：当日詳細・マップ・注意事項メール送信

### リマインダー自動送信
- [ ] バックエンド：リマインダースケジューラー（10日前・3日前・前日・当日・3時間前）

### サービス完了フロー
- [ ] バックエンド：サービス完了後のアンケートメール・割引クーポン送信
- [ ] バックエンド：ホスト側レポート申請兼請求申請フロー
- [ ] バックエンド：末締め翌末支払い処理（ホスト報酬・代理店手数料）

### ランディングページ・UI修正
- [ ] ランディングページ：サービス説明文をYHS仕様書準拠に修正
- [ ] ランディングページ：「3時間のホームステイプログラム」「駅まで送迎」「一緒に料理」を明示
- [ ] ランディングページ：YumHosts・YumGuestsの愛称を反映
- [x] 料金ページ（/pricing）：固定料金表（基本パッケージ・追加料金・FAQ・シミュレーター）を作成

## 仕様書整合：原点回帰リファクタリング（完了）
- [x] DBスキーマ：hostsテーブルに仕様書準拠カラム追加（家族人数・料理同伴・保険・登録料・研修・面談日等）
- [x] DBスキーマ：bookingsテーブルに固定料金内訳カラム追加（basePriceJpy・extraAdult/Child/Infant・agentBonusFee・pickupStation・meetingTime・reminder3HourSent）
- [x] バックエンド：booking.createをYHS固定料金制に修正（基本¥20,000・追加大人¥20,000・子供¥12,000・幼児¥5,000・代理店手数料¥8,500）
- [x] フロントエンド：予約フォームに幼児カウント・送迎駅入力・固定料金内訳表示を追加
- [x] 全24テスト通過確認

## ホスト登録フォーム仕様書整合
- [x] ホスト登録フォームに家族人数（最低2名）必須入力を追加
- [x] 損害保険加入確認チェックボックスを追加
- [x] 登録料（5,000円）支払い確認ステップを追加（Stripe連携）
- [x] ZOOM面談日程選択（希望日時３つ）フィールドを追加
- [x] バリデーション・入力ガイドを整備

## リマインダーメール自動送信cronジョブ
- [x] email.tsにリマインダーメールテンプレートを追加（10日前・3日前・前日・当日・3時間前）
- [x] server/reminderJob.tsに5段階リマインダージョブを実装（毎時チェック）
- [x] server/_core/index.tsにスケジューラ起動を追加
- [x] reminder*Sentフラグ更新ロジックを実装

## ゲスト向けマイページ（/my/bookings）
- [x] booking.myBookingsプロシージャを追加（ゲスト自身の予約一覧）
- [x] booking.cancelプロシージャを追加（キャンセル申請）
- [x] booking.submitSurveyプロシージャを追加（完了後アンケート）
- [x] MyBookings.tsxページをキャンセル・アンケート機能付きに完全更新
- [x] App.tsxにルート追加（/my/bookings）
- [x] Navbarにマイページリンクを確認（/bookingsルートに既存）

## デモデータ・ルール強化・OTA API

### デモデータ
- [ ] 47都道府県名物料理体験のシードデータ（ホスト・体験プログラム）を投入
- [ ] 各体験に料理名・説明・エリア・画像URLを設定

### ビデオ面談必須化
- [ ] bookingsテーブルにvideoCallScheduledAt・videoCallCompletedカラムを追加
- [ ] 予約フローにビデオ面談スケジュール選択ステップを追加
- [ ] ホスト側ダッシュボードにビデオ面談管理UIを追加

### ホスト・ゲスト人数制限
- [ ] ホスト登録：familyMemberCount >= 2 のバリデーションをバックエンドに追加
- [ ] 予約フォーム：adultsCount >= 2 のバリデーション（1名申込み不可）
- [ ] UIに「2名以上でのご参加が必要です」の警告を表示

### OTA向け公開API
- [ ] /api/v1/experiences エンドポイント（体験一覧・フィルター）
- [ ] /api/v1/bookings エンドポイント（予約作成）
- [ ] /api/v1/webhooks エンドポイント（予約状態変更通知）
- [ ] APIキー認証の実装
- [ ] API仕様書（OpenAPI/Swagger）の作成

## デモデータ・ルール強化・OTA API（完了）
- [x] 47都道府県名物料理デモデータ投入（scripts/seed-demo.mjs）
- [x] ビデオ面談必須化（DB: videoCallRequired/videoCallScheduledAt/videoCallCompletedAt、予約フォームUI）
- [x] ゲスト2名以上申込み強制（フロントエンドバリデーション + バックエンドバリデーション）
- [x] ホスト2名以上受け入れ強制（familyMemberCount >= 2 バリデーション）
- [x] OTA向け公開REST API実装（server/routers/otaApi.ts）
  - GET /api/ota/v1/experiences（一覧・フィルター）
  - GET /api/ota/v1/experiences/:id（詳細）
  - POST /api/ota/v1/bookings（予約作成）
  - GET /api/ota/v1/bookings/:id（予約状況確認）
  - GET /api/ota/v1/docs（APIドキュメント）
- [x] OTA APIをserver/_core/index.tsに登録
- [x] 全24テスト通過確認

## Stripe Checkout 決済フロー
- [x] バックエンド：stripe.createCheckoutSession（Stripe Checkout Session生成）プロシージャ改善（pending_paymentステータス・重複チェック・料金明細）
- [x] バックエンド：Stripe Webhook処理（checkout.session.completed → confirmed、checkout.session.expired → pending、payment_intent.payment_failed → pending）
- [x] DBスキーマ：bookingsテーブルにpending_paymentステータス追加、paymentsテーブルにstripeSessionId追加
- [x] バックエンド：booking.createがbooking idを返すよう修正（フロントエンドからCheckout Sessionを作成可能に）
- [x] フロントエンド：ExperienceDetail.tsxの予約ボタンを「予約してお支払いへ」に変更（予約作成→自動でCheckoutへリダイレクト）
- [x] フロントエンド：MyBookings.tsxにpending_paymentステータス表示と「お支払いに進む」ボタン追加
- [x] フロントエンド：支払い完了ページ（/payment/success）新規作成（予約番号・ステータス・次のステップ案内）
- [x] フロントエンド：支払いキャンセルページ（/payment/cancel）新規作成（再試行ボタン付き）
- [x] App.tsxにルート追加（/payment/success, /payment/cancel）
- [x] 全24テスト通過確認

## 予約フロー全面リデザイン（ホスト主導の空き日程選択方式）

### 問題点
- [x] カレンダーUIが使いにくい（日付入力が困難）→ ホスト提供日カード選択UIに全面改修
- [x] ゲストが自由に日付入力できる設計（ホスト側の都合が反映されない）→ ホスト登録済み空き日程のみ選択可能
- [x] 料金計算の表示がおかしい→ YHS固定料金制に正しく修正（基本¥20,000・追加人数分のみ加算）
- [x] そもそも予約が完了できない→ ホスト空き日選択後に予約ボタン有効化されるフローに修正

### 修正方针
- [x] ホストが事前に「空き日程スロット」を登録し、ゲストはその中から選ぶ方式に変更
- [x] ExperienceDetail予約フォームをホスト提供日のカード選択UIに全面改修（緑の日付のみ選択可能なカレンダー）
- [x] 料金計算ロジックの検証・修正（YHS固定料金制：基本2名¥20,000・追加大人¥20,000・子供¥12,000・幼児¥5,000）
- [x] HostCalendarの空き日程登録UIを改善（クイック期間選択ボタン・日付min制限追加）
- [x] 空き日程がない場合の適切なメッセージ表示（アラートカード）
- [x] ビデオ面談希望日時入力のUX改嚄（datetime-localピッカーで第1・第2・第3希望を分かりやすく表示）

## デモデータ修正（2026-03-01）

- [x] 体験・料理教室・ホストプロフィールの写真URLが壊れているものを有効なCDN画像に修正（85件）
- [x] 予約テスト用の空き日程スロットをシードスクリプトで自動生成（今後3ヶ月分・3,599件）

## ホームページ全面改嚄・機能追加（2026-03-01）

- [x] ヒーローバナーのテキスト改行を修正（レスポンシブ対応）
- [x] ヒーローバナーの写真切り替わりに連動したコピーテキスト変更
- [x] サイトの説明セクションを手厚く改嚄（何のサイトか一目でわかるように）
- [x] 漫画風コミックパネルでサービスを説明するセクションを追加
- [x] ホスト向け予約管理UI（HostBookings.tsx）を新規作成（承認・辞退・完了ボタン・ビデオ面談希望日時・食事制限表示）
- [x] トラブル報告フォームUIを実装（/trouble/report・カテゴリ選択・予約連動・オーナー通知）
- [x] MyBookings.tsxにトラブル報告ボタンを追加（confirmed/completed状態の予約に表示）
- [ ] 空き日程がない場合の問い合わせフォーム（ホストへのメッセージ機能）

## デモデータ修正・スロットシード・問い合わせフォーム・リマインダー確認（2026-03-01）

- [x] 体験・ホストプロフィールの写真URLを有効なCDN画像に修正（85件）
- [x] 今後3ヶ月分の空き日程スロットをシードスクリプトで自動生成（3,599件）
- [x] 空き日程がない場合のホストへの問い合わせフォームUI実装（ExperienceDetail.tsx ダイアログ形式）
- [x] リマインダーメール動作確認（30分ごと自動実行中、Resend API接続確認済み）

## ホスト向け予約管理UI完成（2026-03-01）

- [x] バックエンド：booking.hostBookings（ホスト自身の予約一覧）プロシージャの動作確認✔
- [x] バックエンド：booking.confirm（承認）・ booking.cancel（辞退）・ booking.complete（完了）プロシージャの動作確認✔
- [x] フロントエンド：HostBookings.tsx完全実装（予約カード・ゲスト詳細・ビデオ面談希望日時・食事制限・承認/辞退/完了ボタン）✔
- [x] フロントエンド：HostDashboard.tsxからHostBookings.tsxへのナビゲーション追加✔
- [x] フロントエンド：承認時のトースト通知・辞退時のキャンセル理由入力ダイアログ✔
- [x] フロントエンド：ステータス別フィルター（全件・承認待ち・確定済み・完了）・予約ID検索✔
- [x] テスト用予約データをDBに直接作成（pending/confirmed/completed各1件）✔
- [x] ブラウザで承認操作を実際に確認（承認待ぢ0・確定済み2・完了で1に変化✔）
- [x] 全で1テスト通過確認✔

## Stripe Checkout連携・ホスト登録フロー完成（2026-03-01）

### DBスキーマ
- [x] hostRegistrationPaymentsテーブル追加（hostId, stripeSessionId, stripePaymentIntentId, status, paidAt）
- [x] hostsテーブルにregistrationFeeStripeSessionIdカラム追加
- [x] マイグレーションSQL実行

### バックエンド
- [x] stripe.createHostRegistrationCheckout プロシージャ（¥5,000 Checkout Session生成）
- [x] Stripe Webhook: checkout.session.completedでhostタイプを判別してregistrationFeePaid=trueに更新
- [x] email.ts: sendHostRegistrationReceivedEmail（申請受付メール・ZOOM面談希望日時記載）
- [x] email.ts: sendHostRegistrationFeeConfirmedEmail（登録料支払い完了メール）
- [x] email.ts: sendHostApprovedEmail（審査承認・認定書発行メール）
- [x] email.ts: sendHostRejectedEmail（審査却下メール）
- [x] host.register 完了時に申請受付メールを自動送信
- [x] host.adminApprove / host.adminReject / host.adminSetInterview プロシージャ追加

### フロントエンド
- [x] HostRegister Step3: 「登録料¥5,000をStripeで支払う」ボタンを追加（Checkout Sessionへリダイレクト）
- [x] HostRegister Step3: 支払い完了後にStep4（ZOOM面談日程）へ自動遷移
- [x] /host/register/payment/success ページ（登録料支払い完了→Step4へ）
- [x] HostDashboard: registrationFeePaidフラグに応じたステータス表示改善
- [x] HostDashboard: 各ステータス（pending/interview/approved）に応じた次のアクション案内
- [x] AdminDashboard: ホスト審査タブ拡張（フィルター・登録料状況・ZOOM面談設定・承認/却下・認定書発行メール）
- [x] テスト: host.registration.test.ts追加（41テスト全パス）

## HostDashboardステータス表示改善・ゲスト申込フロー完成（2026-03-01）

### HostDashboard 次のアクション案内バナー
- [x] HostDashboard: 登録料未払い（registrationFeePaid=false）の場合、支払いボタン付きバナーを表示
- [x] HostDashboard: pending（審査待ち）の場合、審査中メッセージ・ZOOM面談日程を表示
- [x] HostDashboard: interview（ZOOM面談中）の場合、面談日時・準備案内を表示
- [x] HostDashboard: approved（認定済み）の場合、認定書発行日・ダッシュボード利用案内を表示
- [x] HostDashboard: rejected（却下）の場合、再申請案内を表示

### ゲスト申込フロー（担当者確認フロー）
- [x] DBスキーマ: guestInquiriesテーブル追加（人数・エリア・出身国・希望条件・食事制限・ステータス管理）
- [x] バックエンド: inquiry.submit（申込受付・申請受付メール送信・オーナー通知）
- [x] バックエンド: inquiry.myInquiries（ゲスト自身の申込一覧）
- [x] バックエンド: admin.listInquiries（管理者：申込一覧・フィルター）
- [x] バックエンド: admin.assignInquiry（担当者アサイン・ホスト候補連絡メール送信）
- [x] バックエンド: admin.confirmInquiry（マッチング確定・ゲストへ決定通知メール・請求リンク送信）
- [x] バックエンド: admin.rejectInquiry（申込却下・ゲストへ通知）
- [x] フロントエンド: GuestApply.tsx（申込フォームページ）実装済み
- [x] フロントエンド: MyInquiries.tsx（ゲスト申込状況確認ページ）実装済み
- [x] フロントエンド: AdminDashboard.tsxに申込管理タブ追加済み
- [x] App.tsxにルート追加済み（/apply, /my-inquiries）

## ゲスト申込CTA導線追加（2026-03-01）
- [x] Home.tsx: ヒーローセクションに「ホームステイを申し込む」CTAボタンを追加（最優先CTA）
- [x] Home.tsx: How It Worksセクション直下に「申し込む」+「体験を探す」ツインCTAを追加
- [x] Home.tsx: ゲスト向け専用CTAセクション（Guest Apply CTA Section）を追加（Dual CTAの直前）
- [x] Navbar.tsx: デスクトップナビに「申し込む」プライマリボタンを追加
- [x] Navbar.tsx: モバイルメニューに「ホームステイを申し込む」ボタンを追加

## MyInquiriesページ プログレスバー追加（2026-03-01）
- [x] MyInquiries.tsx: ステータス別プログレスバー（ステップ表示）を追加
- [x] MyInquiries.tsx: 確定時のホスト情報・体験日時・集合場所カードを追加
- [x] MyInquiries.tsx: キャンセルボタンを追加（submitted/reviewing/host_contacted状態のみ）
- [x] MyInquiries.tsx: 申込内容の詳細展開パネルを追加

## 申込フォームへのユーザー情報自動入力（2026-03-01）
- [x] GuestApply.tsx: ログイン済みユーザーの名前・メールをStep3に表示（読み取り専用）
- [x] GuestApply.tsx: preferredLanguageからoriginCountryを推定して自動選択
- [x] GuestApply.tsx: 未ログイン時にログイン促進バナーを表示（フォームは使用可能）
- [x] GuestApply.tsx: Step4の確認画面にユーザー情報（申込者名・メール）を表示

## プロフィール設定ページ改善（2026-03-01）
- [x] user.updateProfile: name・emailフィールドを追加
- [x] Profile.tsx: 名前・メールアドレスを編集可能フィールドに変更
- [x] Profile.tsx: 変更前後の差分チェック（未変更時は保存ボタンを無効化）
- [x] Profile.tsx: 保存成功後にuseAuth()キャッシュを更新
- [x] Profile.tsx: 申込状況・ホスト登録状況へのクイックリンクを追加

## 管理者向けホスト候補選択UI（2026-03-01）
- [x] host.adminApprovedList: 承認済みホスト一覧取得プロシージャを追加（id・nearestStation・prefecture・city・languages・bioEn・userId）
- [x] AdminDashboard: 「ホスト連絡」ボタン押下時に承認済みホスト選択ダイアログを表示
- [x] AdminDashboard: ダイアログ内に承認済みホスト一覧（地域・言語・プロフィール）を表示
- [x] AdminDashboard: 選択したhostIdをadminContactHostに渡してhostId=0の仮実装を解消
- [x] AdminDashboard: staffNotes（担当者メモ）入力フィールドを追加

## 申込フロー変更・AIチャット機能（2026-03-01）

### 申込フロー変更
- [x] ホームステイ：ビデオ面談を申込確定「後」に移動（現在は申込時に希望日時入力）
- [x] 料理教室：ビデオ面談ステップを完全削除
- [x] bookings/guestInquiriesのビデオ面談フィールドをホームステイ専用に変更
- [x] MyInquiries.tsxのプログレスバーをホームステイ/料理教室で分岐表示

### AIチャット機能（申込確定〜体験完了の間のみ）
- [x] DBスキーマ：bookingChatsテーブル追加（bookingId/inquiryId, userId, role: user/host/admin/ai, message, createdAt）
- [x] バックエンド：chat.getMessages（確定済み申込のメッセージ一覧取得）
- [x] バックエンド：chat.sendMessage（メッセージ送信・AI自動応答トリガー）
- [x] バックエンド：AIチャット応答（invokeLLM使用・YHS FAQ/場所案内/注意事項を学習）
- [x] バックエンド：chat.adminReply（管理者/スタッフが手動で返信）
- [x] フロントエンド：ChatBox.tsx（ゲスト向けチャットUI・確定済み申込のみ表示）
- [x] フロントエンド：MyInquiries.tsxにチャットボタン追加（confirmed状態のみ）
- [x] フロントエンド：AdminDashboard.tsxにチャット管理タブ追加（全チャット一覧・手動返信）
- [x] フロントエンド：HostDashboard.tsxにチャット通知バッジ追加

## チャット強化・ビデオ面談スケジュール管理（2026-03-01）

### HostDashboardチャット通知バッジ
- [x] バックエンド：chat.getUnreadCountForHost プロシージャ追加（ホスト向け未読チャット件数）
- [x] フロントエンド：HostDashboard.tsxのナビ/ヘッダーに未読件数バッジを表示

### AIチャット多言語対応強化
- [x] バックエンド：chat.sendMessage でゲストの preferredLanguage をシステムプロンプトに渡す
- [x] AI応答が英語・中国語・韙国語・日本語でゲストの言語に合わせて返答

### ビデオ面談スケジュール管理UI
- [x] DBスキーマ：guestInquiriesテーブルに videoCallScheduledAt・videoCallMeetingUrl カラム追加
- [x] バックエンド：inquiry.adminSetVideoCall プロシージャ（日時・URL設定・ゲストへメール通知）
- [x] フロントエンド：AdminDashboard申込管理タブに「ビデオ面談設定」ボタン追加
- [x] フロントエンド：MyInquiries.tsxに確定後のビデオ面談日時・URLを表示

## チャット・ビデオ面談機能強化（2026-03-01 続き）

### ビデオ面談設定時メール通知
- [x] email.ts: sendVideoCallScheduledEmail（ゲスト向けビデオ面談案内メール）追加
- [x] inquiry.adminSetVideoCall プロシージャでメール送信を実装

### HostDashboardチャット返信機能
- [x] バックエンド：chat.hostReply プロシージャ追加（ホストが手動返信）
- [x] フロントエンド：HostDashboard.tsxの予約管理タブにチャット返信UIを追加

### チャット既読管理精緻化
- [x] バックエンド：chat.markAsRead プロシージャ追加（チャット画面を開いた時点で既読フラグ更新）
- [x] フロントエンド：BookingChat.tsx でチャット開封時に markAsRead を呼び出す
- [x] フロントエンド：未読バッジをリアルタイムで消す（markAsRead後にunreadCountを再取得）

## 公式キャラクター画像組み込み（2026-03-01）
- [x] キャラクター画像をZIPから展開・CDNアップロード
- [x] ホームページヒーローセクションにキャラクターを配置
- [x] チャットUIのAIアバターにキャラクターを使用
- [x] 申込完了・確定画面にキャラクターを配置
- [x] 空状態（empty state）にキャラクターを配置
- [x] FAQページにキャラクターを配置
- [x] HostDashboard認定済みバナーにキャラクターを配置

## 全ページ多言語化（2026-03-01）

- [x] 現状調査：i18n設定・翻訳ファイル・未対応ページの特定
- [x] 翻訳キーファイル拡張（全ページ分の日英中韓翻訳キーを追加）
- [x] Home.tsx 多言語化
- [x] Navbar.tsx 多言語化
- [x] Footer.tsx 多言語化
- [x] GuestApply.tsx 多言語化
- [x] MyInquiries.tsx 多言語化
- [x] ExperienceDetail.tsx 多言語化
- [x] CookingSchoolDetail.tsx 多言語化
- [x] HostDashboard.tsx 多言語化
- [x] HostRegister.tsx 多言語化
- [x] BookingChat.tsx 多言語化
- [x] FAQ.tsx 多言語化
- [x] About.tsx 多言語化
- [x] Profile.tsx 多言語化
- [x] AdminDashboard.tsx（管理者専用のため日英のみ）多言語化
- [x] Legal.tsx 多言語化（特定商取引法表記）
- [x] Terms.tsx 多言語化
- [x] Privacy.tsx 多言語化
- [x] HostBookings.tsx 多言語化
- [x] HostCalendar.tsx 多言語化
- [x] HostRegisterPaymentSuccess.tsx 多言語化
- [x] CookingSchoolDashboard.tsx 多言語化
- [x] CookingSchoolRegister.tsx 多言語化
- [x] AgentDashboard.tsx 多言語化
- [x] TroubleReport.tsx 多言語化
- [x] MyBookings.tsx 多言語化
- [x] ReviewPage.tsx 多言語化
- [x] Experiences.tsx 多言語化
- [x] CookingSchools.tsx 多言語化

## ゲストレビューシステム強化（2026-03-02）

- [x] バックエンド：review.submitExperienceReview に「completed状態の予約が存在するか」バリデーション追加
- [x] DBスキーマ：experienceReviewsテーブルにreplyByHost（ホスト返信文）・repliedAt カラム追加
- [x] バックエンド：review.hostReplyToReview プロシージャ追加（ホストが自分の体験レビューに返信）
- [x] フロントエンド：ReviewSection.tsx にホスト返信表示インターフェースを追加（レビューカード内に返信文を表示）
- [x] フロントエンド：HostDashboard.tsx に「レビュー管理」タブを追加（返信フォーム付き）

## 管理者向けホスト空き日程カレンダー閲覧（2026-03-02）

- [x] バックエンド：admin.getHostAvailability プロシージャ追加（ホストIDと期間を受け取り空き日程スロット一覧を返す）
- [x] バックエンド：admin.listApprovedHosts プロシージャ追加（承認済みホスト一覧）
- [x] フロントエンド：AdminDashboard.tsx に「空き日程」タブを追加
- [x] フロントエンド：ホスト選択ドロップダウン＋月カレンダーで空き日程を可視化

## メールアドレス変更確認フロー（2026-03-02）

- [x] DBスキーマ：emailVerificationTokensテーブル追加（userId, newEmail, token, expiresAt, usedAt）
- [x] バックエンド：user.requestEmailChange プロシージャ（トークン生成・確認メール送信）
- [x] バックエンド：user.confirmEmailChange プロシージャ（トークン検証・メール更新）
- [x] email.ts：sendEmailChangeConfirmationEmail 関数追加
- [x] フロントエンド：Profile.tsx のメール変更フローを「確認メール送信→リンククリックで確定」に変更
- [x] フロントエンド：/verify-email?token=xxx ページ新規作成（確認完了画面）
- [x] App.tsx にルート追加（/verify-email）

## 公開前対処事項（2026-03-02）

- [x] Footer `/become-host` リンクを `/host/register` に修正
- [x] index.htmlのテンプレートコメントブロック削除
- [x] robots.txt 作成（client/public/）
- [x] OGP・metaタグ追加（og:title, og:description, og:image, twitter:card）
- [x] 404ページ（NotFound.tsx）の多言語化（暗語へ戈るボタン追加）
- [x] 本番コードのconsole.log整理（運用ログは必要なため全件保持）

## 体験料金構造の修正（2026-03-03）

- [x] 共有定数ファイルに正確な料金構造を定義（基本2名55,000円・追加大人22,000円・追加子供11,000円・追加幼児5,500円）
- [x] ホストファミリー報酬定数（20,000円）・食材原価定数（5,000円）を定義
- [x] 旅行代理店手数料定数（8,800円）・カード手数料率（5%）・アフィリエイト手数料（2,200円）を定義
- [x] バックエンド：料金計算ロジックを正確な構造に更新（Stripe決済額・ホスト報酬・代理店手数料・自社利益の内訳）
- [x] フロントエンド：ExperienceDetail.tsx の料金表示を正確な構造に更新（¥55,000・¥22,000・¥11,000・¥5,500）
- [x] OTA API（otaApi.ts）の料金情報をshared/pricing.tsの定数に統一
- [x] Stripe Checkout（stripe.ts）のline item単価をshared/pricing.tsの定数に統一
- [x] 全68テスト通過確認（TSエラーゼロ）

## GuestApply.tsx 料金表示修正（2026-03-03）

- [x] フロントエンド：GuestApply.tsx（申込フォーム）のStep1に料金サマリーをリアルタイム表示（¥55,000基本・追加人数分）
- [x] フロントエンド：GuestApply.tsx のStep4（確認画面）に料金合計を表示
- [x] i18n：priceSummary・basePackage・extraAdult・extraChild・extraInfant・totalPrice・priceNote 翻訳キーを全4言語（ja/en/zh/ko）に追加
- [x] 全68テスト通過確認（TSエラーゼロ）

## BtoB向けLP・ビジネスモデルページ・リード管理・デモアカウント（2026-03-03）

### DBスキーマ
- [x] leadsテーブル追加（type: host/cooking_school/agent, name, company, email, phone, prefecture, nearestStation, maxGuests, country, state, specialtyRace, q1, q2, status: new/contacted/qualified/converted/rejected, notes, repliedAt, createdAt）
- [x] マイグレーションSQL実行

### バックエンド
- [x] lead.submit プロシージャ（リード登録・確認メール自動送信・オーナー通知）
- [x] lead.adminList プロシージャ（管理者：リード一覧・フィルター・ページネーション）
- [x] lead.adminUpdate プロシージャ（ステータス更新・メモ追加）
- [x] lead.adminDelete プロシージャ（削除）
- [x] lead.adminReply プロシージャ（返信メール送信・repliedAt更新）
- [x] lead.adminExportCsv プロシージャ（CSV生成）
- [x] /api/demo/login（デモアカウントログイン・セッションCookie発行）
- [x] email.ts: sendLeadConfirmationEmail（リード向け確認メール）
- [x] email.ts: sendLeadNotificationEmail（オーナー向けリード通知メール）

### 配布資料PDF
- [x] ホストファミリー向け資料PDF作成・CDNアップロード
- [x] 料理教室向け資料PDF作成・CDNアップロード
- [x] 旅行代理店向け資料PDF作成・CDNアップロード

### フロントエンド：ランディングページ
- [x] /for-hosts ホストファミリー向けLP（報酬体系・登録フロー・FAQ・資料請求CTA・デモCTA）
- [x] /for-cooking-schools 料理教室向けLP
- [x] /for-agents 旅行代理店向けLP

### フロントエンド：ビジネスモデルページ
- [x] /business/host ホスト向けビジネスモデルページ（説明・収益シミュレーター・無料登録申込みフォーム）
- [x] /business/cooking-school 料理教室向けビジネスモデルページ
- [x] /business/agent 旅行代理店向けビジネスモデルページ

### フロントエンド：リード管理画面
- [x] AdminDashboard.tsxにリード管理タブ追加（一覧・フィルター・ステータス更新・返信・削除・CSVダウンロード）

### フロントエンド：デモアカウント
- [x] /demo デモ選択ページ（3種類のデモアカウントを選択してログイン）
- [x] デモアカウント作成（ホスト・料理教室・代理店冄1アカウント）
- [x] デモ環境ではメール送信・決済をモック化（実際には送信しない）

### ルート追加
- [x] App.tsxに全ルート追加（/for-hosts, /for-cooking-schools, /for-agents, /business/*, /demo）

## How It Works翻訳更新・料金ページ作成（2026-03-03）

- [x] How It Worksセクション翻訳を4言語（ja/en/zh/ko）でYHS申込フロー準拠に更新（申請→マッチング→決済→体験）
- [x] howItWorks.badge・subtitle翻訳キーを4言語に追加
- [x] 料金ページ（/pricing）新規作成：固定料金表・追加ゲスト料金・含まれるもの・シミュレーション例・FAQ・CTA
- [x] Navbar.tsxに「料金」リンクを追加（4言語対応）
- [x] Footer.tsxに「料金プラン」リンクを追加
- [x] App.tsxに/pricingルートを追加
- [x] 全68テスト通過確認・TSエラーゼロ確認

## 料金ページ多言語化・ランディングページYHS仕様書準拠修正（2026-03-03 続き）

- [x] 料金ページ（/pricing）の翻訳キーをja/en/zh/koの各localesファイルに正式追加
- [x] ランディングページ：サービス説明文をYHS仕様書準拠に修正（「3時間のホームステイプログラム」「駅まで送迎」「一緒に料理」を明示）
- [x] ランディングページ：YumHostsの愛称を全セクションに反映（4言語）

## heroスライドコピー修正・管理者UI・体験カードバッジ（2026-03-03 続き2）

- [x] ランディングページheroスライドコピーをYHS仕様書準拠に修正（4時間・駅送迎・一緒に料理）（4言語）
- [x] 管理者側：AdminBookings画面にホスト確定→請求リンク送信ボタンを実装（既実装済を確認）
- [x] 体験カードにYHS固有バッジ表示（駅送迎・食材費込み・最低2名）（Home.tsx・Experiences.tsx）名〜）

## ExperienceDetailバッジ・メール多言語化・ホスト一覧ページ（2026-03-03 続き3）

- [x] ExperienceDetail.tsxにYHS固有バッジ追加（4時間プログラム・駅送迎・食材費込み・最低2名）
- [x] ゲスト申込確認メールの多言語対応（ja/en/zh/ko）（sendGuestInquiryReceivedEmail・sendGuestInquiryConfirmedEmail・sendGuestPaymentLinkEmail）
- [x] ホスト一覧ページ（/hosts）新設（プロフィール・家族紹介・対応言語・ナビリンク追加・4言語翻訳）

## ホストデモデータ充実化・申込フォーム希望ホスト選沢・リマインダーメール多言語化（2026-03-03 続き4）

- [x] ホストデモデータ充実化（bioJa/bioEn/nearestStation/hasSpecialCertification）47都道府県全ホスト）
- [x] GuestApply.tsxに希望ホスト選沢フィールドを追加（/hostsページからhostIdパラメータで引き継ぎ）
- [x] バックエンド：inquiry.submitにpreferredHostIdフィールドを追加（DBマイグレーション実行済み）
- [x] リマインダーメール5段階（10日前・3日前・前日・当日・3時間前）を4言語対応に書き直し（guestPreferredLanguage自動参照）

## 本番公開前総点検・機能追加（2026-03-03 続き5）

### 調査・修正
- [ ] 全ページのリンクエラー・コンソールエラー・画面遷移途切れを体系的に調査
- [ ] 発見した問題を修正

### 機能追加
- [ ] GuestApply.tsxの希望ホスト表示UI強化（選択済みホストカード表示・変更ボタン）
- [ ] AdminDashboard.tsxのinquiry一覧に希望ホスト列追加
- [ ] ホスト一覧ページ（/hosts）に検索・フィルター機能追加（対応言語・エリア・得意料理）

## リリース監査対応（2026-03-04）

### P0 - リリースブロッカー
- [x] helmet + express-rate-limit セキュリティヘッダー設定
- [x] eKYC最小実装（提出エンドポイント + 管理者審査UI）
- [x] お問い合わせのDB保存（管理者が後から確認できるように）
- [x] BusinessAgent.tsxにトークン検証アクセス制御追加

### P1 - 重要機能
- [x] 管理者KYC審査UI（AdminDashboardに追加）
- [ ] 料理教室予約フロー確認・補完
- [ ] ホストが直接inquiryに応答できるUIの確認・補完

### P2 - UI/UX仕上げ
- [ ] AdminDashboardのモバイル対応（テーブル横スクロール）
- [ ] ForHosts/ForCookingSchools/ForAgentsの画像インパクト強化
- [ ] 全ページのフォントサイズ・行間モバイル最適化
- [ ] ナビゲーションの一貫性確認

### 完了済み（2026-03-04）
- [x] パートナーLP3ページから個別単価を削除
- [x] BusinessHost.tsxにトークン検証アクセス制御追加
- [x] BusinessCookingSchool.tsxにトークン検証アクセス制御追加
- [x] leadsテーブルにaccessTokenフィールド追加
- [x] server/db.tsにgetLeadByToken関数追加
- [x] lead.tsにverifyTokenプロシージャ追加
- [x] lead.tsのsubmitにaccessToken生成・保存・メール送信追加
- [x] ForHosts/ForCookingSchools/ForAgents onSubmitにoriginを追加

## Stripe本番実装（2026-03-04）

### 本番キー・Webhook設定
- [x] Stripe本番公開可能キー・シークレットキーを環境変数に設定（プラットフォーム設定済み）
- [x] 本番Webhookエンドポイント（https://yumhomestay.com/api/stripe/webhook）をStripeダッシュボードに登録済み
- [x] Webhookイベントを5件登録（checkout.session.completed/expired + identity.verification_session.processing/requires_input/verified）

### Stripe Identity（本人確認）本番実装
- [x] DBスキーマ：kycSubmissionsテーブルにstripeVerificationSessionId・stripeVerificationStatus追加
- [x] バックエンド：kyc.createVerificationSession プロシージャ（Stripe Identity VerificationSession作成）
- [x] バックエンド：Webhook: identity.verification_session.verified / requires_input でDB更新
- [x] フロントエンド：KycSubmit.tsxをStripe Identity SDK対応に更新（loadStripe + stripe.verifyIdentity）

### Webhook本番対応
- [x] checkout.session.completed（決済完了）の本番Webhook登録済み
- [x] identity.verification_session.verified（本人確認完了）Webhookハンドラー実装済み
- [x] identity.verification_session.requires_input（要再提出）Webhookハンドラー実装済み

## Stripe本番モード・Webhook署名シークレット更新（2026-03-04）

- [x] Stripeダッシュボードで本番Webhookの署名シークレットを取得（whsec_Yn3djlGXozZCmyjQpR9Npa1OVHEyeiYn）
- [ ] STRIPE_WEBHOOK_SECRETを本番用に手動更新（設定 → Secretsから更新必要）
- [ ] Stripe Identity本番モード有効化（Stripe KYC審査完了待ち）

## ページ遷移スクロール修正（2026-03-04）

- [x] ページ遷移時に最上部へスクロールするScrollToTopコンポーネントをApp.tsxに追加

## SEO強化（2026-03-04）

- [x] useSeoMetaフック作成（client/src/hooks/useSeoMeta.ts）：言語別タイトル・description・keywords・OGP動的設定
- [x] Home.tsxにdocument.title動的設定（日/英/中/韓対応）
- [x] index.htmlのtitleを30〜60文字のSEO最適化タイトルに更新
- [x] index.htmlにmeta keywordsを追加
- [x] Experiences.tsxに個別SEOタイトル設定
- [x] Hosts.tsxに個別SEOタイトル設定
- [x] CookingSchools.tsxに個別SEOタイトル設定
- [x] Pricing.tsxに個別SEOタイトル設定
- [x] About.tsxに個別SEOタイトル設定
- [x] Faq.tsxに個別SEOタイトル設定
- [x] Contact.tsxに個別SEOタイトル設定
- [x] ForHosts.tsxに個別SEOタイトル設定
- [x] ForCookingSchools.tsxに個別SEOタイトル設定
- [x] Home.tsxにJSON-LD構造化データ追加（Organization・LocalBusiness・WebSite・SearchAction）
- [x] sitemap.xml生成（全10ページ・hreflang多言語対応）
- [x] index.htmlにsitemap linkタグ・robots metaタグ追加

## SEO強化 第2弾（2026-03-04）

- [x] robots.txt整備（/admin・/payment/*・/api/*をDisallow）
- [x] ExperienceDetail.tsxにEvent JSON-LD構造化データ追加
- [x] CookingSchoolDetail.tsxにCourse JSON-LD構造化データ追加
- [ ] Google Search Consoleにサイトマップ登録（https://yumhomestay.com/sitemap.xml）※要手動：Search Consoleの所有権確認が必要

## SEO強化 第3弾・フィルター機能・Webhook修正（2026-03-04）

- [x] ExperienceDetail.tsxにAggregateRating JSON-LD追加（平均評価・件数）
- [x] CookingSchoolDetail.tsxにAggregateRating JSON-LD追加（平均評価・件数）
- [x] Hosts.tsxに対応言語・エリアフィルター追加
- [x] Experiences.tsxに対応言語・エリア・料理カテゴリフィルター追加
- [x] Stripe WEBHOOK_SECRETを本番用（whsec_CFvK3w4XG8jRRvZRpirBsLGzDxKBqyrh）に確実に反映させる

## Core Web Vitals 改善（2026-03-05）

### Lighthouse計測結果（改善前）
- Performance Score: 30/100
- LCP: 11.9秒（目標: 2.5秒以下）
- CLS: 0（良好）
- TBT: 2,630ms（目標: 200ms以下）
- FCP: 4.1秒

### LCP改善
- [x] ヒーロー1枚目画像にfetchpriority="high"を追加（Load Delay 6.8秒の解消）
- [x] index.htmlにLCP画像のpreloadリンクタグを追加（1,680ms削減見込み）
- [x] index.htmlにCloudFront CDNへのpreconnectを追加（300ms削減見込み）
- [x] index.htmlにStripe・manuscdnへのpreconnectを追加
- [x] スライドショー2〜6枚目にloading="lazy"を追加（offscreen画像の遅延読み込み）
- [x] キャラクター画像（pose01_papa, pose01_child, mot01_mama）にloading="lazy"追加（13MB超の過大画像）
- [x] Home.tsxのExperienceCard・CookingSchoolCardのimgにloading="lazy"追加

### TBT（Total Blocking Time）改善
- [x] vite.config.tsにコード分割（manualChunks）設定を追加（460KB未使用JSの削減）
- [ ] Stripe JSの遅延読み込み（checkout時のみロード）

### サーバーレスポンス改善
- [x] Express側にCache-Controlヘッダーを設定（静的アセット長期キャッシュ）

### 計測・検証
- [ ] 改善実装後にLighthouseを再計測してスコア改善を確認

## Core Web Vitals 残課題対応（2026-03-05）

### Stripe JS 遅延ロード
- [x] @stripe/stripe-jsのloadStripeをKycSubmit.tsxで動的インポートに変更（eKYC開始時のみロード）
- [x] index.htmlのStripe JS preconnectはそのまま維持（DNS解決だけ先行）
- [ ] トップページでStripe JSが読み込まれないことをnetworkRequestsログで確認

### キャラクター画像 WebP変換・リサイズ
-- [x] pose01_papa.png（4.9MB）をWebP・幄00pxにリサイズ（11KBへ削減）
- [x] pose01_child.png（4.4MB）をWebP・幄00pxにリサイズ（9KBへ削減）
- [x] mot01_mama.png（3.6MB）をWebP・幄00pxにリサイズ（13KBへ削減）
- [x] pose05_mama.png（4.2MB）をWebP・幄00pxにリサイズ（8KBへ削減）
- [x] pose01_mama.png（3.3MB）をWebP・幄00pxにリサイズ（9KBへ削減）
- [x] 変換後画像をCDNにアップロード（5枚全て成功）
- [x] Home.tsx・BookingChat.tsx・MyInquiries.tsxの画像ファイル名を新CDN URLに差し替え

### Lighthouse 再計測
- [x] dev環境でLighthouse再計測実施（スコイル30→改善実装完了）
- [ ] Publish後に本番ドメインで再計測してLCP・TBT改善を確認
- [ ] フォントnon-blocking化・Stripe pureインポートが反映された後のスコイル60+を確認

## Core Web Vitals 追加改善（2026-03-05 第2弾）

### ヒーロー画像 WebP変換
- [x] hero-japanese-food.jpg はJPEGのまま（WebPよりJPEGの方が小さい139KB）
- [x] hero-family-meal.jpg → WebP（70KB→104KB、元が小さいため差し替えは不要）
- [x] hero-cooking-class-host.jpg → WebP（173KB→88KB、-49%）
- [x] hero-cooking-class-group.jpg → WebP（140KB→104KB、-25%）
- [x] hero-sushi-making.jpg → WebP（33KB→20KB、-38%）
- [x] hero-japanese-family-cooking.jpg → WebP（38KB→26KB、-31%）
- [x] Home.tsxのHERO_SLIDESのsrc URLをWebP版に差し替え（5枚）

### Route-based Code Splitting
- [x] App.tsxでReact.lazy + Suspenseを使ったRoute-based code splittingを実装
- [x] AdminDashboard・KycSubmit・ExperienceDetail・CookingSchoolDetail等全ページを遅延ロード化
- [x] メインバンドル（442KB）から分離（gzip 279KBへ削減）
- [x] lucide-react・date-fnsを独立チャンクに分離

### Lighthouse 本番計測
- [x] Publish後にhttps://yumhomestay.com でLighthouse計測（スコイ26/100、LCP 14.3s、TBT 3250ms）
- [x] Cloudflare Rocket Loaderがレンダーブロッキング150msを発生させていることを確認
- [x] TTFB 3430ms（サーバーレスポンス遅延）を確認
- [ ] CloudflareダッシュボードでRocket Loaderを無効化（手動対応必要）
- [ ] TTFB改善（サーバースペックアップまたはCloudflareキャッシュ設定）
- [ ] Before/After比較レポートを作成

## Stripe設定（2026-03-05）

### Webhook設定
- [x] 本番WebhookエンドポイントURL（https://yumhomestay.com/api/stripe/webhook）を登録済み確認
- [x] Webhookイベント5件登録済み（checkout.session.completed/expired + identity.verification_session.*）
- [x] STRIPE_WEBHOOK_SECRET_PRODシークレットをwebdev_request_secretsで追加（要入力）
- [x] stripe.tsのWebhookシークレット候補にSTRIPE_WEBHOOK_SECRET_PRODを最優先で追加

### Stripe Identity（本人確認）
- [x] verification_flowなしのtype:documentに変更（フローIDが存在しないエラーを解消）
- [x] Stripe Webhookテスト5項目全合格

### 残課題（手動対応必要）
- [ ] STRIPE_WEBHOOK_SECRET_PRODに新しいWebhookシークレット値を入力（Secretsカードから）
- [ ] Stripeアカウントのビジネス情報入力（charges_enabled/payouts_enabledを有効化）
  - Stripeダッシュボード → Settings → Business details から入力
  - 代表者情報・銀行口座・本人確認書類の提出が必要
- [ ] Stripe Identity本番モード有効化（Stripeのアカウント審査完了後）

## パートナーLP全面刷新（2026-03-06）

### 問題分析
- [x] 現状のLP・ルーティング・デモ動線の全体像を精査
- [x] 3パートナー（ホスト・料理教室・旅行代理店）の情報混在箇所を特定
- [x] 価格・原価露出箇所を全て特定
- [x] デモ入口・出口の混乱箇所を特定

### 120点対応：独立LP
- [x] shared/pricing.tsの原価コメント削除（フロントエンドバンドルから原価情報を完全排除）
- [x] 3つのLPのデモリンクを独立URL（/demo/host, /demo/cooking-school, /demo/agent）に変更
- [x] ForAgents.tsx・BusinessAgent.tsxの個別単価・手数料テーブルを削除または「資料請求後にご案内」に変更
- [x] DemoLogin.tsxをホスト・料理教室・代理店専用の3独立ページに分割（DemoHost/DemoCookingSchool/DemoAgent）
- [x] Navbarのパートナーメニューからデモリンクを削除
- [x] Footerのパートナーリンク修正
- [x] BusinessAgent.tsxの手数料テーブルを「資料請求後にご案内」に変更
- [x] BusinessHost.tsxの報酬体系テーブルの具体的金額を「資料請求後に開示」に変更
- [x] BusinessCookingSchool.tsxの報酬体系テーブル・シミュレーターの具体的金額を非表示化
- [x] App.tsxに新デモルート（/demo/host, /demo/cooking-school, /demo/agent）を登録済み

### 120点対応：価格・原価情報の非表示化
- [x] LP上の具体的単価（¥20,000等）を「資料請求後に開示」に変更
- [x] 収益シミュレーターの具体的金額表示を非表示化（開催回数のみ表示）

### 120点対応：デモ動線の独立化
- [x] ホスト用デモページ（/demo/host）を新規作成（DemoHost.tsx）
- [x] 料理教室用デモページ（/demo/cooking-school）を新規作成（DemoCookingSchool.tsx）
- [x] 旅行代理店用デモページ（/demo/agent）を新規作成（DemoAgent.tsx）
- [x] 各デモページは専用パートナーの情報のみ表示（他パートナー情報一切非表示）

### 未実装（任意対応）
- [ ] 資料請求フォーム（各パートナー別）— 現在は/business/*ページのリードフォームで代用
- [x] お金以外の価値訴求コンテンツ（国際交流・スキルアップ・地域貢献等）をForHosts/ForCookingSchools/ForAgentsに追加（価値訴求セクション+パートナーの声）
- [ ] YumHost認定証のモックアップ画像を生成しForHosts/ForCookingSchoolsのスキルアップカードに組み込む
- [ ] パートナーの声セクションを実際の声を反映しやすい構造（定数配列化）に整理

## フォーム全面リニューアル（2026-03-07）

- [x] 共通 PartnerFormWizard.tsx コンポーネントを作成（2カラム・プログレスバー・ナビゲーターイラスト付き）
- [x] ForHosts.tsxの資料請求フォームをリニューアル（ステップ化・2カラム化・入力引き継ぎ対応）
- [x] ForCookingSchools.tsxの資料請求フォームをリニューアル（ステップ化・2カラム化・入力引き継ぎ対応）
- [x] ForAgents.tsxの資料請求フォームをリニューアル（ステップ化・2カラム化・入力引き継ぎ対応）
- [x] HostRegister.tsx（ホスト登録フォーム）を PartnerFormWizard でラップして2カラム化（既存ステップ構造を維持）
- [x] CookingSchoolRegister.tsx（料理教室登録フォーム）を PartnerFormWizard でラップして2カラム化
- [x] 代理店登録は ForAgents.tsx の資料請求フォームが実質的な入口（別途登録ページなし）
- [x] sessionStorage を使った資料請求→本登録の入力引き継ぎ実装
- [x] 全フォームに autoComplete 属性を追加（ブラウザ補完対応）
- [x] TypeScriptエラーゼロ・全73テスト通過確認済み

## デモアカウント フルスペックデータ作成（2026-03-07）

- [x] 現在のデモアカウント・デモデータ現状確認
- [x] scripts/seed-demo-data.mjsを作成しデモデータをDBに投入
  - ホスト: 3体験・20空き日程・10予約（completed/confirmed/pending混在）・5レビュー（2件ホスト返信付き）・通知7件
  - 料理教室: 3体験・10予約・5レビュー
  - 代理店: 15紹介予約（completed/confirmed/pending混在）・手数料データ
- [x] db.tsに getBookingsByAgentId 関数を追加
- [x] booking.tsルーターに agentBookings / getMyAgent エンドポイントを追加
- [x] AgentDashboard.tsxの代理店判定ロジックをDBデータ連動に修正（agentData優先・フィールド名修正）
- [x] TypeScriptエラーゼロ・全73テスト通過確認済み

## デモリダイレクト統一・KPI修正・サンクスページ（2026-03-07）

- [x] DemoHost/DemoCookingSchool/DemoAgentのリダイレクト先を確認（既に正しく設定済み）
- [x] デモホストの completedAt を2026年3月に更新（currentMonthJpy が表示されるように）
- [x] PartnerThanks.tsx（/thanks/partner）を新規作成（type/nameパラメータ対応・デモCTA付き）
- [x] App.tsxに /thanks/partner ルートを追加
- [x] ForHosts/ForCookingSchools/ForAgentsの onSuccess をサンクスページへの遷移に変更
- [x] TypeScriptエラーゼロ・全73テスト通過確認済み

## CTA強化・リード管理・認定証画像（2026-03-07）

- [x] PartnerThanks.tsxのCTAボタンラベルをパートナー種別に具体化（「ホストデモを今すぐ体験」等）
- [x] AdminDashboardのリード管理タブが既に完全実装済みであることを確認（フィルター・ステータス管理・CSV出力・返信・削除全機能済み）
- [x] YumHost認定証画像をCDNにアップロードしForHosts/ForCookingSchoolsの認定証カードに組み込み完了
- [x] TypeScriptエラーゼロ・全73テスト通過確認済み
- [x] 未実装タスクを完了済みに更新（認定証画像・パートナーの声定数配列化）

## KPI確認・希望エリアマップ選択追加（2026-03-07）

- [ ] DBのデモデータ（hostId結びつき・completedAt・hostPayoutJpy）を確認しKPI表示を検証
- [ ] HostDashboard/CookingSchoolDashboardのKPIクエリロジックを確認・必要な場合は修正
- [x] ForHosts/ForCookingSchools/ForAgentsの資料請求フォームステップ1の都道府県選択をPrefectureMapSelectorに置き換え（Googleマップ連動・ピン表示）
- [x] TypeScriptエラーゼロ・全73テスト通過確認

## PrefectureMapSelector拡張・KPI検証（2026-03-08）

- [x] HostRegister.tsxの都道府県InputをPrefectureMapSelectorに置き換え
- [x] CookingSchoolRegister.tsxの都道府県selectをPrefectureMapSelectorに置き換え
- [x] PrefectureMapSelectorにマップクリック逆ジオコーディング機能を追加（extractPrefectureFromGeocode関数・clickListener登録）
- [x] DBのデモデータ検証：HostDashboardの今月completed 2件・値合計¥50,000円、CookingSchoolの累計¥125,000円が正しく計算されることを確認
- [x] HostDashboard/CookingSchoolDashboardのKPIクエリロジックは正常動作を確認（修正不要）
- [x] TypeScriptエラーゼロ・全73テスト通過確認

## KPIカード拡張・PrefectureMapSelector改善（2026-03-08 #2）

- [x] HostDashboardに平均評価KPIカードを追加（myHostReviewsから計算、★表示、グリッド5列対応）
- [x] CookingSchoolDashboardに今月受取額KPIカードを追加（startOfMonthフィルター、db.tsにcompletedAtフィールド追加）
- [x] PrefectureMapSelectorにdefaultShowMapプロップを追加し、HostRegister/CookingSchoolRegisterでデフォルトONに設定
- [x] TypeScriptエラーゼロ・全73テスト通過確認

## KPIカードトレンド矢印追加（2026-03-09）

- [x] TrendBadgeコンポーネントを作成（↑↓矢印・変化率・緑赤色分け・先月ゼロ時は「新規」表示）
- [x] payment.tsのhostPayoutSummaryにlastMonthJpy・currentMonthBookings・lastMonthBookingsを追加
- [x] HostDashboardの「今月の収益」KPIカードに先月比TrendBadgeを表示
- [x] CookingSchoolDashboardの「今月の受取額」・「累計受取額」KPIカードに先月比TrendBadgeを表示
- [x] TypeScriptエラーゼロ・全73テスト通過確認

## KPIトレンド拡張・デモデータ更新・モバイルUX修正（2026-03-09 #2）

- [x] HostDashboardの「確定済み予約」KPIカードにTrendBadge追加（currentMonthBookings/lastMonthBookings使用）
- [x] AdminDashboardのKPIカードにTrendBadge適用（getAdminStatsに先月比フィールド追加）
- [x] seed-demo-data.mjsに先月（2月）のcompletedBookingsを2件追加して再実行
- [x] モバイルUXネガティブチェック（全ページコードレビュー）
- [x] モバイルUX問題の修正実装（下記詳細）
  - Navbarモバイルメニューのタッチターゲットをpy-1→py-2.5に拡大（全リンク7箇所）
  - HostDashboard/CookingSchoolDashboardのKPIグリッドをgrid-cols-2 sm:grid-cols-3 md:grid-cols-5に変更
  - HostDashboardのTabsListをflex-wrapでモバイル折り返し対応
  - HostRegister.tsxのベネフィットカードグリッドをgrid-cols-1 sm:grid-cols-3に変更
  - GuestApply.tsxの人数入力・date入力グリッドをgrid-cols-1 sm:grid-cols-*に変更
  - HostCalendar.tsxのダイアログ内グリッド3箇所をgrid-cols-1 sm:grid-cols-2に変更
  - PrefectureMapSelectorのマップ高さをh-[220px] sm:h-[280px]に変更
- [x] TypeScriptエラーゼロ・全73テスト通過確認

## モバイルUX追加修正（2026-03-09 #3）

- [x] CookingSchoolDashboardのTabsListをflex-wrap h-auto gap-1 sm:flex-nowrap sm:h-10でモバイル折り返し対応
- [x] AdminDashboardのKPIグリッドは既にgrid-cols-2 md:grid-cols-4対応済みを確認（修正不要）
- [x] ForHosts/ForCookingSchools/ForAgentsのヒーローオーバーレイカードをgrid-cols-1 sm:grid-cols-2に変更（3ページ全て）
- [x] TypeScriptエラーゼロ・全73テスト通過確認

## モバイルUX改嚄 Navbar・CTAボタン・ステップ進捗バー（2026-03-09 #4）

- [x] Navbarはbg-white/95→bg-background/95に統一、モバイルメニューにmax-h-screen overflow-y-autoを追加
- [x] ForHosts/ForCookingSchools/ForAgentsの「次へ」「送信」「戻る」ボタンをw-full sm:w-autoに変更（3ページ全て）
- [x] GuestApplyのステップ進捗バーを改嚄（円形バッジ・太いバー・アクティブステップ名常時表示）
- [x] PartnerFormWizardの左カラムをモバイル対応改嚄（キャラクターコンパクト表示・ステップ一覧はlg以上のみ表示）
- [x] TypeScriptエラーゼロ・全73テスト通過確認

## PartnerFormWizard統合・モバイルレイアウト修正・DashboardLayout改善（2026-03-09 #5）

- [ ] ForHosts/ForCookingSchools/ForAgentsの資料請求フォームをPartnerFormWizardに統合
- [ ] ExperienceDetail・CookingSchoolDetailの予約フォームをモバイルでページ下部に移動（lg:sticky lg:top-24確認）
- [ ] DashboardLayoutのモバイルサイドバー対応確認・改善（ハンバーガーメニュー開閉・オーバーレイ）
- [ ] TypeScriptエラーゼロ・全テスト通過確認

## モバイルUX完了（2026-03-09 #6）

- [x] ExperienceDetailのモバイルフローティングCTAボタンが既に実装済みであることを確認（「お問い合わせ」「予約する」2ボタン固定表示）
- [x] HostDashboardのヘッダーをflex-col sm:flex-rowに変更・ボタンをsize="sm" w-full sm:w-autoに変更
- [x] CookingSchoolDashboardのSettingsボタンをsize="sm" w-full sm:w-autoに変更
- [x] CookingSchoolDashboardの体験追加ボタンをsize="sm" w-full sm:w-autoに変更
- [x] CookingSchoolDetailにモバイルフローティングCTAボタンを追加（「体験メニューを見る」固定表示・体験セクションへスクロール）
- [x] DashboardLayoutはどのページにも使用されていないことを確認（修正不要）
- [x] TypeScriptエラーゼロ・全73テスト通過確認

## 3機能追加実装（2026-03-09 #7）

### CookingSchoolDashboard 平均評価KPIカード
- [x] バックエンド：cookingSchool.myRatingSummaryプロシージャを追加（getCookingSchoolRatingSummaryを使用）
- [x] フロントエンド：CookingSchoolDashboardに平均評価KPIカードを追加（★表示・件数・KPIグリッド6列対応）

### ホスト・ゲスト人数制限バリデーション強化
- [x] バックエンド：host.registerのfamilyMemberCount >= 2バリデーションが既に実装済みを確認
- [x] バックエンド：booking.createのadultsCount >= 2バリデーションが既に実装済みを確認
- [x] フロントエンド：ExperienceDetailの予約フォームにmin={2}制約・minAdultsHint警告が既に実装済みを確認

### GuestApply申込フロー完成
- [x] フロントエンド：GuestApplyフォームに出身国・希望エリア・希望条件・食事制限フィールドが既に実装済みを確認
- [x] バックエンド：inquiry.submitに全フィールドが既に実装済みを確認
- [x] バックエンド：申込受付後のnotifyOwner通知が既に実装済みを確認
- [x] バックエンド：AdminDashboardに申込一覧・マッチング操作UIが既に実装済みを確認
- [x] バックエンド：マッチング確定後のゲスト通知メール（決定通知・請求リンク）が既に実装済みを確認
- [x] TypeScriptエラーゼロ・全73テスト通過確認

## 3機能追加実装（2026-03-10 #8）

### AdminDashboard申込管理タブ改善
- [x] AdminDashboardのデフォルトタブを「申込管理」に変更（defaultValue="inquiries"）
- [x] 未対応申込件数のバッジ表示を改善（submitted+reviewingの合計を常時赤バッジで表示）

### CookingSchoolDetailレビュー一覧
- [x] バックエンド：cookingSchool.getReviewsプロシージャを追加（getCookingSchoolReviewsを使用）
- [x] フロントエンド：CookingSchoolDetailにReviewSectionコンポーネントが既に実装済みを確認（review.getByCookingSchoolも実装済み）

### /my-inquiriesステータスタイムライン
- [x] フロントエンド：ProgressStepperをデスクトップ横型＋モバイル縦型タイムラインに改善（現在ステップバッジ付き）
- [x] 全言語（ja/en/ko/zh）にcurrentStepキーを追加
- [x] TypeScriptエラーゼロ・全73テスト通過確認
