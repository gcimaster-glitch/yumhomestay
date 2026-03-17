/**
 * BusinessCookingSchool.tsx — 料理教室向けビジネスモデルページ
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
  ChefHat, Users, Banknote, CheckCircle, Gift, ArrowRight,
  Info, Calculator, TrendingUp, Lock, Mail
} from "lucide-react";

// ─── アクセス制限画面 ─────────────────────────────────────────────────────────────────

function AccessDenied() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center p-6">
      <div className="max-w-lg w-full text-center space-y-6">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-10 h-10 text-orange-600" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          このページは資料請求者専用です
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          収益シミュレーター・ビジネスモデル詳細・登録フォームをご覧いただくには、
          まず資料請求フォームからお申し込みください。
          ご登録のメールアドレスに専用リンクをお送りします。
        </p>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 text-left space-y-3">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold text-foreground text-sm">資料請求後にメールで届きます</div>
              <div className="text-sm text-muted-foreground">資料請求フォームを送信すると、ビジネス詳細ページへのリンクをメールでお送りします。</div>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/for-cooking-schools">
            <Button className="bg-orange-600 hover:bg-orange-700 text-white gap-2">
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
  company: z.string().min(1, "教室名を入力してください").max(200),
  email: z.string().email("正しいメールアドレスを入力してください"),
  phone: z
    .string()
    .min(10, "電話番号は10桁以上で入力してください")
    .max(20)
    .regex(/^[\d\-\+\(\)\s]+$/, "電話番号は数字・ハイフン・+のみ使用できます"),
  prefecture: z.string().min(1, "都道府県を選択してください"),
  nearestStation: z.string().min(1, "最寄り駅を入力してください").max(100),
  maxGuests: z.coerce.number().int().min(2).max(50),
  q1Answer: z.string().min(1, "回答を入力してください").max(500),
  q2Answer: z.string().min(1, "回答を入力してください").max(500),
});
type FormValues = z.infer<typeof formSchema>;

// ─── 収益シミュレーター ───────────────────────────────────────────────────────

function CookingSchoolSimulator() {
  const [sessions, setSessions] = useState(8);       // 月間開催回数
  const [extraAdults, setExtraAdults] = useState(0); // 追加大人
  const [extraChildren, setExtraChildren] = useState(0);
  const [extraInfants, setExtraInfants] = useState(0);

  // 報酬は資料請求後に開示（シミュレーターは開催回数のイメージのみ表示）
  // 具体的単価は非公開
  const sessionsPerMonth = sessions;

  return (
    <Card className="border-orange-200 shadow-md">
      <CardHeader className="bg-orange-50 rounded-t-xl">
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <Calculator className="w-5 h-5" />
          収益シミュレーター
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <Label className="text-sm font-medium">月間開催回数</Label>
              <span className="text-lg font-bold text-orange-700">{sessions}回</span>
            </div>
            <Slider
              min={1} max={20} step={1}
              value={[sessions]}
              onValueChange={([v]) => setSessions(v)}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1回</span><span>20回</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <Label className="text-sm font-medium">追加大人（基本2名超）</Label>
              <span className="text-lg font-bold text-orange-700">{extraAdults}名</span>
            </div>
            <Slider min={0} max={8} step={1} value={[extraAdults]} onValueChange={([v]) => setExtraAdults(v)} />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <Label className="text-sm font-medium">追加子供（6〜12歳）</Label>
              <span className="text-lg font-bold text-orange-700">{extraChildren}名</span>
            </div>
            <Slider min={0} max={6} step={1} value={[extraChildren]} onValueChange={([v]) => setExtraChildren(v)} />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <Label className="text-sm font-medium">追加幼児（〜5歳）</Label>
              <span className="text-lg font-bold text-orange-700">{extraInfants}名</span>
            </div>
            <Slider min={0} max={4} step={1} value={[extraInfants]} onValueChange={([v]) => setExtraInfants(v)} />
          </div>
        </div>

        <div className="bg-orange-50 rounded-xl p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">月間開催回数</span>
            <span className="font-semibold text-orange-700">{sessions}回</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">追加参加者数</span>
            <span className="font-semibold text-orange-700">大人{extraAdults}名 / 子供{extraChildren}名 / 幼児{extraInfants}名</span>
          </div>
          <div className="border-t border-orange-200 pt-3">
            <p className="text-sm text-orange-700 font-medium text-center">
              報酬詳細は資料請求後に開示します
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-orange-200 rounded-xl p-4 text-center">
            <div className="text-xs text-muted-foreground mb-1">月間開催回数</div>
            <div className="text-2xl font-bold text-orange-700">{sessions}回</div>
          </div>
          <div className="bg-white border border-orange-200 rounded-xl p-4 text-center">
            <div className="text-xs text-muted-foreground mb-1">年間開催回数</div>
            <div className="text-2xl font-bold text-orange-700">{sessions * 12}回</div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground flex items-start gap-1">
          <Info className="w-3 h-3 mt-0.5 shrink-0" />
          報酬詳細は資料請求後に個別にご案内します。月収5万円〜40万円以上の実績もございます。
        </p>
      </CardContent>
    </Card>
  );
}

// ─── メインページ ─────────────────────────────────────────────────────────────

export default function BusinessCookingSchool() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const token = params.get("token") ?? "";

  const [submitted, setSubmitted] = useState(false);
  const [submittedName, setSubmittedName] = useState("");

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
    defaultValues: { maxGuests: 8 },
  });

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    submitLead.mutate({ type: "cooking_school", ...data, origin: window.location.origin });
  };

  if (!token) return <AccessDenied />;
  if (tokenLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">認証中...</p>
        </div>
      </div>
    );
  }
  if (!tokenData?.valid || tokenData.type !== "cooking_school") return <AccessDenied />;

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center p-6">
        <div className="max-w-lg w-full text-center space-y-6">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-orange-600" />
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
      <div className="bg-gradient-to-r from-orange-700 to-amber-600 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-orange-200 text-sm mb-3">
            <Link href="/for-cooking-schools" className="hover:text-white">料理教室向けLP</Link>
            <span>›</span>
            <span>ビジネスモデル詳細</span>
          </div>
          <Badge className="bg-orange-600 text-orange-100 border-orange-500 mb-3 text-xs">
            ✓ 資料請求者専用ページ
          </Badge>
          <h1 className="text-3xl lg:text-4xl font-bold mb-3">
            料理教室向けビジネスモデル
          </h1>
          <p className="text-orange-100">収益の仕組みと参入メリットを詳しく解説します。</p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Link href="/demo/cooking-school">
              <Button className="bg-white text-orange-700 hover:bg-orange-50">料理教室デモを体験</Button>
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
              { step: "1", icon: Users, title: "ゲストが申込み", desc: "海外からのゲストがYumHomeStayのサイトから料理体験を申込みます。" },
              { step: "2", icon: ChefHat, title: "マッチング", desc: "YumHomeStayが料理教室とゲストをマッチング。日程・人数を調整します。" },
              { step: "3", icon: Banknote, title: "報酬支払い", desc: "体験終了後、月末締め・翌月末払いで報酬をお支払いします。" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <item.icon className="w-6 h-6 text-orange-700" />
                </div>
                <div className="text-xs font-bold text-orange-600 mb-1">STEP {item.step}</div>
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
                <tr className="bg-orange-700 text-white">
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
                  <tr key={label} className={i % 2 === 0 ? "bg-orange-50" : "bg-white"}>
                    <td className="px-6 py-3 text-foreground">{label}</td>
                    <td className="px-6 py-3 text-right font-bold text-orange-700">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── 料理教室ならではのメリット ── */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6">料理教室ならではのメリット</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { icon: TrendingUp, title: "既存設備をそのまま活用", desc: "調理設備・食器・スペースをそのまま使えます。追加投資は不要です。" },
              { icon: Users, title: "既存生徒への付加価値", desc: "インバウンド体験を提供することで、教室の差別化・ブランド向上につながります。" },
              { icon: ChefHat, title: "日本料理の国際発信", desc: "和食・郷土料理を世界に発信する文化大使として活躍できます。" },
              { icon: Banknote, title: "安定した副収入", desc: "月8〜16回の開催で、安定した副収入を得ることができます。" },
            ].map((item) => (
              <div key={item.title} className="flex gap-3 p-4 bg-orange-50 rounded-xl">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-orange-700" />
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
          <CookingSchoolSimulator />
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
          <Card className="border-orange-200 shadow-lg">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <Label htmlFor="name">担当者名 <span className="text-red-500">*</span></Label>
                  <Input id="name" placeholder="山田 花子" {...register("name")} className="mt-1" />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <Label htmlFor="company">教室名 <span className="text-red-500">*</span></Label>
                  <Input id="company" placeholder="〇〇料理教室" {...register("company")} className="mt-1" />
                  {errors.company && <p className="text-red-500 text-xs mt-1">{errors.company.message}</p>}
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
                  <Input id="maxGuests" type="number" min={2} max={50} {...register("maxGuests")} className="mt-1" />
                  {errors.maxGuests && <p className="text-red-500 text-xs mt-1">{errors.maxGuests.message}</p>}
                </div>
                <div>
                  <Label htmlFor="q1Answer">Q1. 参入したいと思った理由を教えてください <span className="text-red-500">*</span></Label>
                  <Textarea id="q1Answer" rows={3} {...register("q1Answer")} className="mt-1" placeholder="例：インバウンド需要を取り込みたい、日本料理を世界に発信したい など" />
                  <p className="text-xs text-muted-foreground mt-1">{watch("q1Answer")?.length ?? 0}/500文字</p>
                  {errors.q1Answer && <p className="text-red-500 text-xs mt-1">{errors.q1Answer.message}</p>}
                </div>
                <div>
                  <Label htmlFor="q2Answer">Q2. 何名まで受け入れることができますか？ <span className="text-red-500">*</span></Label>
                  <Textarea id="q2Answer" rows={2} {...register("q2Answer")} className="mt-1" placeholder="例：最大10名まで、調理台6台で6名まで など" />
                  <p className="text-xs text-muted-foreground mt-1">{watch("q2Answer")?.length ?? 0}/500文字</p>
                  {errors.q2Answer && <p className="text-red-500 text-xs mt-1">{errors.q2Answer.message}</p>}
                </div>
                <Button
                  type="submit"
                  className="w-full bg-orange-700 hover:bg-orange-800 text-white py-3 text-base font-semibold"
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
