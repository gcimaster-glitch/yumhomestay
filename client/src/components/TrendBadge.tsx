import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendBadgeProps {
  /** 今月の値 */
  current: number;
  /** 先月の値 */
  previous: number;
  /** 表示単位（省略時は%のみ） */
  unit?: string;
  className?: string;
}

/**
 * 先月比較のトレンドバッジ
 * - 上昇: 緑 + ↑ + 変化率
 * - 下降: 赤 + ↓ + 変化率
 * - 変化なし / 先月データなし: グレー + — 
 */
export function TrendBadge({ current, previous, unit, className }: TrendBadgeProps) {
  // 先月がゼロの場合
  if (previous === 0) {
    if (current === 0) {
      return (
        <span className={cn("inline-flex items-center gap-0.5 text-xs text-muted-foreground", className)}>
          <Minus className="w-3 h-3" />
          <span>先月比なし</span>
        </span>
      );
    }
    // 先月ゼロ・今月あり → 新規
    return (
      <span className={cn("inline-flex items-center gap-0.5 text-xs text-emerald-600 font-medium", className)}>
        <TrendingUp className="w-3 h-3" />
        <span>新規</span>
      </span>
    );
  }

  const diff = current - previous;
  const pct = Math.round((diff / previous) * 100);

  if (pct === 0) {
    return (
      <span className={cn("inline-flex items-center gap-0.5 text-xs text-muted-foreground", className)}>
        <Minus className="w-3 h-3" />
        <span>±0%</span>
      </span>
    );
  }

  if (pct > 0) {
    return (
      <span className={cn("inline-flex items-center gap-0.5 text-xs text-emerald-600 font-medium", className)}>
        <TrendingUp className="w-3 h-3" />
        <span>+{pct}%</span>
        {unit && <span className="text-muted-foreground font-normal">先月比</span>}
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs text-rose-500 font-medium", className)}>
      <TrendingDown className="w-3 h-3" />
      <span>{pct}%</span>
      {unit && <span className="text-muted-foreground font-normal">先月比</span>}
    </span>
  );
}
