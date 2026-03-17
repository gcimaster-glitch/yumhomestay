/**
 * ForHosts.tsx — ホストファミリー向けランディングページ
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
  Home, Users, Utensils, Star, ChevronDown, ChevronUp,
  Download, Play, CheckCircle, Clock, MapPin, Banknote,
  ArrowRight, Gift, Heart, Leaf, Award, Globe, ChevronRight, ChevronLeft, Info
} from "lucide-react";

// ─── 定数 ────────────────────────────────────────────────────────────────────

const YUMHOST_CERTIFICATE_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663381534240/FWh8vTLvqLGbaqKezVTx6W/yumhost-certificate_38651bd7.png";

// ── ホストの声（実際の声が集まり次第こちらを更新してください） ──────────────────
const HOST_VOICES = [
  {
    name: "田中さん（東京都・3年目）",
    text: "最初は不安でしたが、今では毎月のゲストが楽しみで仕方ありません。先月はアメリカ・フランス・韓国のゲストをお迎えしました。子供たちの英語力も上がり、家族全員が成長できています。",
    stars: 5,
  },
  {
    name: "鈴木さん（大阪府・1年目）",
    text: "料理が好きで始めましたが、ゲストから『日本のお母さんの料理が最高』と言われた時は本当に嬉しかった。副収入も助かりますが、それ以上に世界中に友達ができた感覚が最高です。",
    stars: 5,
  },
];

const HOST_BROCHURE_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663381534240/FWh8vTLvqLGbaqKezVTx6W/host-brochure_ddec2d6c.pdf";

// PREFECTURES はPrefectureMapSelectorからexportされているため、ここでは不要

// ─── フォームスキーマ ─────────────────────────────────────────────────────────

const step1Schema = z.object({
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
});

const formSchema = step1Schema.extend({
  maxGuests: z.coerce
    .number()
    .int()
    .min(2, "最大受入人数は2名以上で入力してください")
    .max(20),
  q1Answer: z
    .string()
    .min(1, "回答を入力してください")
    .max(500),
  q2Answer: z
    .string()
    .min(1, "回答を入力してください")
    .max(500),
});

type FormValues = z.infer<typeof formSchema>;

// ─── セッションストレージキー ────────────────────────────────────────────────
const SESSION_KEY_HOST_LEAD = "yhs_host_lead";

// ─── ウィザードステップ定義 ──────────────────────────────────────────────────
const WIZARD_STEPS: WizardStep[] = [
  { id: 1, title: "基本情報", desc: "お名前・連絡先" },
  { id: 2, title: "活動情報", desc: "受入条件・意欲" },
];

const NAVIGATOR_MESSAGES = [
  {
    step: 1,
    message: "はじめまして！YumHomeStayのナビゲーターです。まずはあなたの基本情報を教えてください。3分で完了します✨",
  },
  {
    step: 2,
    message: "もう少しです！受入条件と活動意欲について教えてください。これをもとに担当者からご連絡します😊",
  },
];

// ─── FAQ ─────────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: "英語が話せなくても大丈夫ですか？",
    a: "大丈夫です。YumHomeStayが通訳サポートを提供します。ゲストも「日本語で話したい」という方が多く、片言でも喜んでいただけます。",
  },
  {
    q: "料理は何を作ればいいですか？",
    a: "特別な料理は必要ありません。肉じゃが・味噌汁・おにぎりなど、普段の家庭料理で十分です。一緒に作る過程がゲストにとって最高の体験です。",
  },
  {
    q: "子供がいても大丈夫ですか？",
    a: "むしろ歓迎です。子供のいる家庭は、ゲストから特に人気があります。",
  },
  {
    q: "保険はどうすればいいですか？",
    a: "賠償責任保険への加入が必要です。未加入の場合、当社提携の保険会社をご紹介します。",
  },
  {
    q: "受入頻度は自分で決められますか？",
    a: "はい、ご自身のペースで受入日程を設定できます。月1回でも月10回でも構いません。",
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

export default function ForHosts() {
  const [submitted, setSubmitted] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [, navigate] = useLocation();
  useSeoMeta({
    titleJa: 'YumHomeStay｜ホストファミリー募集｜日本のホームステイホストになろう',
    titleEn: 'YumHomeStay | Become a Host Family | Welcome International Guests',
    titleZh: 'YumHomeStay | 成为接待家庭 | 欢迎国际访客',
    titleKo: 'YumHomeStay | 호스트 가족 모집 | 국제 게스트를 환영하세요',
    descriptionJa: 'YumHomeStayのホストファミリーになって、世界の旅行者と交流しながら収入を得ませんか。登録無料。',
    descriptionEn: 'Become a YumHomeStay host family and welcome international guests. Share Japanese culture and earn income. Free registration.',
    keywordsJa: 'ホストファミリー 募集,ホームステイ ホスト,YumHomeStay ホスト登録',
    keywordsEn: 'become host family Japan, homestay host registration, YumHomeStay host',
    ogUrl: 'https://yumhomestay.com/for-hosts',
  });
  const [submittedName, setSubmittedName] = useState("");

  const submitLead = trpc.lead.submit.useMutation({
    onSuccess: () => {
      const name = getValues("name");
      // sessionStorageに名前を保存（サンクスページで使用）
      sessionStorage.setItem("yhs_lead_name", name);
      navigate(`/thanks/partner?type=host&name=${encodeURIComponent(name)}`);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  // sessionStorageから引き継ぎデータを読み込む
  const savedLead = (() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY_HOST_LEAD);
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
      maxGuests: 4,
      name: savedLead.name ?? "",
      email: savedLead.email ?? "",
      phone: savedLead.phone ?? "",
      prefecture: savedLead.prefecture ?? "",
      nearestStation: savedLead.nearestStation ?? "",
      company: savedLead.company ?? "",
    },
  });

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    // sessionStorageに保存して本登録フォームへの引き継ぎを可能にする
    try { sessionStorage.setItem(SESSION_KEY_HOST_LEAD, JSON.stringify(data)); } catch {}
    submitLead.mutate({ type: "host", ...data, origin: window.location.origin });
  };

  // ステップ1のバリデーション通過後にステップ2へ
  const handleStep1Next = async () => {
    const ok = await trigger(["name", "email", "phone", "prefecture", "nearestStation"]);
    if (ok) {
      // ステップ1の入力をsessionStorageに仮保存
      try {
        const vals = getValues();
        sessionStorage.setItem(SESSION_KEY_HOST_LEAD, JSON.stringify(vals));
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
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-6">
        <div className="max-w-lg w-full text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-green-600" />
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
              href={HOST_BROCHURE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              <Download className="w-4 h-4" />
              資料をダウンロード
            </a>
            <Link href="/business/host">
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
      <section className="relative bg-gradient-to-br from-green-800 via-green-700 to-emerald-600 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-yellow-300 blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 py-20 lg:py-28">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 order-2 lg:order-1">
              <Badge className="bg-yellow-400 text-yellow-900 font-semibold px-3 py-1">
                🎉 2026年8月まで登録料無料キャンペーン実施中
              </Badge>
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                あなたの家庭料理が<br />
                <span className="text-yellow-300">世界と繋がる</span>
              </h1>
              <p className="text-lg text-green-100 leading-relaxed">
                YumHostsとして登録すると、海外からのゲストをお迎えし、
                一緒に料理を作り、副収入を得ながら国際交流を楽しめます。
                受入回数に応じて収益が大幅アップ。詳細は資料請求後にご案内。
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={scrollToForm}
                  className="inline-flex items-center justify-center gap-2 bg-yellow-400 text-yellow-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-yellow-300 transition-colors shadow-lg"
                >
                  <Download className="w-5 h-5" />
                  無料で資料請求する
                </button>
                <Link href="/demo/host">
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
                  src="https://d2xsxph8kpxj0f.cloudfront.net/310519663381534240/FWh8vTLvqLGbaqKezVTx6W/lp-host-hero-a2CgcX9WX7BT3dgdYQkZN6.webp"
                  alt="日本のホストファミリーが海外ゲストをお迎えする様子"
                  className="w-full h-72 lg:h-96 object-cover"
                />
                <div className="absolute bottom-4 left-4 right-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { icon: Banknote, label: "月収", value: "大幅アップ可能", sub: "詳細は資料請求後にご案内" },
                    { icon: Star, label: "満足度", value: "4.9 / 5.0", sub: "ゲスト評価平均" },
                  ].map((item) => (
                    <Card key={item.label} className="bg-black/60 backdrop-blur-sm border-white/20 text-white">
                      <CardContent className="p-3 space-y-0.5">
                        <item.icon className="w-4 h-4 text-yellow-300" />
                        <div className="text-xs text-green-200">{item.label}</div>
                        <div className="text-lg font-bold">{item.value}</div>
                        <div className="text-xs text-green-200">{item.sub}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 体験の流れ ── */}
      <section className="py-16 bg-green-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            体験の流れ
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { step: 1, icon: MapPin, label: "駅でお出迎え", desc: "最寄り駅でゲストをピックアップ" },
              { step: 2, icon: Home, label: "自宅見学", desc: "日本の家庭を案内" },
              { step: 3, icon: Utensils, label: "一緒に料理", desc: "家庭料理を一緒に作る" },
              { step: 4, icon: Users, label: "食事を共に", desc: "テーブルを囲んで食事" },
              { step: 5, icon: Star, label: "お見送り", desc: "素敵な思い出と共に" },
            ].map((item, i) => (
              <div key={item.step} className="relative flex flex-col items-center text-center">
                {i < 4 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-full h-0.5 bg-green-200 z-0" />
                )}
                <div className="relative z-10 w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-3 shadow-md">
                  <item.icon className="w-7 h-7 text-white" />
                </div>
                <div className="text-xs font-bold text-green-600 mb-1">STEP {item.step}</div>
                <div className="font-semibold text-foreground text-sm mb-1">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 収益性PR ── */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-foreground mb-4">
            高い収益性と社会貢献を両立
          </h2>
          <p className="text-center text-muted-foreground mb-10">
            食材費補助込み・月末締め翌月末払い。副業・本業どちらにも対応。
          </p>
          <div className="grid sm:grid-cols-3 gap-6 mb-10">
            {[
              { icon: Banknote, title: "受入回数に応じた収益アップ", desc: "受入回数を増やすほど収益が拡大。詳細な収益シミュレーションは資料請求後にご案内します。", color: "bg-green-50 border-green-200" },              { icon: Clock, title: "1回約4時間", desc: "駅お迎え〜お見送りまで約4時間。週末の空き時間を有効活用できます。平日・週末どちらでも対応可。", color: "bg-emerald-50 border-emerald-200" },
              { icon: Gift, title: "食材費補助あり", desc: "食材費は別途補助支給。自己負担ゼロで料理体験を提供できます。初期コストも最小限。", color: "bg-teal-50 border-teal-200" },
            ].map((item) => (
              <Card key={item.title} className={`border ${item.color}`}>
                <CardContent className="p-6 space-y-3">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <item.icon className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="font-bold text-lg text-foreground">{item.title}</div>
                  <div className="text-sm text-muted-foreground leading-relaxed">{item.desc}</div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 text-white text-center">
            <div className="text-4xl font-bold mb-2">受入回数で収益が大幅アップ</div>
            <div className="text-green-100 mb-4">受入回数・人数によって変動。詳細は資料請求後にご案内します。</div>
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

      {/* ── 登録要件 ── */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-foreground mb-10">
            登録要件
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: Users, label: "家族構成", desc: "ホスト本人を含む2名以上の家族" },
              { icon: Home, label: "住居", desc: "清潔で安全な住環境" },
              { icon: Utensils, label: "料理", desc: "家庭料理を一緒に作れること" },
              { icon: CheckCircle, label: "保険", desc: "賠償責任保険への加入（サポートあり）" },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-4 bg-white p-4 rounded-xl border border-border">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">{item.label}</div>
                  <div className="text-sm text-muted-foreground">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── お金以外の価値訴求 ── */}
      <section className="py-20 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 mb-4 text-sm px-4 py-1">
              収益だけじゃない、YumHostsになる本当の理由
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              あなたの家庭が、<span className="text-emerald-600">世界を変える場所</span>になる
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              YumHostsは単なる副業ではありません。あなたの日常が、海外ゲストにとって生涯忘れられない体験になります。
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* 国際交流 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-emerald-100 text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto">
                <Globe className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground">国際交流</h3>
              <p className="text-muted-foreground leading-relaxed">
                毎月世界中のゲストと食卓を囲む体験。英語や異文化への理解が自然と深まり、
                子供たちのグローバルな視野が広がります。
              </p>
              <div className="bg-blue-50 rounded-xl p-3 text-sm text-blue-700 font-medium">
                「子供が英語で話しかけられるようになった」
              </div>
            </div>

            {/* スキルアップ */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-emerald-100 text-center space-y-4">
              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto">
                <Award className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground">スキルアップ</h3>
              <p className="text-muted-foreground leading-relaxed">
                ゲストをもてなす経験が、コミュニケーション力・料理の腕・ホスピタリティを磨きます。
                YumHost認定証は履歴書にも記載できます。
              </p>
              {/* YumHost認定証モックアップ */}
              <div className="rounded-xl overflow-hidden border border-amber-200 shadow-sm">
                <img
                  src={YUMHOST_CERTIFICATE_URL}
                  alt="YumHost認定証サンプル"
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
              </div>
              <div className="bg-amber-50 rounded-xl p-3 text-sm text-amber-700 font-medium">
                「YumHost認定証を取得して自信がついた」
              </div>
            </div>

            {/* 地域貢献 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-emerald-100 text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto">
                <Leaf className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground">地域貢献</h3>
              <p className="text-muted-foreground leading-relaxed">
                あなたの地域の魅力を世界に発信。インバウンド観光の担い手として、
                地域経済の活性化に貢献できます。
              </p>
              <div className="bg-green-50 rounded-xl p-3 text-sm text-green-700 font-medium">
                「地元の良さを再発見できた」
              </div>
            </div>
          </div>

          {/* ホストの声 */}
          <div className="bg-white rounded-2xl p-8 border border-emerald-100 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Heart className="w-5 h-5 text-rose-500" />
              <h3 className="text-lg font-bold text-foreground">YumHostsの声</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {HOST_VOICES.map((voice) => (
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
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-foreground mb-10">
            よくある質問
          </h2>
          <div className="divide-y divide-border">
            {FAQS.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── 資料請求フォーム ── */}
      <section id="lead-form" className="py-12 bg-gradient-to-b from-green-50 to-white">
        <div className="max-w-5xl mx-auto px-4">
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

          <Card className="border-green-200 shadow-xl overflow-hidden">
            <PartnerFormWizard
              currentStep={formStep}
              steps={WIZARD_STEPS}
              navigatorMessages={NAVIGATOR_MESSAGES}
              theme="green"
              navigatorTitle="YumHostナビゲーター"
            >
              <form onSubmit={handleSubmit(onSubmit)}>
                {/* ── ステップ1: 基本情報 ── */}
                {formStep === 1 && (
                  <div className="space-y-5">
                    {/* 氏名 */}
                    <div>
                      <Label htmlFor="name">
                        お名前 <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="name"
                        placeholder="山田 花子"
                        {...register("name")}
                        className="mt-1"
                        autoComplete="name"
                      />
                      {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
                    </div>

                    {/* 会社名 */}
                    <div>
                      <Label htmlFor="company">会社名・屋号（任意）</Label>
                      <Input
                        id="company"
                        placeholder="例：ヤマダ商事、パートナーシップ など"
                        {...register("company")}
                        className="mt-1"
                        autoComplete="organization"
                      />
                    </div>

                    {/* メール */}
                    <div>
                      <Label htmlFor="email">
                        メールアドレス <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="example@email.com"
                        {...register("email")}
                        className="mt-1"
                        autoComplete="email"
                      />
                      {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
                    </div>

                    {/* 電話番号 */}
                    <div>
                      <Label htmlFor="phone">
                        携帯電話番号 <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="090-1234-5678"
                        {...register("phone")}
                        className="mt-1"
                        autoComplete="tel"
                      />
                      <p className="text-xs text-muted-foreground mt-1">ハイフンあり・なし、どちらでも可</p>
                      {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone.message}</p>}
                    </div>

                    {/* 都道府県（マップ連動セレクター） */}
                    <PrefectureMapSelector
                      value={watch("prefecture") ?? ""}
                      onChange={(v) => setValue("prefecture", v, { shouldValidate: true })}
                      error={errors.prefecture?.message}
                      required
                    />

                    {/* 最寄り駅 */}
                    <div>
                      <Label htmlFor="nearestStation">
                        最寄り駅 <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="nearestStation"
                        placeholder="例：渋谷駅"
                        {...register("nearestStation")}
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">近辺の駅名を入力してください（線名不要）</p>
                      {errors.nearestStation && <p className="text-destructive text-xs mt-1">{errors.nearestStation.message}</p>}
                    </div>

                    {/* 次へボタン */}
                    <div className="flex justify-end pt-2">
                      <Button
                        type="button"
                        onClick={handleStep1Next}
                        className="bg-green-600 hover:bg-green-700 text-white px-8 w-full sm:w-auto"
                      >
                        次へ
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* ── ステップ2: 活動情報 ── */}
                {formStep === 2 && (
                  <div className="space-y-5">
                    {/* 最大受入人数 */}
                    <div>
                      <Label htmlFor="maxGuests">
                        最大受入可能人数 <span className="text-destructive">*</span>
                      </Label>
                      <div className="flex items-center gap-3 mt-1">
                        <Input
                          id="maxGuests"
                          type="number"
                          min={2}
                          max={20}
                          {...register("maxGuests")}
                          className="w-28"
                        />
                        <span className="text-sm text-muted-foreground">名（2名～20名）</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">自宅のスペースに合わせて設定してください</p>
                      {errors.maxGuests && <p className="text-destructive text-xs mt-1">{errors.maxGuests.message}</p>}
                    </div>

                    {/* Q1: 参入意欲 */}
                    <div>
                      <Label htmlFor="q1Answer">
                        Q1. ホストとして活動を始めたい理由を教えてください
                        <span className="text-destructive ml-1">*</span>
                      </Label>
                      <Textarea
                        id="q1Answer"
                        placeholder="例：副収入を得たい、国際交流を楽しみたい、子供に英語環境を作りたい など"
                        rows={3}
                        {...register("q1Answer")}
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">{watch("q1Answer")?.length ?? 0}/500文字</p>
                      {errors.q1Answer && <p className="text-destructive text-xs mt-1">{errors.q1Answer.message}</p>}
                    </div>

                    {/* Q2: 開始時期 */}
                    <div>
                      <Label htmlFor="q2Answer">
                        Q2. ホスト活動をいつ頃から始めたいですか？漢念点があればご記入ください
                        <span className="text-destructive ml-1">*</span>
                      </Label>
                      <Textarea
                        id="q2Answer"
                        placeholder="例：3ヶ月以内に始めたい。英語が不安だがサポートがあれば大丈夫そう など"
                        rows={3}
                        {...register("q2Answer")}
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">{watch("q2Answer")?.length ?? 0}/500文字</p>
                      {errors.q2Answer && <p className="text-destructive text-xs mt-1">{errors.q2Answer.message}</p>}
                    </div>

                    {/* プライバシー同意 */}
                    <div className="bg-muted/40 rounded-lg p-3 flex items-start gap-2 text-xs text-muted-foreground">
                      <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span>
                        送信することで、
                        <a href="/privacy" className="underline hover:text-primary">プライバシーポリシー</a>
                        に同意したものとみなします。
                      </span>
                    </div>

                    {/* ナビゲーションボタン */}
                    <div className="flex flex-col-reverse sm:flex-row justify-between gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => { setFormStep(1); document.getElementById("lead-form")?.scrollIntoView({ behavior: "smooth" }); }}
                        className="w-full sm:w-auto"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        戻る
                      </Button>
                      <Button
                        type="submit"
                        className="bg-green-600 hover:bg-green-700 text-white px-8 w-full sm:w-auto"
                        disabled={isSubmitting || submitLead.isPending}
                      >
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
