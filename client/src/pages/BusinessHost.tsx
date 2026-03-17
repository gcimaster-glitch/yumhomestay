/**
 * BusinessHost.tsx — ホストファミリー向けビジネスモデルページ
 * アクセス制御: URLパラメータ ?token=xxx で検証。無効なトークンは申請誘導画面を表示。
 * 収益シミュレーター + 無料登録申込みフォーム（2026年8月まで）
 */
import { useState } from "react";
import { Link, useSearch } from "wouter";
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
  Home, Users, Banknote, CheckCircle, ArrowRight, Gift,
  TrendingUp, Info, Calculator, Lock, Mail
} from "lucide-react";

// ─── 定数 ────────────────────────────────────────────────────────────────────

const PREFECTURES = [
  "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県",
  "茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県",
  "新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県",
  "静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県",
  "奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県",
  "徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県",
  "熊本県","大分県","宮崎県","鹿児島県","沖縄県",
];

// ─── フォームスキーマ ─────────────────────────────────────────────────────────

const formSchema = z.object({
  name: z.string().min(1, "お名前を入力してください").max(100),
  company: z.string().max(200).optional(),
  email: z.string().email("正しいメールアドレスを入力してください"),
  phone: z
    .string()
    .min(10, "電話番号は10桁以上で入力してください")
    .max(20)
    .regex(/^[\d\-\+\(\)\s]+$/, "電話番号は数字・ハイフン・+のみ使用できます"),
  prefecture: z.string().min(1, "都道府県を選択してください"),
  nearestStation: z.string().min(1, "最寄り駅を入力してください").max(100),
  maxGuests: z.coerce.number().int().min(2).max(20),
  q1Answer: z.string().min(1, "回答を入力してください").max(500),
  q2Answer: z.string().min(1, "回答を入力してください").max(500),
});
type FormValues = z.infer<typeof formSchema>;

// ─── アクセス制限画面 ─────────────────────────────────────────────────────────

function AccessDenied() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-6">
      <div className="max-w-lg w-full text-center space-y-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          このページは資料請求者専用です
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          収益シミュレーター・ビジネスモデル詳細・登録フォームをご覧いただくには、
          まず資料請求フォームからお申し込みください。
          ご登録のメールアドレスに専用リンクをお送りします。
        </p>
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-left space-y-3">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold text-foreground text-sm">資料請求後にメールで届きます</div>
              <div className="text-sm text-muted-foreground">資料請求フォームを送信すると、ビジネス詳細ページへのリンクをメールでお送りします。</div>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/for-hosts">
            <Button className="bg-green-600 hover:bg-green-700 text-white gap-2">
              資料請求フォームへ
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline">トップページへ戻る</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── 収益シミュレーター ───────────────────────────────────────────────────────

function HostSimulator() {
  const [sessions, setSessions] = useState(4);
  const [extraAdults, setExtraAdults] = useState(0);
  const [extraChildren, setExtraChildren] = useState(0);
  const [extraInfants, setExtraInfants] = useState(0);

  // 報酬は資料請求後に個別開示。ここでは受入回数のみ表示する。

  return (
    <Card className="border-green-200 shadow-md">
      <CardHeader className="bg-green-50 rounded-t-xl">
        <CardTitle className="flex items-center gap-2 text-green-800">
          <Calculator className="w-5 h-5" />
          収益シミュレーター
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <Label className="text-sm font-medium">月間受入回数</Label>
              <span className="text-lg font-bold text-green-700">{sessions}回</span>
            </div>
            <Slider
              min={1} max={16} step={1}
              value={[sessions]}
              onValueChange={([v]) => setSessions(v)}
              className="accent-green-600"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1回</span><span>16回</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <Label className="text-sm font-medium">追加大人（基本2名超）</Label>
              <span className="text-lg font-bold text-green-700">{extraAdults}名</span>
            </div>
            <Slider
              min={0} max={8} step={1}
              value={[extraAdults]}
              onValueChange={([v]) => setExtraAdults(v)}
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <Label className="text-sm font-medium">追加子供（6〜12歳）</Label>
              <span className="text-lg font-bold text-green-700">{extraChildren}名</span>
            </div>
            <Slider
              min={0} max={6} step={1}
              value={[extraChildren]}
              onValueChange={([v]) => setExtraChildren(v)}
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <Label className="text-sm font-medium">追加幼児（〜5歳）</Label>
              <span className="text-lg font-bold text-green-700">{extraInfants}名</span>
            </div>
            <Slider
              min={0} max={4} step={1}
              value={[extraInfants]}
              onValueChange={([v]) => setExtraInfants(v)}
            />
          </div>
        </div>

        <div className="bg-green-50 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">月間受入回数</span>
            <span className="font-bold text-green-700">{sessions}回</span>
          </div>
          <div className="border-t border-green-200 pt-2 flex justify-between font-semibold">
            <span>1回あたり報酬</span>
            <span className="text-green-700">資料請求後に個別ご案内</span>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <div className="text-sm text-muted-foreground mb-2">{sessions}回受入時の月収益レンジ</div>
          <div className="text-2xl font-bold text-green-700">資料請求後に個別ご案内</div>
          <div className="text-xs text-muted-foreground mt-2">受入内容・人数・評価等により异なります</div>
        </div>

        <p className="text-xs text-muted-foreground flex items-start gap-1">
          <Info className="w-3 h-3 mt-0.5 shrink-0" />
          上記はシミュレーション値です。実際の報酬は受入内容・人数・評価等により異なる場合があります。
        </p>
      </CardContent>
    </Card>
  );
}

// ─── メインページ ─────────────────────────────────────────────────────────────

export default function BusinessHost() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const token = params.get("token") ?? "";

  const [submitted, setSubmitted] = useState(false);
  const [submittedName, setSubmittedName] = useState("");

  // トークン検証
  const { data: tokenData, isLoading: tokenLoading } = trpc.lead.verifyToken.useQuery(
    { token },
    { enabled: token.length > 0, retry: false }
  );

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
    defaultValues: { maxGuests: 4 },
  });

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    submitLead.mutate({ type: "host", ...data, origin: window.location.origin });
  };

  // トークンなし or 無効 → アクセス拒否
  if (!token) return <AccessDenied />;
  if (tokenLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">認証中...</p>
        </div>
      </div>
    );
  }
  if (!tokenData?.valid || tokenData.type !== "host") return <AccessDenied />;

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-6">
        <div className="max-w-lg w-full text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-green-600" />
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
      <div className="bg-gradient-to-r from-green-700 to-emerald-600 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-green-200 text-sm mb-3">
            <Link href="/for-hosts" className="hover:text-white">ホストファミリー向けLP</Link>
            <span>›</span>
            <span>ビジネスモデル詳細</span>
          </div>
          <Badge className="bg-green-600 text-green-100 border-green-500 mb-3 text-xs">
            ✓ 資料請求者専用ページ
          </Badge>
          <h1 className="text-3xl lg:text-4xl font-bold mb-3">
            ホストファミリー向けビジネスモデル
          </h1>
          <p className="text-green-100">収益の仕組みを詳しく解説します。</p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Link href="/demo/host">
              <Button className="bg-white text-green-700 hover:bg-green-50">ホストデモを体験</Button>
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
              { step: "1", icon: Users, title: "ゲストが申込み", desc: "海外からのゲストがYumHomeStayのサイトから体験を申込みます。" },
              { step: "2", icon: Home, title: "マッチング", desc: "YumHomeStayがゲストとホストファミリーをマッチング。日程・人数を調整します。" },
              { step: "3", icon: Banknote, title: "報酬支払い", desc: "体験終了後、月末締め・翌月末払いで報酬をお支払いします。" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <item.icon className="w-6 h-6 text-green-700" />
                </div>
                <div className="text-xs font-bold text-green-600 mb-1">STEP {item.step}</div>
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 報酬体系 ── */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6">報酬体系</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-green-700 text-white">
                  <th className="px-6 py-3 text-left rounded-tl-lg">項目</th>
                  <th className="px-6 py-3 text-right rounded-tr-lg">金額</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["基本報酬（2名受入・4時間）", "資料請求後に開示"],
                  ["追加大人 1名ごと", "資料請求後に開示"],
                  ["追加子供 1名ごと（6〜12歳）", "資料請求後に開示"],
                  ["追加幼児 1名ごと（〜5歳）", "資料請求後に開示"],
                  ["食材費補助", "資料請求後に開示"],
                ].map(([label, value], i) => (
                  <tr key={label} className={i % 2 === 0 ? "bg-green-50" : "bg-white"}>
                    <td className="px-6 py-3 text-foreground">{label}</td>
                    <td className="px-6 py-3 text-right font-bold text-green-700">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── 収益シミュレーター ── */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6">収益シミュレーター</h2>
          <HostSimulator />
        </section>

        {/* ── 登録フロー ── */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6">登録から受入開始までの流れ</h2>
          <div className="space-y-4">
            {[
              { step: "1", title: "無料登録申込み", desc: "下記フォームから申込み。登録料は2026年8月まで無料。" },
              { step: "2", title: "書類審査", desc: "YumHomeStayが申込み内容を審査します（3〜5営業日）。" },
              { step: "3", title: "ZOOM面談", desc: "担当者とオンライン面談。ホームステイの内容・注意事項を確認します。" },
              { step: "4", title: "認定書発行", desc: "審査通過後、YumHosts認定書を発行。ダッシュボードが利用可能になります。" },
              { step: "5", title: "受入開始", desc: "マッチングが成立次第、受入を開始できます。" },
            ].map((item) => (
              <div key={item.step} className="flex gap-4 items-start">
                <div className="w-8 h-8 bg-green-700 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 無料登録申込みフォーム ── */}
        <section id="register-form">
          <div className="text-center mb-8">
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 mb-3">
              <Gift className="w-3 h-3 mr-1" />
              キャンペーン：2026年8月まで登録料無料
            </Badge>
            <h2 className="text-3xl font-bold text-foreground">無料登録を申込む</h2>
            <p className="text-muted-foreground mt-2">
              通常¥5,000の登録料が、2026年8月31日まで無料です。
            </p>
          </div>
          <Card className="border-green-200 shadow-lg">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <Label htmlFor="name">お名前 <span className="text-red-500">*</span></Label>
                  <Input id="name" placeholder="山田 花子" {...register("name")} className="mt-1" />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <Label htmlFor="email">メールアドレス <span className="text-red-500">*</span></Label>
                  <Input id="email" type="email" placeholder="example@email.com" {...register("email")} className="mt-1" />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <Label htmlFor="phone">携帯電話番号 <span className="text-red-500">*</span></Label>
                  <Input id="phone" type="tel" placeholder="090-1234-5678" {...register("phone")} className="mt-1" />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                </div>
                <div>
                  <Label htmlFor="prefecture">都道府県 <span className="text-red-500">*</span></Label>
                  <Select onValueChange={(v) => setValue("prefecture", v)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="都道府県を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {PREFECTURES.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.prefecture && <p className="text-red-500 text-xs mt-1">{errors.prefecture.message}</p>}
                </div>
                <div>
                  <Label htmlFor="nearestStation">最寄り駅 <span className="text-red-500">*</span></Label>
                  <Input id="nearestStation" placeholder="例：渋谷駅" {...register("nearestStation")} className="mt-1" />
                  {errors.nearestStation && <p className="text-red-500 text-xs mt-1">{errors.nearestStation.message}</p>}
                </div>
                <div>
                  <Label htmlFor="maxGuests">最大受入可能人数 <span className="text-red-500">*</span></Label>
                  <Input id="maxGuests" type="number" min={2} max={20} {...register("maxGuests")} className="mt-1" />
                  {errors.maxGuests && <p className="text-red-500 text-xs mt-1">{errors.maxGuests.message}</p>}
                </div>
                <div>
                  <Label htmlFor="q1Answer">Q1. 参入したいと思った理由を教えてください <span className="text-red-500">*</span></Label>
                  <Textarea id="q1Answer" rows={3} {...register("q1Answer")} className="mt-1" placeholder="例：家族で海外の方と交流したい、副収入を得たい など" />
                  <p className="text-xs text-muted-foreground mt-1">{watch("q1Answer")?.length ?? 0}/500文字</p>
                  {errors.q1Answer && <p className="text-red-500 text-xs mt-1">{errors.q1Answer.message}</p>}
                </div>
                <div>
                  <Label htmlFor="q2Answer">Q2. 何名まで自宅に招くことができますか？ <span className="text-red-500">*</span></Label>
                  <Textarea id="q2Answer" rows={2} {...register("q2Answer")} className="mt-1" placeholder="例：大人2名＋子供2名まで、最大6名まで など" />
                  <p className="text-xs text-muted-foreground mt-1">{watch("q2Answer")?.length ?? 0}/500文字</p>
                  {errors.q2Answer && <p className="text-red-500 text-xs mt-1">{errors.q2Answer.message}</p>}
                </div>
                <Button
                  type="submit"
                  className="w-full bg-green-700 hover:bg-green-800 text-white py-3 text-base font-semibold"
                  disabled={isSubmitting || submitLead.isPending}
                >
                  {submitLead.isPending ? "送信中..." : "無料で登録申込みをする"}
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
