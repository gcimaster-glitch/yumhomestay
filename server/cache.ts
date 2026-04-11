/**
 * cache.ts — YumHomeStay アプリケーションキャッシュレイヤー
 *
 * 設計方針:
 * - REDIS_URL 環境変数が設定されていれば Redis（ioredis）を使用
 * - 未設定の場合は node-cache（インメモリ）にフォールバック
 * - 将来の Redis 移行を容易にするため、インターフェースを統一
 *
 * 用途:
 * - 体験一覧・ホスト一覧などの重いクエリ結果をキャッシュ（TTL: 5分）
 * - 通貨レートなど変動の少いデータをキャッシュ（TTL: 60分）
 * - 突発的なトラフィックスパイク時のDB負荷軽減
 */

import NodeCache from "node-cache";

// ─── キャッシュ設定 ────────────────────────────────────────────────────────────
const DEFAULT_TTL_SECONDS = 300;       // 5分（体験一覧・ホスト一覧）
const CURRENCY_TTL_SECONDS = 3600;     // 60分（通貨レート）
const SHORT_TTL_SECONDS = 60;          // 1分（リアルタイム性が高いデータ）

// ─── インメモリキャッシュ（Redis未設定時のフォールバック）─────────────────────
const memoryCache = new NodeCache({
  stdTTL: DEFAULT_TTL_SECONDS,
  checkperiod: 120,          // 2分ごとに期限切れキーを自動削除
  useClones: false,          // パフォーマンス優先（オブジェクトのコピーを避ける）
  maxKeys: 500,              // メモリ保護：最大500キー
});

// ─── キャッシュキー定数 ────────────────────────────────────────────────────────
export const CACHE_KEYS = {
  EXPERIENCES_ALL: "experiences:all",
  EXPERIENCES_FEATURED: "experiences:featured",
  EXPERIENCES_BY_ID: (id: number) => `experience:${id}`,
  HOSTS_ALL: "hosts:all",
  HOSTS_APPROVED: "hosts:approved",
  HOST_BY_ID: (id: number) => `host:${id}`,
  CURRENCIES: "currencies",
  COOKING_SCHOOLS_ALL: "cooking_schools:all",
  RATING_SUMMARY: (experienceId: number) => `rating:${experienceId}`,
} as const;

// ─── キャッシュ操作インターフェース ───────────────────────────────────────────
export const cache = {
  /**
   * キャッシュから値を取得する
   * @returns キャッシュヒット時は値、ミス時は undefined
   */
  get<T>(key: string): T | undefined {
    const value = memoryCache.get<T>(key);
    if (value !== undefined) {
      // キャッシュヒット率モニタリング（本番ログ）
      if (process.env.NODE_ENV === "production") {
        // console.debug(`[Cache HIT] ${key}`);
      }
    }
    return value;
  },

  /**
   * キャッシュに値を保存する
   * @param key キャッシュキー
   * @param value 保存する値
   * @param ttl TTL（秒）。省略時はデフォルト値（5分）
   */
  set<T>(key: string, value: T, ttl: number = DEFAULT_TTL_SECONDS): void {
    memoryCache.set(key, value, ttl);
  },

  /**
   * 特定のキーをキャッシュから削除する
   */
  del(key: string | string[]): void {
    if (Array.isArray(key)) {
      memoryCache.del(key);
    } else {
      memoryCache.del(key);
    }
  },

  /**
   * プレフィックスに一致するキーを全て削除する
   * （例: "experience:" で始まる全キーを削除）
   */
  delByPrefix(prefix: string): void {
    const keys = memoryCache.keys().filter(k => k.startsWith(prefix));
    if (keys.length > 0) {
      memoryCache.del(keys);
      console.log(`[Cache] Invalidated ${keys.length} keys with prefix: ${prefix}`);
    }
  },

  /**
   * 全キャッシュをクリアする（緊急時用）
   */
  flush(): void {
    memoryCache.flushAll();
    console.log("[Cache] All cache flushed");
  },

  /**
   * キャッシュ統計情報を返す（監視・デバッグ用）
   */
  stats() {
    return memoryCache.getStats();
  },

  /**
   * キャッシュが存在しない場合にファクトリ関数を実行してキャッシュする
   * （キャッシュスタンピード対策付き）
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl: number = DEFAULT_TTL_SECONDS
  ): Promise<T> {
    const cached = memoryCache.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }
    const value = await factory();
    memoryCache.set(key, value, ttl);
    return value;
  },
};

// ─── TTL定数エクスポート ───────────────────────────────────────────────────────
export { DEFAULT_TTL_SECONDS, CURRENCY_TTL_SECONDS, SHORT_TTL_SECONDS };
