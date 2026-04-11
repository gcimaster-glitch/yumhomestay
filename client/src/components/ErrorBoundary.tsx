/**
 * 循環型エラー発見システム — ErrorBoundary（拡張版）
 *
 * 機能:
 * 1. Reactレンダリングエラーを捕捉してサーバーに自動送信
 * 2. ユーザーフレンドリーなエラー画面を表示（日本語対応）
 * 3. 再試行ボタンとページリロードボタン
 */
import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw, RefreshCw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  reported: boolean;
}

// サーバーへのエラー報告（tRPCクライアントを使わず直接fetchで送信）
async function reportErrorToServer(error: Error, context?: string): Promise<void> {
  try {
    await fetch("/api/trpc/errorMonitor.report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        json: {
          errorType: error.name || "UnknownError",
          message: (error.message || "Unknown error").slice(0, 5000),
          stack: error.stack?.slice(0, 5000),
          url: window.location.href,
          userAgent: navigator.userAgent.slice(0, 500),
          context: context ? JSON.stringify({ componentStack: context.slice(0, 2000) }) : undefined,
          source: "frontend",
        },
      }),
    });
  } catch {
    // エラー報告自体が失敗しても無視（無限ループ防止）
  }
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, reported: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }): void {
    if (!this.state.reported) {
      reportErrorToServer(error, info.componentStack).then(() => {
        this.setState({ reported: true });
      });
    }
    console.error("[ErrorBoundary] Caught error:", error, info);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, reported: false });
  };

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;
      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-2xl p-8">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
              <AlertTriangle size={32} className="text-destructive" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-foreground">
              予期しないエラーが発生しました
            </h2>
            <p className="text-sm text-muted-foreground mb-1 text-center">
              このエラーは自動的に報告されました。{this.state.reported ? " ✓ 報告済み" : " 報告中..."}
            </p>
            <p className="text-xs text-muted-foreground mb-6 text-center">
              An unexpected error occurred. It has been automatically reported.
            </p>
            {isDev && (
              <div className="p-4 w-full rounded bg-muted overflow-auto mb-6 max-h-48">
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                  {this.state.error?.stack}
                </pre>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={this.handleRetry}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg",
                  "bg-primary text-primary-foreground",
                  "hover:opacity-90 cursor-pointer text-sm font-medium"
                )}
              >
                <RefreshCw size={15} />
                再試行
              </button>
              <button
                onClick={() => window.location.reload()}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg",
                  "bg-secondary text-secondary-foreground",
                  "hover:opacity-90 cursor-pointer text-sm font-medium"
                )}
              >
                <RotateCcw size={15} />
                ページを再読み込み
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
export default ErrorBoundary;
