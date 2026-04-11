/**
 * YumHomeStay パートナーAPIキー管理ページ
 *
 * 【BizDev監査指摘対応】
 * - 上場企業とのアライアンス時に必要なAPIキー管理UI
 * - OTA/代理店パートナーが自社システムとYHSを連携するためのキー管理
 * - セキュリティ: 平文キーは作成時のみ表示（再表示不可）
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  Key,
  Plus,
  Trash2,
  Copy,
  CheckCircle,
  AlertTriangle,
  Shield,
  Clock,
  Activity,
} from "lucide-react";

export default function ApiKeys() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [revokeConfirmId, setRevokeConfirmId] = useState<number | null>(null);

  // ─── データ取得 ──────────────────────────────────────────────────────────────
  const { data: keys = [], refetch } = trpc.apiKey.list.useQuery(undefined, {
    enabled: !!user,
  });

  // ─── ミューテーション ────────────────────────────────────────────────────────
  const createMutation = trpc.apiKey.create.useMutation({
    onSuccess: (data) => {
      setCreatedKey(data.rawKey);
      setNewKeyName("");
      setShowCreateModal(false);
      refetch();
    },
  });

  const revokeMutation = trpc.apiKey.revoke.useMutation({
    onSuccess: () => {
      setRevokeConfirmId(null);
      refetch();
    },
  });

  // ─── ハンドラー ──────────────────────────────────────────────────────────────
  const handleCreate = () => {
    if (!newKeyName.trim()) return;
    createMutation.mutate({ name: newKeyName.trim() });
  };

  const handleCopyKey = async () => {
    if (!createdKey) return;
    await navigator.clipboard.writeText(createdKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 3000);
  };

  const handleRevoke = (id: number) => {
    revokeMutation.mutate({ id });
  };

  // ─── 認証チェック ────────────────────────────────────────────────────────────
  if (!user) {
    navigate("/login");
    return null;
  }

  // ─── レンダリング ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Key className="w-6 h-6 text-orange-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              APIキー管理
            </h1>
          </div>
          <p className="text-gray-500 text-sm">
            パートナーシステム連携用のAPIキーを管理します。キーは作成時にのみ表示されます。
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* セキュリティ注意事項 */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold mb-1">セキュリティに関する重要な注意事項</p>
            <ul className="list-disc list-inside space-y-1 text-amber-700">
              <li>APIキーは作成時にのみ表示されます。安全な場所に保管してください。</li>
              <li>キーが漏洩した場合は、直ちに無効化して新しいキーを発行してください。</li>
              <li>本番環境と開発環境では別々のキーを使用することを推奨します。</li>
            </ul>
          </div>
        </div>

        {/* 作成済みキーの表示（初回作成後） */}
        {createdKey && (
          <div className="bg-green-50 border border-green-300 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="font-semibold text-green-800">APIキーが作成されました</p>
            </div>
            <p className="text-sm text-green-700 mb-3">
              このキーは今後表示されません。今すぐコピーして安全な場所に保管してください。
            </p>
            <div className="flex items-center gap-2 bg-white border border-green-300 rounded-lg p-3">
              <code className="flex-1 text-sm font-mono text-gray-800 break-all">
                {createdKey}
              </code>
              <button
                onClick={handleCopyKey}
                className="flex-shrink-0 p-2 rounded-lg hover:bg-green-100 transition-colors"
                title="コピー"
              >
                {copiedKey ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500" />
                )}
              </button>
            </div>
            <button
              onClick={() => setCreatedKey(null)}
              className="mt-3 text-sm text-green-700 underline"
            >
              確認しました。非表示にする
            </button>
          </div>
        )}

        {/* キー一覧 + 新規作成ボタン */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-gray-500" />
              <h2 className="font-semibold text-gray-800">
                APIキー一覧 ({keys.filter((k) => k.isActive).length} / 10)
              </h2>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              disabled={keys.filter((k) => k.isActive).length >= 10}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
              新しいキーを作成
            </button>
          </div>

          {keys.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <Key className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">APIキーがまだありません</p>
              <p className="text-xs mt-1">「新しいキーを作成」ボタンから作成してください</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {keys.map((key) => (
                <div
                  key={key.id}
                  className={`px-6 py-4 flex items-center gap-4 ${
                    !key.isActive ? "opacity-50 bg-gray-50" : ""
                  }`}
                >
                  {/* ステータスインジケーター */}
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      key.isActive ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />

                  {/* キー情報 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-800 truncate">
                        {key.name}
                      </span>
                      {!key.isActive && (
                        <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">
                          無効
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                        {key.keyPrefix}••••••••
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        作成: {new Date(key.createdAt).toLocaleDateString("ja-JP")}
                      </span>
                      {key.lastUsedAt && (
                        <span className="flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          最終使用: {new Date(key.lastUsedAt).toLocaleDateString("ja-JP")}
                        </span>
                      )}
                      {key.expiresAt && (
                        <span className="text-amber-600">
                          有効期限: {new Date(key.expiresAt).toLocaleDateString("ja-JP")}
                        </span>
                      )}
                    </div>
                    <div className="mt-1">
                      <span className="text-xs text-gray-400">
                        スコープ: {key.scopes}
                      </span>
                    </div>
                  </div>

                  {/* 操作ボタン */}
                  {key.isActive && (
                    <div className="flex-shrink-0">
                      {revokeConfirmId === key.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-red-600">本当に無効化しますか？</span>
                          <button
                            onClick={() => handleRevoke(key.id)}
                            disabled={revokeMutation.isPending}
                            className="text-xs px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          >
                            無効化
                          </button>
                          <button
                            onClick={() => setRevokeConfirmId(null)}
                            className="text-xs px-3 py-1.5 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
                          >
                            キャンセル
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setRevokeConfirmId(key.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="無効化"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* API仕様リンク */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-semibold text-blue-800 mb-2">APIドキュメント</h3>
          <p className="text-sm text-blue-700 mb-3">
            YumHomeStay Partner APIを使用して、自社システムと連携できます。
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <p className="font-medium text-blue-800">認証方式</p>
              <p className="text-blue-600 font-mono text-xs mt-1">
                Authorization: Bearer {"{api_key}"}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <p className="font-medium text-blue-800">ベースURL</p>
              <p className="text-blue-600 font-mono text-xs mt-1">
                https://yumhomestay.com/api/v1
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <p className="font-medium text-blue-800">レート制限</p>
              <p className="text-blue-600 text-xs mt-1">
                100リクエスト / 分
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 新規作成モーダル */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              新しいAPIキーを作成
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  キーの名前 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="例: 本番環境用、テスト用"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  maxLength={100}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  権限スコープ
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600 font-mono">
                  read:experiences, create:bookings
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  ※ スコープの変更が必要な場合はサポートまでお問い合わせください
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewKeyName("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleCreate}
                disabled={!newKeyName.trim() || createMutation.isPending}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {createMutation.isPending ? "作成中..." : "作成する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
