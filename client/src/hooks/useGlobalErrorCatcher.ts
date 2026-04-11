/**
 * 循環型エラー発見システム — グローバルエラーキャッチャー
 *
 * ErrorBoundaryでは捕捉できない以下のエラーを収集する:
 * - window.onerror: スクリプトエラー
 * - window.onunhandledrejection: Promise拒否（tRPC通信エラー等）
 *
 * App.tsxのルートコンポーネントで1回だけ呼び出す
 */

import { useEffect } from "react";

// レート制限: 同一エラーを短時間に大量送信しない
const reportedErrors = new Set<string>();
const MAX_REPORTS_PER_SESSION = 50;
let reportCount = 0;

async function sendError(payload: {
  errorType: string;
  message: string;
  stack?: string;
  url?: string;
  source: "frontend" | "backend" | "api";
}): Promise<void> {
  if (reportCount >= MAX_REPORTS_PER_SESSION) return;

  // 重複チェック（同一エラーは1セッションで1回のみ送信）
  const key = `${payload.errorType}:${payload.message.slice(0, 100)}`;
  if (reportedErrors.has(key)) return;
  reportedErrors.add(key);
  reportCount++;

  try {
    await fetch("/api/trpc/errorMonitor.report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        json: {
          ...payload,
          url: payload.url ?? window.location.href,
          userAgent: navigator.userAgent.slice(0, 500),
        },
      }),
    });
  } catch {
    // 送信失敗は無視
  }
}

export function useGlobalErrorCatcher(): void {
  useEffect(() => {
    // スクリプトエラー（TypeError, ReferenceError等）
    const handleError = (event: ErrorEvent): void => {
      sendError({
        errorType: event.error?.name ?? "ScriptError",
        message: event.message ?? "Unknown script error",
        stack: event.error?.stack?.slice(0, 5000),
        url: event.filename ?? window.location.href,
        source: "frontend",
      });
    };

    // Promise拒否（tRPCエラー、fetch失敗等）
    const handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
      const reason = event.reason;
      const isError = reason instanceof Error;
      const message = isError
        ? reason.message
        : typeof reason === "string"
        ? reason
        : JSON.stringify(reason).slice(0, 500);

      // tRPCエラーの場合は詳細情報を付加
      let errorType = "UnhandledPromiseRejection";
      if (isError && reason.name) errorType = reason.name;
      if (message.includes("TRPC") || message.includes("trpc")) errorType = "TRPCError";
      if (message.includes("Failed to fetch") || message.includes("NetworkError")) errorType = "NetworkError";
      if (message.includes("Loading chunk") || message.includes("ChunkLoadError")) errorType = "ChunkLoadError";

      sendError({
        errorType,
        message,
        stack: isError ? reason.stack?.slice(0, 5000) : undefined,
        source: "frontend",
      });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);
}
