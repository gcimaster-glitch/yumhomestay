/**
 * ForAgents.tsx — 旅行代理店向けランディングページ
 * CTA: 資料請求（フォーム）・デモ体験
 */
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { PartnerFormWizard, type WizardStep } from "@/components/PartnerFormWizard";
import { PrefectureMapSelector } from "@/components/PrefectureMapSelector";
import {
  Globe, Users, Briefcase, Star, ChevronDown, ChevronUp,
  Download, Play, CheckCircle, TrendingUp, Banknote,
  ArrowRight, Gift, MapPin, Building2, Heart, Leaf, Award, ChevronRight, ChevronLeft, Info
} from "lucide-react";

// ─── 定数 ────────────────────────────────────────────────────────────────────

// ── 代理店の声（実際の声が集まり次第こちらを更新してください） ──────────────────
const AGENT_VOICES = [
  {
    name: "アジアトラベル株式会社（東京・提携後1年目）",
    text: "中国人ゲストを主に扱っていますが、「本物の日本家庭体験」は他社では絶対に提供できない商品です。顧客のリピート率が大幅に上がり、口コミで新規顧客も増えました。",
    stars: 5,
  },
  {
    name: "ジャパンエクスペリエンス社（大阪・提携後6ヶ月）",
    text: "小規模な代理店ですが、YumHomeStayの専任ダッシュボードのおかげで予約管理が格段に楽になりました。顧客からの評判も高く、自社のブランド力向上にも繋がっています。",
    stars: 5,
  },
];

const AGENT_BROCHURE_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663381534240/FWh8vTLvqLGbaqKezVTx6W/agent-brochure_8f3a2b91.pdf";

// PREFECTURES_JP はPrefectureMapSelectorからexportされているため、ここでは不要

// 海外主要国
const COUNTRIES_OVERSEAS = [
  "アメリカ合衆国", "カナダ", "イギリス", "フランス", "ドイツ",
  "オーストラリア", "ニュージーランド", "シンガポール", "マレーシア",
  "タイ", "中国", "香港", "台湾", "韓国", "インド",
  "ブラジル", "メキシコ", "アラブ首長国連邦", "その他",
];

// アメリカの州
const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado",
  "Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho",
  "Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana",
  "Maine","Maryland","Massachusetts","Michigan","Minnesota",
  "Mississippi","Missouri","Montana","Nebraska","Nevada",
  "New Hampshire","New Jersey","New Mexico","New York",
  "North Carolina","North Dakota","Ohio","Oklahoma","Oregon",
  "Pennsylvania","Rhode Island","South Carolina","South Dakota",
  "Tennessee","Texas","Utah","Vermont","Virginia","Washington",
  "West Virginia","Wisconsin","Wyoming","Washington D.C.",
];

// 得意な人種・国籍グループ
const SPECIALTY_MARKETS = [
  "東アジア（中国・台湾・香港）",
  "東アジア（韓国）",
  "東南アジア（タイ・マレーシア・シンガポール等）",
  "南アジア（インド・パキスタン等）",
  "北米（アメリカ・カナダ）",
  "ヨーロッパ（英国・フランス・ドイツ等）",
  "オセアニア（オーストラリア・NZ）",
  "中東（UAE・サウジアラビア等）",
  "中南米（ブラジル・メキシコ等）",
  "特定の専門なし（幅広く対応）",
];

// ─── フォームスキーマ ─────────────────────────────────────────────────────────

const step1Schema = z.object({
  name: z.string().min(1, "担当者名を入力してください").max(100),
  company: z.string().min(1, "会社名を入力してください").max(200),
  email: z.string().email("正しいメールアドレスを入力してください"),
  phone: z
    .string()
    .min(10, "電話番号は10桁以上で入力してください")
    .max(30)
    .regex(/^[\d\-\+\(\)\s]+$/, "電話番号は数字・ハイフン・+のみ使用できます"),
});

const formSchema = step1Schema.extend({
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

// ─── セッションストレージキー ────────────────────────────────────────────────
const SESSION_KEY_AGENT_LEAD = "yhs_agent_lead";

// ─── ウィザードステップ定義 ──────────────────────────────────────────────────
const WIZARD_STEPS: WizardStep[] = [
  { id: 1, title: "会社・担当者情報", desc: "会社名・連絡先" },
  { id: 2, title: "取扱内容・意欲", desc: "エリア・顧客層・意欲" },
];

const NAVIGATOR_MESSAGES = [
  {
    step: 1,
    message: "はじめまして！YumHomeStayのナビゲーターです。まずは会社と担当者の情報を教えてください。3分で完了します✨",
  },
  {
    step: 2,
    message: "もう少しです！取扱エリアと提携意欲について教えてください。これをもとに担当者からご連絡します😊",
  },
];

// ─── FAQ ─────────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: "代理店手数料の支払いはどのように行われますか？",
    a: "予約確定後、月末締め・翌月末払いで銀行振込にて支払います。海外代理店の場合は国際送金または PayPal に対応しています。",
  },
  {
    q: "最低取扱件数はありますか？",
    a: "ありません。月1件からでも取り扱い可能です。まずは試験的に始めていただき、実績を積んでいただけます。",
  },
  {
    q: "ゲストのキャンセル対応はどうなりますか？",
    a: "キャンセルポリシーはYumHomeStayが管理します。代理店様はキャンセル手数料の対象外となります。",
  },
  {
    q: "独自のパッケージツアーに組み込めますか？",
    a: "はい、可能です。ホームステイ体験を既存ツアーのオプションとして組み込む形での提携も歓迎しています。",
  },
  {
    q: "専用の予約管理ツールはありますか？",
    a: "代理店専用のダッシュボードを提供しています。予約状況・収益レポート・ゲスト情報をリアルタイムで確認できます。",
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

export default function ForAgents() {
  const [submitted, setSubmitted] = useState(false);
  const [submittedName, setSubmittedName] = useState("");
  const [formStep, setFormStep] = useState(1);
  const [, navigate] = useLocation();

  // sessionStorageから引き継ぎデータを読み込む
  const savedLead = (() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY_AGENT_LEAD);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  })();

  const submitLead = trpc.lead.submit.useMutation({
    onSuccess: () => {
      const name = getValues("name");
      sessionStorage.setItem("yhs_lead_name", name);
      navigate(`/thanks/partner?type=agent&name=${encodeURIComponent(name)}`);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

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
      name: savedLead.name ?? "",
      company: savedLead.company ?? "",
      email: savedLead.email ?? "",
      phone: savedLead.phone ?? "",
    },
  });

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    try { sessionStorage.setItem(SESSION_KEY_AGENT_LEAD, JSON.stringify(data)); } catch {}
    submitLead.mutate({
      type: "agent",
      name: data.name,
      company: data.company,
      email: data.email,
      phone: data.phone,
      agentRegion: data.agentRegion,
      agentCountry: data.agentCountry,
      agentState: data.agentState,
      specialtyRace: data.specialtyRace,
      q1Answer: data.q1Answer,
      q2Answer: data.q2Answer,
      origin: window.location.origin,
    });
  };

  const handleStep1Next = async () => {
    const ok = await trigger(["name", "company", "email", "phone"]);
    if (ok) {
      try {
        const vals = getValues();
        sessionStorage.setItem(SESSION_KEY_AGENT_LEAD, JSON.stringify(vals));
      } catch {}
      setFormStep(2);
      document.getElementById("lead-form")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const scrollToForm = () => {
    document.getElementById("lead-form")?.scrollIntoView({ behavior: "smooth" });
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
          <h1 className="text-2xl font-bold text-foreground">
            {submittedName} 様、ありがとうございます！
          </h1>
          <p className="text-muted-foreground">
            資料請求を受け付けました。ご登録のメールアドレスに確認メールをお送りしました。
            担当者より3営業日以内にご連絡いたします。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={AGENT_BROCHURE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              資料をダウンロード
            </a>
            <Link href="/business/agent">
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
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-700 to-indigo-600 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-blue-300 blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 order-2 lg:order-1">
              <Badge className="bg-yellow-400 text-yellow-900 font-semibold px-3 py-1">
                🎉 2026年8月まで登録料無料キャンペーン実施中
              </Badge>
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                日本のホームステイ体験を<br />
                <span className="text-yellow-300">あなたの顧客に届ける</span>
              </h1>
              <p className="text-lg text-blue-100 leading-relaxed">
                YumHomeStayのアフィリエイトパートナーとして、
                海外からのゲストを日本のホームステイ体験へ送客してください。
                送客実績に応じた紹介手数料＋月間ボーナスで、
                安定した副収入を構築できます。詳細は資料請求後にご案内。
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={scrollToForm}
                  className="inline-flex items-center justify-center gap-2 bg-yellow-400 text-yellow-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-yellow-300 transition-colors shadow-lg"
                >
                  <Download className="w-5 h-5" />
                  無料で資料請求する
                </button>
                <Link href="/demo/agent">
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
                  src="https://d2xsxph8kpxj0f.cloudfront.net/310519663381534240/FWh8vTLvqLGbaqKezVTx6W/lp-agent-hero_ee13735e.jpg"
                  alt="日本のホームステイ体験を海外ゲストに紹介する旅行代理店の様子"
                  className="w-full h-72 lg:h-96 object-cover"
                />
                <div className="absolute bottom-4 left-4 right-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { icon: Banknote, label: "紹介手数料", value: "安定収益", sub: "1件ごとに発生" },
                    { icon: TrendingUp, label: "月間ボーナス", value: "件数に応じて上昇", sub: "詳細は資料でご案内" },
                  ].map((item) => (
                    <Card key={item.label} className="bg-black/60 backdrop-blur-sm border-white/20 text-white">
                      <CardContent className="p-3 space-y-0.5">
                        <item.icon className="w-4 h-4 text-yellow-300" />
                        <div className="text-xs text-blue-200">{item.label}</div>
                        <div className="text-lg font-bold">{item.value}</div>
                        <div className="text-xs text-blue-200">{item.sub}</div>
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
      <section className="py-16 bg-blue-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            代理店様のメリット
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Banknote, title: "安定した手数料収入", desc: "送客実績に応じた紹介手数料＋月間件数ボーナス。送客件数に応じて収益が拡大します。詳細は資料請求後にご案内。" },
              { icon: Globe, title: "差別化できる商品", desc: "他社にない「本物の日本家庭体験」を商品ラインナップに加えることで、競合との差別化が可能です。" },
              { icon: Star, title: "高い顧客満足度", desc: "ゲストのリピート率・口コミ評価が高く、代理店様のブランド価値向上にも貢献します。" },
              { icon: Building2, title: "専用ダッシュボード", desc: "予約状況・収益レポート・ゲスト情報をリアルタイムで確認できる代理店専用ツールを提供します。" },
              { icon: Users, title: "専任サポート", desc: "日本語・英語・中国語・韓国語に対応した専任担当者がサポートします。" },
              { icon: TrendingUp, title: "成長市場への参入", desc: "インバウンド観光は回復・拡大中。今から参入することで市場成長の恩恵を最大限に受けられます。" },
            ].map((item) => (
              <div key={item.title} className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                  <item.icon className="w-5 h-5 text-blue-600" />
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
          <h2 className="text-3xl font-bold text-center text-foreground mb-4">安定した紹介手数料収入モデル</h2>
          <p className="text-center text-muted-foreground mb-10">月末締め翌月末払い。送客件数に応じたボーナス制度あり。</p>
          <div className="grid sm:grid-cols-3 gap-6 mb-10">
            {[
              { icon: Banknote, title: "送客ごとに積み上がる手数料", desc: "1件送客ごとに手数料が発生。月間送客件数に応じたボーナス制度もあり。詳細は資料請求後にご案内。", color: "bg-blue-50 border-blue-200" },
              { icon: Globe, title: "差別化できる商品ラインナップ", desc: "他社にない「本物の日本家庭体験」を商品に追加。競合との差別化で顧客満足度を向上。", color: "bg-indigo-50 border-indigo-200" },
              { icon: TrendingUp, title: "成長市場への参入", desc: "インバウンド観光は回復・拡大中。今から参入することで市場成長の恩恵を最大限に受けられます。", color: "bg-cyan-50 border-cyan-200" },
            ].map((item) => (
              <Card key={item.title} className={`border ${item.color}`}>
                <CardContent className="p-6 space-y-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <item.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="font-bold text-lg text-foreground">{item.title}</div>
                  <div className="text-sm text-muted-foreground leading-relaxed">{item.desc}</div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="bg-gradient-to-r from-blue-700 to-indigo-600 rounded-2xl p-8 text-white text-center">
            <div className="text-4xl font-bold mb-2">送客件数に応じた収益モデル</div>
            <div className="text-blue-100 mb-4">紹介手数料＋月間ボーナス。詳細は資料請求後にご案内します。</div>
            <button
              onClick={scrollToForm}
              className="inline-flex items-center gap-2 bg-yellow-400 text-yellow-900 px-8 py-3 rounded-xl font-bold hover:bg-yellow-300 transition-colors"
            >
              <Download className="w-4 h-4" />
              無料で手数料詳細を確認する
            </button>
          </div>
        </div>
      </section>

      {/* ── お金以外の価値訴求 ── */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <Badge className="bg-blue-100 text-blue-800 border-blue-300 mb-4 text-sm px-4 py-1">
              収益だけじゃない、YumHomeStayパートナーになる本当の理由
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              旅行代理店が、<span className="text-blue-600">日本文化体験のキュレーター</span>になる
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              YumHomeStayとの提携は、単なる手数料収益だけでなく、貴社のブランド価値と顧客満足度を同時に高める機会です。
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* 商品差別化 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-blue-100 text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto">
                <Award className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground">商品差別化</h3>
              <p className="text-muted-foreground leading-relaxed">
                他社にない「本物の日本家庭体験」を商品ラインナップに加えることで、
                競合との明確な差別化が実現。顧客の選択肢が広がり、リピート率が向上します。
              </p>
              <div className="bg-blue-50 rounded-xl p-3 text-sm text-blue-700 font-medium">
                「他社にないユニークな体験で顧客に喜ばれた」
              </div>
            </div>

            {/* 顧客満足度向上 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-blue-100 text-center space-y-4">
              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto">
                <Star className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground">顧客満足度向上</h3>
              <p className="text-muted-foreground leading-relaxed">
                ゲストのリピート率・口コミ評価が高く、貴社のブランド価値向上に貢献。
                顧客から「あの代理店でよかった」と言われる実績を積み重ねます。
              </p>
              <div className="bg-amber-50 rounded-xl p-3 text-sm text-amber-700 font-medium">
                「顧客から『また利用したい』と言われた」
              </div>
            </div>

            {/* 成長市場への先行参入 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-blue-100 text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto">
                <Leaf className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground">成長市場への先行参入</h3>
              <p className="text-muted-foreground leading-relaxed">
                インバウンド観光市場は拡大中。今からパートナーになることで、
                市場成長の最前線に立ち、将来の大きな収益基盤を構築できます。
              </p>
              <div className="bg-green-50 rounded-xl p-3 text-sm text-green-700 font-medium">
                「早期参入で市場のリーダーになれた」
              </div>
            </div>
          </div>

          {/* 代理店の声 */}
          <div className="bg-white rounded-2xl p-8 border border-blue-100 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Heart className="w-5 h-5 text-rose-500" />
              <h3 className="text-lg font-bold text-foreground">パートナー代理店の声</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {AGENT_VOICES.map((voice) => (
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
      <section className="py-16 bg-blue-50">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-foreground mb-10">よくある質問</h2>
          <div className="bg-white rounded-xl border border-blue-100 p-6 divide-y divide-border">
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
          <Card className="border-blue-200 shadow-xl overflow-hidden">
            <PartnerFormWizard
              currentStep={formStep}
              steps={WIZARD_STEPS}
              navigatorMessages={NAVIGATOR_MESSAGES}
              theme="blue"
              navigatorTitle="YumHomeStayナビゲーター"
            >
              <form onSubmit={handleSubmit(onSubmit)}>
                {/* ── ステップ1: 会社・担当者情報 ── */}
                {formStep === 1 && (
                  <div className="space-y-5">
                    <div>
                      <Label htmlFor="name">担当者名 <span className="text-destructive">*</span></Label>
                      <Input id="name" placeholder="山田 太郎" {...register("name")} className="mt-1" autoComplete="name" />
                      {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="company">会社名 <span className="text-destructive">*</span></Label>
                      <Input id="company" placeholder="例：〇〇トラベル株式会社" {...register("company")} className="mt-1" autoComplete="organization" />
                      {errors.company && <p className="text-destructive text-xs mt-1">{errors.company.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="email">メールアドレス <span className="text-destructive">*</span></Label>
                      <Input id="email" type="email" placeholder="example@email.com" {...register("email")} className="mt-1" autoComplete="email" />
                      {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="phone">電話番号 <span className="text-destructive">*</span></Label>
                      <Input id="phone" type="tel" placeholder="090-1234-5678 または +1-555-0100" {...register("phone")} className="mt-1" autoComplete="tel" />
                      <p className="text-xs text-muted-foreground mt-1">国際電話番号（+1-...）も入力可能です</p>
                      {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone.message}</p>}
                    </div>
                    <div className="flex justify-end pt-2">
                      <Button type="button" onClick={handleStep1Next} className="bg-blue-700 hover:bg-blue-800 text-white px-8 w-full sm:w-auto">
                        次へ <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* ── ステップ2: 取扱内容・意欲 ── */}
                {formStep === 2 && (
                  <div className="space-y-5">
                    {/* 所在地：日本 or 海外 */}
                    <div>
                      <Label>所在地 <span className="text-destructive">*</span></Label>
                      <div className="flex gap-4 mt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" value="domestic" {...register("agentRegion")} />
                          <span className="text-sm">日本国内</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" value="international" {...register("agentRegion")} />
                          <span className="text-sm">海外</span>
                        </label>
                      </div>
                      {errors.agentRegion && <p className="text-destructive text-xs mt-1">{errors.agentRegion.message}</p>}
                    </div>

                    {agentRegion === "domestic" && (
                      <PrefectureMapSelector
                        value={watch("agentCountry") ?? ""}
                        onChange={(v) => setValue("agentCountry", v, { shouldValidate: true })}
                        error={errors.agentCountry?.message}
                        required
                      />
                    )}

                    {agentRegion === "international" && (
                      <>
                        <div>
                          <Label htmlFor="country">国 <span className="text-destructive">*</span></Label>
                          <Select onValueChange={(v) => setValue("agentCountry", v)} defaultValue={watch("agentCountry")}>
                            <SelectTrigger className="mt-1"><SelectValue placeholder="国を選択" /></SelectTrigger>
                            <SelectContent>{COUNTRIES_OVERSEAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                          </Select>
                          {errors.agentCountry && <p className="text-destructive text-xs mt-1">{errors.agentCountry.message}</p>}
                        </div>
                        {selectedCountry === "アメリカ合衆国" && (
                          <div>
                            <Label htmlFor="usState">州 <span className="text-destructive">*</span></Label>
                            <Select onValueChange={(v) => setValue("agentState", v)}>
                              <SelectTrigger className="mt-1"><SelectValue placeholder="州を選択" /></SelectTrigger>
                              <SelectContent>{US_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                        )}
                      </>
                    )}

                    <div>
                      <Label htmlFor="specialtyMarket">得意な顧客層（国籍・人種） <span className="text-destructive">*</span></Label>
                      <Select onValueChange={(v) => setValue("specialtyRace", v)} defaultValue={watch("specialtyRace")}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="得意な顧客層を選択" /></SelectTrigger>
                        <SelectContent>{SPECIALTY_MARKETS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                      </Select>
                      {errors.specialtyRace && <p className="text-destructive text-xs mt-1">{errors.specialtyRace.message}</p>}
                    </div>

                    <div>
                      <Label htmlFor="q1Answer">
                        Q1. YumHomeStayとの提携に興味を持った理由を教えてください
                        <span className="text-destructive ml-1">*</span>
                      </Label>
                      <Textarea id="q1Answer" placeholder="例：日本文化体験の需要が高まっている、差別化できる商品を探していた など" rows={3} {...register("q1Answer")} className="mt-1" />
                      <p className="text-xs text-muted-foreground mt-1">{watch("q1Answer")?.length ?? 0}/500文字</p>
                      {errors.q1Answer && <p className="text-destructive text-xs mt-1">{errors.q1Answer.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="q2Answer">
                        Q2. 提携開始をいつ頃から考えていますか？漢念点があれば教えてください
                        <span className="text-destructive ml-1">*</span>
                      </Label>
                      <Textarea id="q2Answer" placeholder="例：3ヶ月以内に始めたい。送客できる件数が不明 など" rows={3} {...register("q2Answer")} className="mt-1" />
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
                      <Button type="submit" className="bg-blue-700 hover:bg-blue-800 text-white px-8 w-full sm:w-auto" disabled={isSubmitting || submitLead.isPending}>
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
