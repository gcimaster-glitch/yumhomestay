/**
 * YumHomeStay (YHS) — 体験プログラム料金定数（ゲスト向け表示用）
 *
 * ■ 基本パッケージ（大人2名・4時間）
 *   追加人数に応じた料金は各定数を参照。
 *
 * NOTE: 内部原価・手数料・利益構造はサーバーサイドのみで管理。
 *       フロントエンドからは YHS_BASE_PRICE_JPY / YHS_EXTRA_* のみ参照すること。
 */

// ─── 売上（ゲスト支払い額）───────────────────────────────────────────────────
/** 基本パッケージ：大人2名・4時間 */
export const YHS_BASE_PRICE_JPY = 55_000;

/** 追加大人1名あたり */
export const YHS_EXTRA_ADULT_JPY = 22_000;

/** 追加子供1名あたり（5歳以上） */
export const YHS_EXTRA_CHILD_JPY = 11_000;

/** 追加幼児1名あたり（5歳未満） */
export const YHS_EXTRA_INFANT_JPY = 5_500;

// ─── 内部原価・手数料（サーバーサイドのみ参照 — フロントエンドでimportしないこと）────

/** ホストファミリー報酬（基本2名・4時間） */
export const YHS_HOST_REWARD_JPY = 20_000;

/** 食材等原価 */
export const YHS_FOOD_COST_JPY = 5_000;

/** ホスト支払い合計（報酬 + 原価） */
export const YHS_HOST_PAYOUT_JPY = YHS_HOST_REWARD_JPY + YHS_FOOD_COST_JPY;

/** 旅行代理店手数料（代理店経由の場合のみ） */
export const YHS_AGENT_FEE_JPY = 8_800;

/** カード決済手数料率（売上の5%） */
export const YHS_CARD_FEE_RATE = 0.05;

/** アフィリエイト手数料 */
export const YHS_AFFILIATE_FEE_JPY = 2_200;

// ─── 利益計算ヘルパー（サーバーサイドのみ）──────────────────────────────────
/**
 * 体験予約の収益内訳を計算する（サーバーサイド専用）
 */
export function calcProfitBreakdown(totalSalesJpy: number, hasAgent: boolean) {
  const hostPayoutJpy = YHS_HOST_PAYOUT_JPY;
  const agentFeeJpy = hasAgent ? YHS_AGENT_FEE_JPY : 0;
  const cardFeeJpy = Math.round(totalSalesJpy * YHS_CARD_FEE_RATE);
  const affiliateFeeJpy = YHS_AFFILIATE_FEE_JPY;
  const platformProfitJpy =
    totalSalesJpy - hostPayoutJpy - agentFeeJpy - cardFeeJpy - affiliateFeeJpy;

  return {
    totalSalesJpy,
    hostPayoutJpy,
    agentFeeJpy,
    cardFeeJpy,
    affiliateFeeJpy,
    platformProfitJpy,
  };
}

/**
 * 参加人数から売上合計（JPY）を計算する
 */
export function calcTotalSalesJpy(
  adultsCount: number,
  childrenCount: number,
  infantsCount: number,
): number {
  const extraAdults = Math.max(0, adultsCount - 2);
  return (
    YHS_BASE_PRICE_JPY +
    extraAdults * YHS_EXTRA_ADULT_JPY +
    childrenCount * YHS_EXTRA_CHILD_JPY +
    infantsCount * YHS_EXTRA_INFANT_JPY
  );
}
