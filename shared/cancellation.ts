/**
 * YumHomeStay — キャンセルポリシーと返金率計算
 *
 * ■ ポリシー定義（体験開始時刻からの日数で判定）
 *
 * flexible（柔軟）:
 *   - 7日以上前: 100% 返金
 *   - 3〜6日前:   50% 返金
 *   - 3日未満:     0% 返金
 *
 * moderate（標準）:
 *   - 14日以上前: 100% 返金
 *   - 7〜13日前:   50% 返金
 *   - 7日未満:     0% 返金
 *
 * strict（厳格）:
 *   - 30日以上前: 100% 返金
 *   - 14〜29日前:  50% 返金
 *   - 14日未満:    0% 返金
 *
 * ■ ホストキャンセルの場合は常に100%返金（ゲスト保護）
 */

export type CancellationPolicy = "flexible" | "moderate" | "strict";

export interface RefundCalculationResult {
  /** 返金率（0.0〜1.0） */
  refundRate: number;
  /** 返金額（JPY） */
  refundAmountJpy: number;
  /** 返金理由の説明（ログ・監査用） */
  reason: string;
  /** 返金なしの場合 true */
  noRefund: boolean;
}

/**
 * キャンセルポリシーと体験開始時刻から返金率・返金額を計算する
 *
 * @param policy - 体験のキャンセルポリシー
 * @param startTime - 体験の開始日時
 * @param amountJpy - 支払い済み金額（JPY）
 * @param cancelledBy - キャンセルした主体（"guest" | "host" | "admin"）
 * @param now - 現在時刻（テスト用にオーバーライド可能、デフォルトは new Date()）
 */
export function calcRefund(
  policy: CancellationPolicy,
  startTime: Date,
  amountJpy: number,
  cancelledBy: "guest" | "host" | "admin",
  now: Date = new Date(),
): RefundCalculationResult {
  // ホストまたは管理者によるキャンセルは常に100%返金（ゲスト保護）
  if (cancelledBy === "host" || cancelledBy === "admin") {
    return {
      refundRate: 1.0,
      refundAmountJpy: amountJpy,
      reason: `${cancelledBy === "host" ? "ホスト" : "管理者"}によるキャンセルのため全額返金`,
      noRefund: false,
    };
  }

  // 体験開始まで何日あるか計算（小数点切り捨て）
  const msUntilStart = startTime.getTime() - now.getTime();
  const daysUntilStart = Math.floor(msUntilStart / (1000 * 60 * 60 * 24));

  let refundRate: number;
  let reason: string;

  switch (policy) {
    case "flexible":
      if (daysUntilStart >= 7) {
        refundRate = 1.0;
        reason = `フレキシブルポリシー: 開始${daysUntilStart}日前のキャンセルのため全額返金`;
      } else if (daysUntilStart >= 3) {
        refundRate = 0.5;
        reason = `フレキシブルポリシー: 開始${daysUntilStart}日前のキャンセルのため50%返金`;
      } else {
        refundRate = 0.0;
        reason = `フレキシブルポリシー: 開始${daysUntilStart}日前のキャンセルのため返金なし`;
      }
      break;

    case "moderate":
      if (daysUntilStart >= 14) {
        refundRate = 1.0;
        reason = `スタンダードポリシー: 開始${daysUntilStart}日前のキャンセルのため全額返金`;
      } else if (daysUntilStart >= 7) {
        refundRate = 0.5;
        reason = `スタンダードポリシー: 開始${daysUntilStart}日前のキャンセルのため50%返金`;
      } else {
        refundRate = 0.0;
        reason = `スタンダードポリシー: 開始${daysUntilStart}日前のキャンセルのため返金なし`;
      }
      break;

    case "strict":
      if (daysUntilStart >= 30) {
        refundRate = 1.0;
        reason = `ストリクトポリシー: 開始${daysUntilStart}日前のキャンセルのため全額返金`;
      } else if (daysUntilStart >= 14) {
        refundRate = 0.5;
        reason = `ストリクトポリシー: 開始${daysUntilStart}日前のキャンセルのため50%返金`;
      } else {
        refundRate = 0.0;
        reason = `ストリクトポリシー: 開始${daysUntilStart}日前のキャンセルのため返金なし`;
      }
      break;

    default:
      refundRate = 0.0;
      reason = "不明なポリシーのため返金なし";
  }

  const refundAmountJpy = Math.floor(amountJpy * refundRate);

  return {
    refundRate,
    refundAmountJpy,
    reason,
    noRefund: refundRate === 0,
  };
}

/**
 * キャンセルポリシーの日本語説明文を返す
 */
export function getCancellationPolicyDescription(policy: CancellationPolicy): {
  ja: string;
  en: string;
} {
  switch (policy) {
    case "flexible":
      return {
        ja: "【フレキシブル】7日以上前: 全額返金 / 3〜6日前: 50%返金 / 3日未満: 返金なし",
        en: "【Flexible】7+ days before: Full refund / 3-6 days: 50% refund / Under 3 days: No refund",
      };
    case "moderate":
      return {
        ja: "【スタンダード】14日以上前: 全額返金 / 7〜13日前: 50%返金 / 7日未満: 返金なし",
        en: "【Moderate】14+ days before: Full refund / 7-13 days: 50% refund / Under 7 days: No refund",
      };
    case "strict":
      return {
        ja: "【ストリクト】30日以上前: 全額返金 / 14〜29日前: 50%返金 / 14日未満: 返金なし",
        en: "【Strict】30+ days before: Full refund / 14-29 days: 50% refund / Under 14 days: No refund",
      };
  }
}
