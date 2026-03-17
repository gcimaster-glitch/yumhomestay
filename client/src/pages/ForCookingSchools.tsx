/**
 * ForCookingSchools.tsx — 料理教室向けランディングページ
 * CTA: 資料請求（フォーム）・デモ体験
 */
import { useState } from "react";
import { useSeoMeta } from "@/hooks/useSeoMeta";
import { Link, useLocation } from "wouter";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { PartnerFormWizard, type WizardStep } from "@/components/PartnerFormWizard";
import { PrefectureMapSelector } from "@/components/PrefectureMapSelector";
import {
  ChefHat, Users, Utensils, Star, ChevronDown, ChevronUp,
  Download, Play, CheckCircle, Clock, MapPin, Banknote,
  ArrowRight, Gift, TrendingUp, Globe, Heart, Leaf, Award, ChevronRight, ChevronLeft, Info
} from "lucide-react";

// ─── 定数 ────────────────────────────────────────────────────────────────────

const YUMHOST_CERTIFICATE_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663381534240/FWh8vTLvqLGbaqKezVTx6W/yumhost-certificate_38651bd7.png";

// ── 料理教室の声（実際の声が集まり次第こちらを更新してください） ────────────────
const COOKING_SCHOOL_VOICES = [
  {
    name: "山田料理教室（京都府・参入後2年目）",
    text: "居住者向けの教室だけでは限界を感じていましたが、インバウンド導入後は毎月海外からのゲストをお迎えできています。SNSでの口コミが広がり、国内の新規生徒も増えました。",
    stars: 5,
  },
  {
    name: "山本和食教室（東京都・参入後1年目）",
    text: "料理教室を間借りしてインバウンド向けに開場しています。準備から片付けまで全てYumHomeStayがサポートしてくれるので、言語の心配もありませんでした。",
    stars: 5,
  },
];

const COOKING_SCHOOL_BROCHURE_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663381534240/FWh8vTLvqLGbaqKezVTx6W/cooking-school-brochure_07203871.pdf";

// PREFECTURES はPrefectureMapSelectorからexportされているため、ここでは不要

// ─── フォームスキーマ ─────────────────────────────────────────────────────────

const step1Schema = z.object({
  name: z.string().min(1, "担当者名を入力してください").max(100),
  company: z.string().min(1, "教室名を入力してください").max(200),
  email: z.string().email("正しいメールアドレスを入力してください"),
  phone: z
    .string()
    .min(10, "電話番号は10桁以上で入力してください")
    .max(20)
    .regex(/^[\d\-\+\(\)\s]+$/, "電話番号は数字・ハイフン・+のみ使用できます"),
  prefecture: z.string().min(1, "都道府県を選択してください"),
  nearestStation: z.string().min(1, "最寄り駅を入力してください").max(100),
});

const formSchema = step1Schema.extend({
  maxGuests: z.coerce
    .number()
    .int()
    .min(2, "最大受入人数は2名以上で入力してください")
    .max(50),
  q1Answer: z.string().min(1, "回答を入力してください").max(500),
  q2Answer: z.string().min(1, "回答を入力してください").max(500),
});

type FormValues = z.infer<typeof formSchema>;

// ─── セッションストレージキー ────────────────────────────────────────────────
const SESSION_KEY_CS_LEAD = "yhs_cs_lead";

// ─── ウィザードステップ定義 ──────────────────────────────────────────────────
const WIZARD_STEPS: WizardStep[] = [
  { id: 1, title: "教室・担当者情報", desc: "教室名・連絡先" },
  { id: 2, title: "活動情報", desc: "受入条件・意欲" },
];

const NAVIGATOR_MESSAGES = [
  {
    step: 1,
    message: "はじめまして！YumHomeStayのナビゲーターです。まずは教室と担当者の情報を教えてください。3分で完了します✨",
  },
  {
    step: 2,
    message: "もう少しです！受入条件と参入意欲について教えてください。これをもとに担当者からご連絡します😊",
  },
];

// ─── FAQ ─────────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: "既存の料理教室と並行して運営できますか？",
    a: "はい、可能です。既存の授業スケジュールに影響しない形で受入日程を設定できます。週末や平日の空き時間を有効活用できます。",
  },
  {
    q: "言語対応はどうすればいいですか？",
    a: "YumHomeStayが通訳サポートを提供します。英語・中国語・韓国語に対応しています。スタッフが英語を話せなくても問題ありません。",
  },
  {
    q: "料理内容は自由に決められますか？",
    a: "はい、教室様の得意分野・季節に合わせた料理を提供していただけます。和食・郷土料理・スイーツなど、何でも歓迎です。",
  },
  {
    q: "集客はどのように行いますか？",
    a: "YumHomeStayが海外からのゲストを集客・マッチングします。教室様は受入に集中していただくだけです。",
  },
  {
    q: "最低受入件数はありますか？",
    a: "ありません。月1回からでも構いません。ご自身のペースで受入件数を設定できます。",
  },
];

// ─── コンポーネント ───────────────────────────────────────────────────────────

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        className="w-full flex items-center justify-between py-4 text-left font-medium text-foreground hover:text-primary transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span>{q}</span>
        {open ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
      </button>
      {open && <p className="pb-4 text-muted-foreground text-sm leading-relaxed">{a}</p>}
    </div>
  );
}

// ─── メインページ ─────────────────────────────────────────────────────────────

export default function ForCookingSchools() {
  const [submitted, setSubmitted] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [, navigate] = useLocation();
  useSeoMeta({
    titleJa: 'YumHomeStay｜料理教室パートナー募集｜外国人向け料理体験を提供',
    titleEn: 'YumHomeStay | Partner Cooking Schools | Reach International Students',
    titleZh: 'YumHomeStay | 合作料理教室招募 | 面向国际学员',
    titleKo: 'YumHomeStay | 파트너 요리 교실 모집 | 국제 학생 유치',
    descriptionJa: 'YumHomeStayと提携して、外国人旅行者向けに料理体験を提供しませんか。多言語対応サポートあり。',
    descriptionEn: 'Partner with YumHomeStay to offer cooking experiences to international travelers. Multilingual support included.',
    keywordsJa: '料理教室 パートナー,外国人向け 料理体験,YumHomeStay 料理教室登録',
    keywordsEn: 'cooking school partner Japan, international cooking class, YumHomeStay cooking school',
    ogUrl: 'https://yumhomestay.com/for-cooking-schools',
  });
  const [submittedName, setSubmittedName] = useState("");

  const submitLead = trpc.lead.submit.useMutation({
    onSuccess: () => {
      const name = getValues("name");
      sessionStorage.setItem("yhs_lead_name", name);
      navigate(`/thanks/partner?type=cooking_school&name=${encodeURIComponent(name)}`);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  // sessionStorageから引き継ぎデータを読み込む
  const savedLead = (() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY_CS_LEAD);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  })();

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    trigger,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues, unknown, FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      maxGuests: 8,
      name: savedLead.name ?? "",
      company: savedLead.company ?? "",
      email: savedLead.email ?? "",
      phone: savedLead.phone ?? "",
      prefecture: savedLead.prefecture ?? "",
      nearestStation: savedLead.nearestStation ?? "",
    },
  });

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    try { sessionStorage.setItem(SESSION_KEY_CS_LEAD, JSON.stringify(data)); } catch {}
    submitLead.mutate({ type: "cooking_school", ...data, origin: window.location.origin });
  };

  const handleStep1Next = async () => {
    const ok = await trigger(["name", "company", "email", "phone", "prefecture", "nearestStation"]);
    if (ok) {
      try {
        const vals = getValues();
        sessionStorage.setItem(SESSION_KEY_CS_LEAD, JSON.stringify(vals));
      } catch {}
      setFormStep(2);
      document.getElementById("lead-form")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const scrollToForm = () => {
    document.getElementById("lead-form")?.scrollIntoView({ behavior: "smooth" });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center p-6">
        <div className="max-w-lg w-full text-center space-y-6">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-orange-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {submittedName} 様、ありがとうございます！
          </h1>
          <p className="text-muted-foreground">
            資料請求を受け付けました。ご登録のメールアドレスに確認メールをお送りしました。
            担当者より3営業日以内にご連絡いたします。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={COOKING_SCHOOL_BROCHURE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              資料をダウンロード
            </a>
            <Link href="/business/cooking-school">
              <Button variant="outline" className="gap-2">
                ビジネスモデルを見る
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <Link href="/" className="text-sm text-muted-foreground hover:text-primary underline">
            トップページへ戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ── ヒーロー ── */}
      <section className="relative bg-gradient-to-br from-orange-700 via-orange-600 to-amber-500 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-red-300 blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 order-2 lg:order-1">
              <Badge className="bg-yellow-400 text-yellow-900 font-semibold px-3 py-1">
                🎉 2026年8月まで登録料無料キャンペーン実施中
              </Badge>
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                料理教室の空き時間を<br />
                <span className="text-yellow-300">インバウンド収益に</span>
              </h1>
              <p className="text-lg text-orange-100 leading-relaxed">
                YumHostsとして登録すると、海外からのゲストが料理教室を訪れ、
                一緒に料理を楽しみます。既存施設・スタッフを活用した
                新しい収益チャネルを構築できます。
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={scrollToForm}
                  className="inline-flex items-center justify-center gap-2 bg-yellow-400 text-yellow-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-yellow-300 transition-colors shadow-lg"
                >
                  <Download className="w-5 h-5" />
                  無料で資料請求する
                </button>
                <Link href="/demo/cooking-school">
                  <button className="inline-flex items-center justify-center gap-2 bg-white/20 text-white border border-white/40 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/30 transition-colors">
                    <Play className="w-5 h-5" />
                    デモを体験する
                  </button>
                </Link>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://d2xsxph8kpxj0f.cloudfront.net/310519663381534240/FWh8vTLvqLGbaqKezVTx6W/lp-cooking-school-hero_711eb488.jpg"
                  alt="料理教室で海外ゲストと一緒に料理を楽しむ様子"
                  className="w-full h-72 lg:h-96 object-cover"
                />
                <div className="absolute bottom-4 left-4 right-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { icon: Banknote, label: "月収", value: "大幅アップ可能", sub: "詳細は資料請求後にご案内" },
                    { icon: TrendingUp, label: "集客", value: "YHSが担当", sub: "集客コストゼロ" },
                  ].map((item) => (
                    <Card key={item.label} className="bg-black/60 backdrop-blur-sm border-white/20 text-white">
                      <CardContent className="p-3 space-y-0.5">
                        <item.icon className="w-4 h-4 text-yellow-300" />
                        <div className="text-xs text-orange-200">{item.label}</div>
                        <div className="text-lg font-bold">{item.value}</div>
                        <div className="text-xs text-orange-200">{item.sub}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── メリット ── */}
      <section className="py-16 bg-orange-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            料理教室様のメリット
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Banknote, title: "既存施設の収益化", desc: "空き時間・空きスペースをインバウンド向けに活用。追加投資なしで新収益を生み出せます。" },
              { icon: Globe, title: "新規顧客層の開拓", desc: "海外からのゲストを直接取り込み。通常の料理教室では出会えない顧客層へリーチできます。" },
              { icon: Star, title: "ブランド価値向上", desc: "「国際的な料理教室」としての認知度が上がり、国内生徒の獲得にも好影響を与えます。" },
              { icon: TrendingUp, title: "集客コストゼロ", desc: "YumHomeStayが集客・予約管理・マッチングを担当。教室様は受入に集中するだけです。" },
              { icon: Users, title: "多言語サポート", desc: "英語・中国語・韓国語の通訳サポートあり。言語の壁なく海外ゲストをお迎えできます。" },
              { icon: CheckCircle, title: "安心の保険体制", desc: "賠償責任保険への加入をサポート。万が一のトラブルにも対応できる体制を整えます。" },
            ].map((item) => (
              <div key={item.title} className="bg-white p-5 rounded-xl border border-orange-100 shadow-sm">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                  <item.icon className="w-5 h-5 text-orange-600" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 収益性PR ── */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-foreground mb-4">既存施設を活かした高収益モデル</h2>
          <p className="text-center text-muted-foreground mb-10">食材費補助込み・月末締め翌月末払い。追加投資なしで新収益を実現。</p>
          <div className="grid sm:grid-cols-3 gap-6 mb-10">
            {[
              { icon: Banknote, title: "既存施設を活かした高収益モデル", desc: "既存の料理教室の空き時間・空きスペースを活用。月最大¥400,000以上の実績あり。詳細は資料請求後にご案内。", color: "bg-orange-50 border-orange-200" },
              { icon: TrendingUp, title: "集客コストゼロ", desc: "YumHomeStayが集客・予約管理・マッチングを全面担当。料理教室様は受入に集中するだけ。", color: "bg-amber-50 border-amber-200" },
              { icon: Globe, title: "4言語対応サポート", desc: "英語・中国語・韓国語の通訳サポートあり。言語の壁なく海外ゲストをお迎えできます。", color: "bg-yellow-50 border-yellow-200" },
            ].map((item) => (
              <Card key={item.title} className={`border ${item.color}`}>
                <CardContent className="p-6 space-y-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <item.icon className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="font-bold text-lg text-foreground">{item.title}</div>
                  <div className="text-sm text-muted-foreground leading-relaxed">{item.desc}</div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="bg-gradient-to-r from-orange-600 to-amber-500 rounded-2xl p-8 text-white text-center">
            <div className="text-4xl font-bold mb-2">既存施設で新たな収益を実現</div>
            <div className="text-orange-100 mb-4">月の受入回数・人数に応じて収益が大幅アップできます。詳細は資料請求後にご案内。</div>
            <button
              onClick={scrollToForm}
              className="inline-flex items-center gap-2 bg-yellow-400 text-yellow-900 px-8 py-3 rounded-xl font-bold hover:bg-yellow-300 transition-colors"
            >
              <Download className="w-4 h-4" />
              無料で収益詳細を確認する
            </button>
          </div>
        </div>
      </section>

      {/* ── お金以外の価値訴求 ── */}
      <section className="py-20 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <Badge className="bg-orange-100 text-orange-800 border-orange-300 mb-4 text-sm px-4 py-1">
              収益だけじゃない、料理教室に参入する本当の理由
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              料理教室が、<span className="text-orange-600">世界と繋がる窓口</span>になる
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              YumHomeStayへの参入は、新たな収益源だけでなく、料理教室のブランド価値を世界に発信する機会です。
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* 国際知名度向上 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-orange-100 text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto">
                <Globe className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground">国際知名度向上</h3>
              <p className="text-muted-foreground leading-relaxed">
                世界中からのゲストがあなたの料理教室を訪れることで、口コミが国境を越えて広がります。
                SNS・レビューサイトでの評判が上がり、新規居住者層への認知度も向上します。
              </p>
              <div className="bg-blue-50 rounded-xl p-3 text-sm text-blue-700 font-medium">
                「Instagramのフォロワーが3倍になった」
              </div>
            </div>

            {/* 文化発信・使命感 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-orange-100 text-center space-y-4">
              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto">
                <Award className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground">日本料理文化の発信</h3>
              <p className="text-muted-foreground leading-relaxed">
                海外の方々に本物の日本料理を体験してもらうことで、日本食文化の使節としての使命感が生まれます。
                YumHomeStay認定料理教室のブランド価値も向上。
              </p>
              {/* YumHost認定証モックアップ */}
              <div className="rounded-xl overflow-hidden border border-amber-200 shadow-sm">
                <img
                  src={YUMHOST_CERTIFICATE_URL}
                  alt="YumHomeStay認定料理教室証明書サンプル"
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
              </div>
              <div className="bg-amber-50 rounded-xl p-3 text-sm text-amber-700 font-medium">
                「日本料理を世界に広める使命感が生まれた」
              </div>
            </div>

            {/* 地域活性化 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-orange-100 text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto">
                <Leaf className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground">地域活性化</h3>
              <p className="text-muted-foreground leading-relaxed">
                インバウンド観光客を地元に呼び込むことで、周辺の店舗・観光地への波及効果も期待できます。
                地域の食文化ブランドを一緒に盛り上げましょう。
              </p>
              <div className="bg-green-50 rounded-xl p-3 text-sm text-green-700 font-medium">
                「地元の食材を使ったメニューが大人気に」
              </div>
            </div>
          </div>

          {/* 料理教室の声 */}
          <div className="bg-white rounded-2xl p-8 border border-orange-100 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Heart className="w-5 h-5 text-rose-500" />
              <h3 className="text-lg font-bold text-foreground">参入料理教室の声</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {COOKING_SCHOOL_VOICES.map((voice) => (
                <div key={voice.name} className="space-y-3">
                  <div className="flex">
                    {Array.from({ length: voice.stars }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed italic">
                    「{voice.text}」
                  </p>
                  <p className="text-sm font-semibold text-foreground">{voice.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 bg-orange-50">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-foreground mb-10">よくある質問</h2>
          <div className="bg-white rounded-xl border border-orange-100 p-6 divide-y divide-border">
            {FAQS.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── 資料請求フォーム ── */}
      <section id="lead-form" className="py-16 bg-white">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-8">
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 mb-3">
              <Gift className="w-3 h-3 mr-1" />
              2026年8月まで登録料無料
            </Badge>
            <h2 className="text-3xl font-bold text-foreground">無料で資料請求する</h2>
            <p className="text-muted-foreground mt-2">
              フォームを送信すると、資料をダウンロードできます。担当者より3営業日以内にご連絡します。
            </p>
          </div>
          <Card className="border-orange-200 shadow-xl overflow-hidden">
            <PartnerFormWizard
              currentStep={formStep}
              steps={WIZARD_STEPS}
              navigatorMessages={NAVIGATOR_MESSAGES}
              theme="orange"
              navigatorTitle="YumHomeStayナビゲーター"
            >
              <form onSubmit={handleSubmit(onSubmit)}>
                {/* ── ステップ1: 教室・担当者情報 ── */}
                {formStep === 1 && (
                  <div className="space-y-5">
                    <div>
                      <Label htmlFor="name">担当者名 <span className="text-destructive">*</span></Label>
                      <Input id="name" placeholder="山田 太郎" {...register("name")} className="mt-1" autoComplete="name" />
                      {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="company">教室名 <span className="text-destructive">*</span></Label>
                      <Input id="company" placeholder="例：〇〇料理教室、和食アカデミー" {...register("company")} className="mt-1" autoComplete="organization" />
                      {errors.company && <p className="text-destructive text-xs mt-1">{errors.company.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="email">メールアドレス <span className="text-destructive">*</span></Label>
                      <Input id="email" type="email" placeholder="example@email.com" {...register("email")} className="mt-1" autoComplete="email" />
                      {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="phone">電話番号 <span className="text-destructive">*</span></Label>
                      <Input id="phone" type="tel" placeholder="090-1234-5678" {...register("phone")} className="mt-1" autoComplete="tel" />
                      <p className="text-xs text-muted-foreground mt-1">ハイフンあり・なし、どちらでも可</p>
                      {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone.message}</p>}
                    </div>
                    <PrefectureMapSelector
                      value={watch("prefecture") ?? ""}
                      onChange={(v) => setValue("prefecture", v, { shouldValidate: true })}
                      error={errors.prefecture?.message}
                      required
                    />
                    <div>
                      <Label htmlFor="nearestStation">最寄り駅 <span className="text-destructive">*</span></Label>
                      <Input id="nearestStation" placeholder="例：渋谷駅" {...register("nearestStation")} className="mt-1" />
                      <p className="text-xs text-muted-foreground mt-1">教室の最寄り駅を入力してください</p>
                      {errors.nearestStation && <p className="text-destructive text-xs mt-1">{errors.nearestStation.message}</p>}
                    </div>
                    <div className="flex justify-end pt-2">
                      <Button type="button" onClick={handleStep1Next} className="bg-orange-600 hover:bg-orange-700 text-white px-8 w-full sm:w-auto">
                        次へ <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* ── ステップ2: 活動情報 ── */}
                {formStep === 2 && (
                  <div className="space-y-5">
                    <div>
                      <Label htmlFor="maxGuests">最大受入可能人数 <span className="text-destructive">*</span></Label>
                      <div className="flex items-center gap-3 mt-1">
                        <Input id="maxGuests" type="number" min={2} max={50} {...register("maxGuests")} className="w-28" />
                        <span className="text-sm text-muted-foreground">名（2名～50名）</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">教室の定員に合わせて設定してください</p>
                      {errors.maxGuests && <p className="text-destructive text-xs mt-1">{errors.maxGuests.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="q1Answer">
                        Q1. インバウンド向けサービスに参入したい理由を教えてください
                        <span className="text-destructive ml-1">*</span>
                      </Label>
                      <Textarea id="q1Answer" placeholder="例：空き時間の有効活用、新規顧客層の開拓、海外からの問い合わせが増えてきた など" rows={3} {...register("q1Answer")} className="mt-1" />
                      <p className="text-xs text-muted-foreground mt-1">{watch("q1Answer")?.length ?? 0}/500文字</p>
                      {errors.q1Answer && <p className="text-destructive text-xs mt-1">{errors.q1Answer.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="q2Answer">
                        Q2. サービス開始をいつ頃から考えていますか？漢念点があればご記入ください
                        <span className="text-destructive ml-1">*</span>
                      </Label>
                      <Textarea id="q2Answer" placeholder="例：3ヶ月以内に始めたい。スタッフへの研修が必要かどうか不安 など" rows={3} {...register("q2Answer")} className="mt-1" />
                      <p className="text-xs text-muted-foreground mt-1">{watch("q2Answer")?.length ?? 0}/500文字</p>
                      {errors.q2Answer && <p className="text-destructive text-xs mt-1">{errors.q2Answer.message}</p>}
                    </div>
                    <div className="bg-muted/40 rounded-lg p-3 flex items-start gap-2 text-xs text-muted-foreground">
                      <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span>送信することで、<a href="/privacy" className="underline hover:text-primary">プライバシーポリシー</a>に同意したものとみなします。</span>
                    </div>
                    <div className="flex flex-col-reverse sm:flex-row justify-between gap-2 pt-2">
                      <Button type="button" variant="outline" onClick={() => { setFormStep(1); document.getElementById("lead-form")?.scrollIntoView({ behavior: "smooth" }); }} className="w-full sm:w-auto">
                        <ChevronLeft className="w-4 h-4 mr-1" /> 戻る
                      </Button>
                      <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white px-8 w-full sm:w-auto" disabled={isSubmitting || submitLead.isPending}>
                        {submitLead.isPending ? "送信中..." : "資料を無料でダウンロードする"}
                        <Download className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </PartnerFormWizard>
          </Card>
        </div>
      </section>
    </div>
  );
}
