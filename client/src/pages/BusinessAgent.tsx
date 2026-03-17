/**
 * BusinessAgent.tsx — 旅行代理店向けビジネスモデルページ
 * 収益シミュレーター + 無料登録申込みフォーム（2026年8月まで）
 */
import { useState } from "react";
import { Link, useSearch } from "wouter";
import { Lock, Mail } from "lucide-react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  Globe, Users, Banknote, CheckCircle, Gift,
  Info, Calculator, TrendingUp, Building2
} from "lucide-react";

// ─── 定数 ────────────────────────────────────────────────────────────────────

const COUNTRIES_OVERSEAS = [
  "アメリカ合衆国","中国","韓国","台湾","香港","シンガポール","タイ","インドネシア",
  "マレーシア","フィリピン","ベトナム","インド","オーストラリア","ニュージーランド",
  "イギリス","フランス","ドイツ","イタリア","スペイン","カナダ","ブラジル","メキシコ",
  "アラブ首長国連邦","その他",
];

const US_STATES = [
  "California","New York","Texas","Florida","Illinois","Pennsylvania","Ohio","Georgia",
  "North Carolina","Michigan","New Jersey","Virginia","Washington","Arizona","Massachusetts",
  "Tennessee","Indiana","Missouri","Maryland","Wisconsin","Colorado","Minnesota","South Carolina",
  "Alabama","Louisiana","Kentucky","Oregon","Oklahoma","Connecticut","Utah","その他",
];

const SPECIALTY_RACES = [
  "東アジア（中国・韓国・台湾）","東南アジア（タイ・シンガポール等）","南アジア（インド等）",
  "欧米（アメリカ・ヨーロッパ）","オセアニア（オーストラリア等）","中東・アフリカ","全地域対応",
];

// ─── フォームスキーマ ─────────────────────────────────────────────────────────

const formSchema = z.object({
  name: z.string().min(1, "担当者名を入力してください").max(100),
  company: z.string().min(1, "会社名を入力してください").max(200),
  email: z.string().email("正しいメールアドレスを入力してください"),
  phone: z
    .string()
    .min(10, "電話番号は10桁以上で入力してください")
    .max(20)
    .regex(/^[\d\-\+\(\)\s]+$/, "電話番号は数字・ハイフン・+のみ使用できます"),
  agentRegion: z.enum(["domestic", "international", "both"] as const, {
    error: "取扱エリアを選択してください",
  }),
  agentCountry: z.string().max(100).optional(),
  agentState: z.string().max(100).optional(),
  specialtyRace: z.string().min(1, "得意な顧客層を選択してください").max(200),
  q1Answer: z.string().min(1, "回答を入力してください").max(500),
  q2Answer: z.string().min(1, "回答を入力してください").max(500),
});
type FormValues = z.infer<typeof formSchema>;

// ─── 収益シミュレーター ───────────────────────────────────────────────────────

function AgentSimulator() {
  const [bookings, setBookings] = useState(10);       // 月間成約件数
  const [avgExtraAdults, setAvgExtraAdults] = useState(1); // 平均追加大人

  // 手数料は資料請求後に個別開示。ここでは成約件数のみ表示する。

  return (
    <Card className="border-blue-200 shadow-md">
      <CardHeader className="bg-blue-50 rounded-t-xl">
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Calculator className="w-5 h-5" />
          収益シミュレーター
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <Label className="text-sm font-medium">月間成約件数</Label>
              <span className="text-lg font-bold text-blue-700">{bookings}件</span>
            </div>
            <Slider
              min={1} max={50} step={1}
              value={[bookings]}
              onValueChange={([v]) => setBookings(v)}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1件</span><span>50件</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <Label className="text-sm font-medium">平均追加大人人数</Label>
              <span className="text-lg font-bold text-blue-700">{avgExtraAdults}名</span>
            </div>
            <Slider
              min={0} max={8} step={1}
              value={[avgExtraAdults]}
              onValueChange={([v]) => setAvgExtraAdults(v)}
            />
          </div>
        </div>

        <div className="bg-blue-50 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">月間成約件数</span>
            <span className="font-bold text-blue-700">{bookings}件</span>
          </div>
          <div className="border-t border-blue-200 pt-2 flex justify-between font-semibold">
            <span>1件あたり手数料</span>
            <span className="text-blue-700">資料請求後に個別ご案内</span>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <div className="text-sm text-muted-foreground mb-2">{bookings}件成約時の月収益レンジ</div>
          <div className="text-2xl font-bold text-blue-700">資料請求後に個別ご案内</div>
          <div className="text-xs text-muted-foreground mt-2">成約内容・人数・契約条件により异なります</div>
        </div>

        <p className="text-xs text-muted-foreground flex items-start gap-1">
          <Info className="w-3 h-3 mt-0.5 shrink-0" />
          上記はシミュレーション値です。実際の手数料は成約内容・人数・契約条件等により異なる場合があります。
        </p>
      </CardContent>
    </Card>
  );
}

// // ─── アクセス拒否画面 ─────────────────────────────────────────────────────
function AccessDenied() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold">詳細情報はお申し込み後にご覧いただけます</h1>
        <p className="text-muted-foreground">
          このページは資料請求またはデモ申請後にお送りするアクセスリンクからのみ開けます。
        </p>
        <Link href="/for-agents">
          <Button className="w-full">
            <Mail className="w-4 h-4 mr-2" />
            資料請求・デモ申請はこちら
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ─── メインページ（内部） ─────────────────────────────────────────────────────

function BusinessAgentInner() {
  const [submitted, setSubmitted] = useState(false);
  const [submittedName, setSubmittedName] = useState("");

  const submitLead = trpc.lead.submit.useMutation({
    onSuccess: () => {
      setSubmittedName(getValues("name"));
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: (err) => toast.error(err.message),
  });

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues, unknown, FormValues>({
    resolver: zodResolver(formSchema) as any,
  });

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    submitLead.mutate({ type: "agent", ...data });
  };

  const agentRegion = watch("agentRegion");
  const selectedCountry = watch("agentCountry");

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-6">
        <div className="max-w-lg w-full text-center space-y-6">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold">{submittedName} 様、無料登録申込みを受け付けました！</h1>
          <p className="text-muted-foreground">担当者より3営業日以内にご連絡いたします。</p>
          <Link href="/">
            <Button variant="outline">トップページへ戻る</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ── ヘッダー ── */}
      <div className="bg-gradient-to-r from-blue-800 to-indigo-700 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-blue-200 text-sm mb-3">
            <Link href="/for-agents" className="hover:text-white">旅行代理店向けLP</Link>
            <span>›</span>
            <span>ビジネスモデル詳細</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold mb-3">
            旅行代理店向けビジネスモデル
          </h1>
          <p className="text-blue-100">手数料体系と収益シミュレーターを詳しく解説します。</p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Link href="/demo/agent">
              <Button className="bg-white text-blue-700 hover:bg-blue-50">旅行代理店デモを体験</Button>
            </Link>
            <a href="#register">
              <Button variant="outline" className="border-white text-white hover:bg-white/10">無料登録を申込む</Button>
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-16">
        {/* ── ビジネスモデル説明 ── */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6">ビジネスモデルの仕組み</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: "1", icon: Users, title: "ゲストを紹介", desc: "旅行代理店が海外顧客にYumHomeStay体験を提案・予約手続きを代行します。" },
              { step: "2", icon: Globe, title: "YHSが運営", desc: "YumHomeStayがホストとのマッチング・当日運営・品質管理をすべて担当します。" },
              { step: "3", icon: Banknote, title: "手数料支払い", desc: "成約ごとに代理店手数料を月末締め・翌月末払いでお支払いします。" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <item.icon className="w-6 h-6 text-blue-700" />
                </div>
                <div className="text-xs font-bold text-blue-600 mb-1">STEP {item.step}</div>
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 手数料体系 ── */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6">代理店手数料体系</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-blue-800 text-white">
                  <th className="px-6 py-3 text-left rounded-tl-lg">項目</th>
                  <th className="px-6 py-3 text-right rounded-tr-lg">金額</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["基本手数料（2名成約）", "資料請求後に開示"],
                  ["追加大人 1名ごとのボーナス", "資料請求後に開示"],
                  ["月間10件以上成約ボーナス", "資料請求後に開示"],
                  ["月間20件以上成約ボーナス", "資料請求後に開示"],
                ].map(([label, value], i) => (
                  <tr key={label} className={i % 2 === 0 ? "bg-blue-50" : "bg-white"}>
                    <td className="px-6 py-3 text-foreground">{label}</td>
                    <td className="px-6 py-3 text-right font-bold text-blue-700">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── 代理店メリット ── */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6">代理店パートナーのメリット</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { icon: TrendingUp, title: "在庫リスクゼロ", desc: "成約ベースの手数料制なので、在庫リスクや固定費は一切ありません。" },
              { icon: Building2, title: "運営はYHSが担当", desc: "ホストとのマッチング・当日対応・クレーム処理はすべてYHSが担当します。" },
              { icon: Globe, title: "独自コンテンツで差別化", desc: "他社では提供できないホームステイ体験で、ツアーの付加価値を高めます。" },
              { icon: Users, title: "全国のホストネットワーク", desc: "全国のホストファミリー・料理教室と連携し、多様なエリアで提供可能です。" },
            ].map((item) => (
              <div key={item.title} className="flex gap-3 p-4 bg-blue-50 rounded-xl">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{item.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 収益シミュレーター ── */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6">収益シミュレーター</h2>
          <AgentSimulator />
        </section>

        {/* ── 無料登録申込みフォーム ── */}
        <section id="register-form">
          <div className="text-center mb-8">
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 mb-3">
              <Gift className="w-3 h-3 mr-1" />
              キャンペーン：2026年8月まで登録料無料
            </Badge>
            <h2 className="text-3xl font-bold text-foreground">無料パートナー登録を申込む</h2>
            <p className="text-muted-foreground mt-2">
              通常¥5,000の登録料が、2026年8月31日まで無料です。
            </p>
          </div>
          <Card className="border-blue-200 shadow-lg">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <Label htmlFor="name">担当者名 <span className="text-red-500">*</span></Label>
                  <Input id="name" placeholder="山田 太郎" {...register("name")} className="mt-1" />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <Label htmlFor="company">会社名 <span className="text-red-500">*</span></Label>
                  <Input id="company" placeholder="〇〇旅行株式会社" {...register("company")} className="mt-1" />
                  {errors.company && <p className="text-red-500 text-xs mt-1">{errors.company.message}</p>}
                </div>
                <div>
                  <Label htmlFor="email">メールアドレス <span className="text-red-500">*</span></Label>
                  <Input id="email" type="email" placeholder="example@travel.co.jp" {...register("email")} className="mt-1" />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <Label htmlFor="phone">携帯電話番号 <span className="text-red-500">*</span></Label>
                  <Input id="phone" type="tel" placeholder="090-1234-5678" {...register("phone")} className="mt-1" />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                </div>
                <div>
                  <Label htmlFor="agentRegion">取扱エリア <span className="text-red-500">*</span></Label>
                  <Select onValueChange={(v) => setValue("agentRegion", v as "domestic" | "international" | "both")}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="取扱エリアを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="domestic">国内（日本）</SelectItem>
                      <SelectItem value="international">海外</SelectItem>
                      <SelectItem value="both">国内・海外両方</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.agentRegion && <p className="text-red-500 text-xs mt-1">{errors.agentRegion.message}</p>}
                </div>

                {(agentRegion === "international" || agentRegion === "both") && (
                  <>
                    <div>
                      <Label htmlFor="agentCountry">主な取扱国 <span className="text-red-500">*</span></Label>
                      <Select onValueChange={(v) => setValue("agentCountry", v)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="国を選択" />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRIES_OVERSEAS.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {selectedCountry === "アメリカ合衆国" && (
                      <div>
                        <Label htmlFor="agentState">主な取扱州（アメリカ）</Label>
                        <Select onValueChange={(v) => setValue("agentState", v)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="州を選択" />
                          </SelectTrigger>
                          <SelectContent>
                            {US_STATES.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </>
                )}

                <div>
                  <Label htmlFor="specialtyRace">得意な顧客層（人種・国籍） <span className="text-red-500">*</span></Label>
                  <Select onValueChange={(v) => setValue("specialtyRace", v)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="顧客層を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPECIALTY_RACES.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.specialtyRace && <p className="text-red-500 text-xs mt-1">{errors.specialtyRace.message}</p>}
                </div>

                <div>
                  <Label htmlFor="q1Answer">Q1. 参入したいと思った理由を教えてください <span className="text-red-500">*</span></Label>
                  <Textarea id="q1Answer" rows={3} {...register("q1Answer")} className="mt-1" placeholder="例：インバウンド需要の取り込み、ツアーの差別化を図りたい など" />
                  <p className="text-xs text-muted-foreground mt-1">{watch("q1Answer")?.length ?? 0}/500文字</p>
                  {errors.q1Answer && <p className="text-red-500 text-xs mt-1">{errors.q1Answer.message}</p>}
                </div>
                <div>
                  <Label htmlFor="q2Answer">Q2. 月間何件程度の成約を見込んでいますか？ <span className="text-red-500">*</span></Label>
                  <Textarea id="q2Answer" rows={2} {...register("q2Answer")} className="mt-1" placeholder="例：月10〜20件程度、まずは5件から始めたい など" />
                  <p className="text-xs text-muted-foreground mt-1">{watch("q2Answer")?.length ?? 0}/500文字</p>
                  {errors.q2Answer && <p className="text-red-500 text-xs mt-1">{errors.q2Answer.message}</p>}
                </div>
                <Button
                  type="submit"
                  className="w-full bg-blue-800 hover:bg-blue-900 text-white py-3 text-base font-semibold"
                  disabled={isSubmitting || submitLead.isPending}
                >
                  {submitLead.isPending ? "送信中..." : "無料でパートナー登録申込みをする"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  送信することで、<a href="/privacy" className="underline">プライバシーポリシー</a>に同意したものとみなします。
                </p>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

// ─── エクスポート（トークン検証ラッパー） ─────────────────────────────────────

export default function BusinessAgent() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const token = params.get("token") ?? "";

  const { data: tokenData, isLoading: tokenLoading } = trpc.lead.verifyToken.useQuery(
    { token },
    { enabled: token.length > 0, retry: false }
  );

  if (!token) return <AccessDenied />;
  if (tokenLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  if (!tokenData?.valid || tokenData.type !== "agent") return <AccessDenied />;

  return <BusinessAgentInner />;
}
