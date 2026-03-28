# ============================================================
# Stage 1: ビルドステージ
# Node.js 20 LTS + pnpm 10.4.1 を固定して確実にビルド
# ============================================================
FROM node:20-alpine AS builder

# pnpm をグローバルインストール（バージョン固定）
RUN npm install -g pnpm@10.4.1

WORKDIR /app

# 依存関係ファイルをコピー（キャッシュ効率化）
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/

# 全依存関係インストール（ビルドにdevDepsが必要）
RUN pnpm install --frozen-lockfile

# ソースコードをコピー
COPY . .

# ビルド実行（Vite + esbuild）
RUN pnpm run build

# ============================================================
# Stage 2: 本番実行ステージ
# dist/index.js は --packages=external でビルドされているため
# 実行時にも全 node_modules が必要
# ============================================================
FROM node:20-alpine AS runner

WORKDIR /app

# pnpm をグローバルインストール
RUN npm install -g pnpm@10.4.1

# 依存関係ファイルをコピー
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/

# 全依存関係インストール（vite等のdevDepsも実行時に必要）
RUN pnpm install --frozen-lockfile

# ビルド成果物をコピー
COPY --from=builder /app/dist ./dist

# ポート設定
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# 起動コマンド
CMD ["node", "dist/index.js"]
