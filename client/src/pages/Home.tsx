import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import {
  Award,
  BookOpen,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Globe,
  GraduationCap,
  Heart,
  Home as HomeIcon,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Star,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { useState, useEffect, useCallback, useRef } from "react";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-4 h-4 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
        />
      ))}
    </div>
  );
}

function ExperienceCard({ exp }: { exp: { id: number; titleEn: string; titleJa?: string | null; descriptionEn: string; priceJpy: number; durationMinutes: number; maxGuests: number; cuisineType?: string | null; prefecture?: string | null; imageUrls?: string | null } }) {
  const { t, i18n } = useTranslation();
  const title = i18n.language.startsWith("ja") && exp.titleJa ? exp.titleJa : exp.titleEn;
  const images = exp.imageUrls ? JSON.parse(exp.imageUrls) as string[] : [];

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
      <div className="aspect-[4/3] bg-muted relative overflow-hidden">
        {images[0] ? (
          <img src={images[0]} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" decoding="async" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/20">
            <ChefHat className="w-12 h-12 text-primary/40" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge className="bg-white/90 text-foreground text-xs font-semibold">
            ¥{exp.priceJpy.toLocaleString()}〜
          </Badge>
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-foreground line-clamp-1 mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{exp.descriptionEn}</p>
        {/* YHS固有バッジ */}
        <div className="flex flex-wrap gap-1 mb-3">
          <Badge className="text-xs bg-green-50 text-green-700 border-green-200 hover:bg-green-50">
            {t("badge.stationPickup")}
          </Badge>
          <Badge className="text-xs bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-50">
            {t("badge.ingredientsIncluded")}
          </Badge>
          <Badge className="text-xs bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50">
            {t("badge.minGuests")}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span>Japan</span>
          </div>
          <div className="flex items-center gap-1">
            <UtensilsCrossed className="w-3 h-3" />
            <span>{exp.cuisineType ?? "Japanese"}</span>
          </div>
        </div>
        <Link href={`/experiences/${exp.id}`}>
          <Button size="sm" className="w-full mt-3">{t("home.bookNow")}</Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function CookingSchoolCard({ school }: {
  school: {
    id: number;
    nameJa: string;
    nameEn?: string | null;
    descriptionEn?: string | null;
    descriptionJa?: string | null;
    city?: string | null;
    prefecture?: string | null;
    maxCapacity?: number | null;
    galleryImageUrls?: string | null;
    certifications?: string | null;
  }
}) {
  const { t, i18n } = useTranslation();
  const name = i18n.language.startsWith("ja") ? school.nameJa : (school.nameEn ?? school.nameJa);
  const desc = i18n.language.startsWith("ja") && school.descriptionJa ? school.descriptionJa : school.descriptionEn;
  const images = school.galleryImageUrls ? JSON.parse(school.galleryImageUrls) as string[] : [];
  const certifications = school.certifications ? JSON.parse(school.certifications) as string[] : [];

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group border-0 shadow-md">
      <div className="aspect-[16/9] bg-muted relative overflow-hidden">
        {images[0] ? (
          <img src={images[0]} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" decoding="async" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
            <GraduationCap className="w-14 h-14 text-amber-400 mb-2" />
            <span className="text-sm text-amber-600 font-medium">{t("footer.findCooking")}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Link href={`/cooking-schools/${school.id}`}>
            <Button size="sm" className="w-full bg-white text-foreground hover:bg-white/90">
              {t("home.viewDetails")}
            </Button>
          </Link>
        </div>
      </div>
      <CardContent className="p-5">
        <h3 className="font-bold text-foreground text-lg mb-1 line-clamp-1">{name}</h3>
        {desc && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{desc}</p>}
        <div className="flex flex-wrap gap-1 mb-3">
          {certifications.slice(0, 3).map((s, i) => (
            <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
          ))}
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-primary" />
            <span>{[school.city, school.prefecture].filter(Boolean).join(", ") || "Japan"}</span>
          </div>
          {school.maxCapacity != null && (
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3 text-primary" />
                <span>{t("home.maxGuests", { count: school.maxCapacity })}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Hero Slideshow Data (各スライドに固有のコピーを設定) ─────────────────────────────────────────
const HERO_SLIDES = [
  {
    src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663381534240/FWh8vTLvqLGbaqKezVTx6W/hero-japanese-food_4aceb1e4.jpg",
    titleKey: "home.slide1Title",
    subtitleKey: "home.slide1Subtitle",
    tagKey: "home.slide1Tag",
    link: "/experiences",
  },
  {
    src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663381534240/FWh8vTLvqLGbaqKezVTx6W/hero-family-meal_af01ae4f_9f91dc04.webp",
    titleKey: "home.slide2Title",
    subtitleKey: "home.slide2Subtitle",
    tagKey: "home.slide2Tag",
    link: "/experiences",
  },
  {
    src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663381534240/FWh8vTLvqLGbaqKezVTx6W/hero-cooking-class-host_360e287e_a4a6fab7.webp",
    titleKey: "home.slide3Title",
    subtitleKey: "home.slide3Subtitle",
    tagKey: "home.slide3Tag",
    link: "/experiences",
  },
  {
    src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663381534240/FWh8vTLvqLGbaqKezVTx6W/hero-cooking-class-group_00119b32_124b7205.webp",
    titleKey: "home.slide4Title",
    subtitleKey: "home.slide4Subtitle",
    tagKey: "home.slide4Tag",
    link: "/cooking-schools",
  },
  {
    src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663381534240/FWh8vTLvqLGbaqKezVTx6W/hero-sushi-making_41de849f_63cd4f89.webp",
    titleKey: "home.slide5Title",
    subtitleKey: "home.slide5Subtitle",
    tagKey: "home.slide5Tag",
    link: "/cooking-schools",
  },
  {
    src: "https://d2xsxph8kpxj0f.cloudfront.net/310519663381534240/FWh8vTLvqLGbaqKezVTx6W/hero-japanese-family-cooking_d905564c_46297c43.webp",
    titleKey: "home.slide6Title",
    subtitleKey: "home.slide6Subtitle",
    tagKey: "home.slide6Tag",
    link: "/experiences",
  },
];

// ─── Manga Comic Panel Component ─────────────────────────────────────────────
function MangaPanel({
  step,
  emoji,
  title,
  titleEn,
  desc,
  descEn,
  speechBubble,
  speechBubbleEn,
  bgColor,
  accent,
  isRight = false,
}: {
  step: number;
  emoji: string;
  title: string;
  titleEn: string;
  desc: string;
  descEn: string;
  speechBubble: string;
  speechBubbleEn: string;
  bgColor: string;
  accent: string;
  isRight?: boolean;
}) {
  const { i18n } = useTranslation();

  return (
    <div className={`flex flex-col ${isRight ? "md:flex-row-reverse" : "md:flex-row"} gap-0 rounded-2xl overflow-hidden shadow-lg border-2 border-black/10`}>
      {/* Illustration panel */}
      <div className={`${bgColor} flex-1 min-h-[220px] md:min-h-0 relative flex items-center justify-center p-8`}
        style={{ borderRight: isRight ? "none" : "3px solid rgba(0,0,0,0.12)", borderLeft: isRight ? "3px solid rgba(0,0,0,0.12)" : "none" }}
      >
        {/* Step number */}
        <div className={`absolute top-3 left-3 w-9 h-9 rounded-full ${accent} text-white font-black text-lg flex items-center justify-center shadow-md`}
          style={{ fontFamily: "'Comic Sans MS', 'Bangers', cursive", border: "2px solid white" }}>
          {step}
        </div>
        {/* Big emoji illustration */}
        <div className="text-8xl md:text-9xl select-none" style={{ filter: "drop-shadow(2px 4px 6px rgba(0,0,0,0.15))" }}>
          {emoji}
        </div>
        {/* Speech bubble */}
        <div className={`absolute bottom-4 right-4 max-w-[160px] ${isRight ? "right-auto left-4" : ""}`}>
          <div className="bg-white rounded-2xl px-3 py-2 shadow-md border-2 border-black/15 relative">
            <p className="text-xs font-bold text-gray-800 leading-tight">
              {i18n.language.startsWith("ja") ? speechBubble : speechBubbleEn}
            </p>
            {/* Bubble tail */}
            <div className={`absolute -bottom-2 ${isRight ? "right-4" : "left-4"} w-4 h-4 bg-white border-r-2 border-b-2 border-black/15`}
              style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)", transform: isRight ? "scaleX(-1)" : "none" }} />
          </div>
        </div>
      </div>
      {/* Text panel */}
      <div className="flex-1 bg-white p-6 md:p-8 flex flex-col justify-center">
        <p className={`text-xs font-bold uppercase tracking-widest ${accent.replace("bg-", "text-")} mb-2`}>
          STEP {step}
        </p>
        <h3 className="text-2xl font-black text-gray-900 mb-1 leading-tight">
          {i18n.language.startsWith("ja") ? title : titleEn}
        </h3>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          {i18n.language.startsWith("ja") ? desc : descEn}
        </p>
        {/* Decorative lines like manga speed lines */}
        <div className="flex gap-1 mt-auto">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`h-1 rounded-full ${accent} opacity-${(i + 1) * 15}`}
              style={{ width: `${(i + 1) * 12}px`, opacity: (i + 1) * 0.15 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { data: experiencesData } = trpc.experience.list.useQuery({ limit: 3, offset: 0 });
  const { data: cookingSchoolsData } = trpc.cookingSchool.list.useQuery({ limit: 3, offset: 0 });

  // Slideshow state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartRef = useRef<number | null>(null);

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSlide(index);
      setIsTransitioning(false);
    }, 300);
  }, [isTransitioning]);

  const nextSlide = useCallback(() => {
    goToSlide((currentSlide + 1) % HERO_SLIDES.length);
  }, [currentSlide, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide((currentSlide - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  }, [currentSlide, goToSlide]);

  // SEO: Set page title and meta keywords dynamically
  useEffect(() => {
    const titleMap: Record<string, string> = {
      ja: 'YumHomeStay｜日本のホームステイ体験・料理教室・ワンデイステイ',
      en: 'YumHomeStay | One-Day Homestay & Cooking Class in Japan',
      zh: 'YumHomeStay | 日本家庭体验・料理教室・一日体験',
      ko: 'YumHomeStay | 일본 홈스테이 체험 · 요리 교실 · 당일 체험',
    };
    const keywordsMap: Record<string, string> = {
      ja: 'ホームステイ,日本,料理教室,ワンデイステイ,homestay,Japan,cooking class,one day stay,YumHomeStay,農家民泊,日本文化体験',
      en: 'homestay Japan, one day homestay, cooking class Japan, Japanese family experience, YumHomeStay, rural Japan stay',
      zh: '日本家庭体验,料理教室,一日体験,homestay Japan,YumHomeStay',
      ko: '일본 홈스테이,요리 교실,당일 체험,homestay Japan,YumHomeStay',
    };
    const currentLang = lang?.split('-')[0] || 'ja';
    document.title = titleMap[currentLang] || titleMap['ja'];
    // Update meta keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.setAttribute('content', keywordsMap[currentLang] || keywordsMap['ja']);
  }, [lang]);

  // Auto-play: advance every 5 seconds, paused on hover
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused]);

  // Touch swipe handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartRef.current;
    touchStartRef.current = null;
    if (Math.abs(deltaX) < 40) return;
    if (deltaX < 0) nextSlide();
    else prevSlide();
  }, [nextSlide, prevSlide]);

  const features = [
    {
      icon: <ChefHat className="w-8 h-8 text-primary" />,
      title: t("features.authentic.title"),
      desc: t("features.authentic.desc"),
    },
    {
      icon: <Heart className="w-8 h-8 text-primary" />,
      title: t("features.cultural.title"),
      desc: t("features.cultural.desc"),
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-primary" />,
      title: t("features.safe.title"),
      desc: t("features.safe.desc"),
    },
    {
      icon: <Globe className="w-8 h-8 text-primary" />,
      title: t("features.global.title"),
      desc: t("features.global.desc"),
    },
  ];

  const cookingSchoolBenefits = [
    {
      icon: <GraduationCap className="w-6 h-6 text-amber-600" />,
      title: t("home.benefit.proTitle"),
      titleEn: "Learn from Professionals",
      desc: t("home.benefit.proDesc"),
    },
    {
      icon: <Users className="w-6 h-6 text-amber-600" />,
      title: t("home.benefit.groupTitle"),
      titleEn: "Group Experiences",
      desc: t("home.benefit.groupDesc"),
    },
    {
      icon: <BookOpen className="w-6 h-6 text-amber-600" />,
      title: t("home.benefit.recipeTitle"),
      titleEn: "Take Home Recipes",
      desc: t("home.benefit.recipeDesc"),
    },
    {
      icon: <Clock className="w-6 h-6 text-amber-600" />,
      title: t("home.benefit.scheduleTitle"),
      titleEn: "Flexible Schedule",
      desc: t("home.benefit.scheduleDesc"),
    },
  ];

  const slide = HERO_SLIDES[currentSlide];

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://yumhomestay.com/#organization",
        "name": "YumHomeStay",
        "url": "https://yumhomestay.com",
        "logo": "https://yumhomestay.com/logo.png",
        "description": lang.startsWith('ja')
          ? '日本のホストファミリーと世界の旅行者をつなぐホームステイ・料理教室体験プラットフォーム'
          : 'Japan\'s homestay and cooking class experience platform connecting host families with international travelers',
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "customer support",
          "availableLanguage": ["Japanese", "English", "Chinese", "Korean"]
        },
        "areaServed": "JP",
        "serviceType": ["Homestay Experience", "Cooking Class", "Cultural Exchange"]
      },
      {
        "@type": "LocalBusiness",
        "@id": "https://yumhomestay.com/#localbusiness",
        "name": "YumHomeStay",
        "url": "https://yumhomestay.com",
        "description": lang.startsWith('ja')
          ? 'ワンデーホームステイ・料理教室体験の予約プラットフォーム'
          : 'One-day homestay and cooking class booking platform in Japan',
        "address": {
          "@type": "PostalAddress",
          "addressCountry": "JP"
        },
        "priceRange": "¥3,000 - ¥30,000",
        "openingHours": "Mo-Su 09:00-21:00",
        "currenciesAccepted": "JPY, USD",
        "paymentAccepted": "Credit Card"
      },
      {
        "@type": "WebSite",
        "@id": "https://yumhomestay.com/#website",
        "url": "https://yumhomestay.com",
        "name": "YumHomeStay",
        "inLanguage": ["ja", "en", "zh", "ko"],
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://yumhomestay.com/experiences?q={search_term_string}"
          },
          "query-input": "required name=search_term_string"
        }
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* ─── Hero Section - Slideshow ─────────────────────────────────────── */}
      <section
        className="relative overflow-hidden min-h-[88vh] flex items-center"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slideshow background images */}
        <div className="absolute inset-0">
          {HERO_SLIDES.map((s, index) => (
            <div
              key={index}
              className="absolute inset-0 transition-opacity duration-700 ease-in-out"
              style={{ opacity: index === currentSlide ? 1 : 0 }}
            >
              <img
                src={s.src}
                alt={t(s.titleKey)}
                className="w-full h-full object-cover"
                fetchPriority={index === 0 ? "high" : "low"}
                loading={index === 0 ? "eager" : "lazy"}
                decoding={index === 0 ? "sync" : "async"}
              />
            </div>
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/20" />
        </div>

        {/* Content — スライドごとに変わるコピー */}
        <div className="container relative z-10 py-16">
          <div className="max-w-2xl">
            <Badge className="mb-5 bg-white/20 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm">
              <Award className="w-3 h-3 mr-1" />
              {t("hero.badge")}
            </Badge>

            {/* タイトル: \n で改行 */}
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-5 drop-shadow-lg"
              style={{ lineHeight: "1.15", whiteSpace: "pre-line" }}
            >
              {t(slide.titleKey)}
            </h1>

            {/* サブタイトル */}
            <p
              className="text-base md:text-lg text-white/85 mb-8 leading-relaxed max-w-xl"
              style={{ transition: "opacity 0.4s" }}
            >
              {t(slide.subtitleKey)}
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/apply">
                <Button size="lg" className="text-base px-8 py-6 bg-primary hover:bg-primary/90 shadow-lg">
                  <ClipboardList className="w-5 h-5 mr-2" />
                  {t("hero.ctaApply")}
                </Button>
              </Link>
              <Link href="/experiences">
                <Button size="lg" className="text-base px-8 py-6 bg-white/20 hover:bg-white/30 text-white border border-white/40 shadow-lg backdrop-blur-sm">
                  <UtensilsCrossed className="w-5 h-5 mr-2" />
                  {t("hero.cta")}
                </Button>
              </Link>
                <Link href="/cooking-schools">
                <Button size="lg" className="text-base px-8 py-6 bg-amber-500 hover:bg-amber-600 text-white border-0 shadow-lg">
                  <GraduationCap className="w-5 h-5 mr-2" />
                  {t("footer.findCooking")}
                </Button>
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex flex-wrap items-center gap-6 mt-10 text-sm text-white/80">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {["🇺🇸", "🇬🇧", "🇨🇳", "🇰🇷"].map((flag, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-sm backdrop-blur-sm">
                      {flag}
                    </div>
                  ))}
                </div>
                <span>{t("hero.guestCount")}</span>
              </div>
              <div className="flex items-center gap-1">
                <StarRating rating={5} />
                <span className="font-semibold text-white">4.9</span>
                <span className="text-white/70">(320 reviews)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating character + cards - right side (desktop only) */}
        <div className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2 flex-col items-center gap-3 z-10">
          {/* ままクックキャラクター（両手広げ歓迎） */}
          <div className="relative">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663381534240/FWh8vTLvqLGbaqKezVTx6W/pose01_mama_f72ad8db.webp"
              alt="Mama Cook"
              className="w-48 drop-shadow-2xl"
              style={{ animation: "float 3s ease-in-out infinite" }}
              loading="lazy"
              decoding="async"
            />
            {/* 吹き出し */}
            <div className="absolute -top-1 -left-6 bg-white rounded-2xl px-3 py-2 shadow-xl border-2 border-primary/20">
              <p className="text-xs font-bold text-foreground whitespace-nowrap">{t("home.welcome")} 🎉</p>
              <div className="absolute -bottom-2 right-5 w-4 h-4 bg-white border-r-2 border-b-2 border-primary/20"
                style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }} />
            </div>
          </div>
          {/* カード行 */}
          <div className="flex gap-3">
            <div className="w-44 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663381534240/FWh8vTLvqLGbaqKezVTx6W/hero-homestay_e8d3b8fc.jpg"
                alt="Homestay experience"
                className="w-full h-28 object-cover"
                loading="lazy"
                decoding="async"
              />
              <div className="bg-white/95 backdrop-blur-sm px-3 py-2">
                <p className="text-xs font-bold text-foreground">🏠 {t("hero.homestayCard")}</p>
              </div>
            </div>
            <div className="w-44 rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-400/40">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663381534240/FWh8vTLvqLGbaqKezVTx6W/hero-cooking-class_9c474d7d.jpg"
                alt="Cooking class"
                className="w-full h-28 object-cover"
                loading="lazy"
                decoding="async"
              />
              <div className="bg-amber-50/95 backdrop-blur-sm px-3 py-2">
                <p className="text-xs font-bold text-foreground">🎓 {t("hero.cookingCard")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Slideshow Controls: prev/next arrows */}
        <button
          onClick={prevSlide}
          aria-label="Previous slide"
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={nextSlide}
          aria-label="Next slide"
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Slideshow Controls: caption + dot indicators */}
        <div className="absolute bottom-6 left-0 right-0 z-20 flex flex-col items-center gap-3 px-4">
          <Link href={slide.link}>
            <div className="group bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white text-sm px-4 py-1.5 rounded-full flex items-center gap-2 transition-all duration-300 cursor-pointer">
              <span className="font-medium group-hover:underline underline-offset-2">
                {t(slide.tagKey)}
              </span>
              <ChevronRight className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
          <div className="flex items-center gap-2">
            {HERO_SLIDES.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
                className={`transition-all duration-300 rounded-full ${
                  index === currentSlide
                    ? "w-6 h-2.5 bg-white"
                    : "w-2.5 h-2.5 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── What is YumHomeStay? (サービス説明) ─────────────────────────── */}
      <section className="py-16 bg-white border-b border-border">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <HomeIcon className="w-3 h-3 mr-1" />
              {t("whatIs.title")}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4 leading-tight">
              {t("whatIs.heroTitle")}
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed" style={{ whiteSpace: "pre-line" }}>
              {t("whatIs.heroDesc")}
            </p>
          </div>

          {/* 3つのポイント */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                emoji: "🏠",
                charImg: "https://d2xsxph8kpxj0f.cloudfront.net/310519663381534240/FWh8vTLvqLGbaqKezVTx6W/pose01_papa_5d1c0536.webp",
                charAlt: "Papa Cook",
                titleKey: "home.whatIs1Title",
                descKey: "home.whatIs1Desc",
              },
              {
                emoji: "👨‍🍳",
                charImg: "https://d2xsxph8kpxj0f.cloudfront.net/310519663381534240/FWh8vTLvqLGbaqKezVTx6W/mot01_mama_ab386f86.webp",
                charAlt: "Mama Cook cooking",
                titleKey: "home.whatIs2Title",
                descKey: "home.whatIs2Desc",
              },
              {
                emoji: "🍽️",
                charImg: "https://d2xsxph8kpxj0f.cloudfront.net/310519663381534240/FWh8vTLvqLGbaqKezVTx6W/pose01_child_1a2ceb04.webp",
                charAlt: "Child character",
                titleKey: "home.whatIs3Title",
                descKey: "home.whatIs3Desc",
              },
            ].map((item, i) => (
              <div key={i} className="text-center p-6 rounded-2xl bg-secondary/30 hover:bg-secondary/50 transition-colors group">
                <div className="h-32 flex items-end justify-center mb-2 overflow-hidden">
                  <img
                    src={item.charImg}
                    alt={item.charAlt}
                    className="h-28 object-contain group-hover:scale-110 transition-transform duration-300 drop-shadow-md"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <h3 className="font-bold text-foreground text-lg mb-2">{t(item.titleKey)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(item.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Manga Comic Strip: How It Works ─────────────────────────────── */}
      <section id="how-it-works" className="py-16 md:py-24 bg-gradient-to-b from-amber-50/60 to-white">
        <div className="container">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-amber-100 text-amber-700 border-amber-200">
              📖 {t("howItWorks.badge")}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-black text-foreground mb-3">
              {t("howItWorks.title")}
            </h2>
            <p className="text-muted-foreground">
              {t("howItWorks.subtitle")}
            </p>
          </div>

          <div className="space-y-6 max-w-4xl mx-auto">
            <MangaPanel
              step={1}
              emoji="🔍"
              title={t("home.step1Title")}
              titleEn={t("home.step1Title")}
              desc={t("home.step1Desc")}
              descEn={t("home.step1Desc")}
              speechBubble={t("home.step1Bubble")}
              speechBubbleEn={t("home.step1Bubble")}
              bgColor="bg-blue-50"
              accent="bg-blue-500"
              isRight={false}
            />
            <MangaPanel
              step={2}
              emoji="📅"
              title={t("home.step2Title")}
              titleEn={t("home.step2Title")}
              desc={t("home.step2Desc")}
              descEn={t("home.step2Desc")}
              speechBubble={t("home.step2Bubble")}
              speechBubbleEn={t("home.step2Bubble")}
              bgColor="bg-green-50"
              accent="bg-green-500"
              isRight={true}
            />
            <MangaPanel
              step={3}
              emoji="💳"
              title={t("home.step3Title")}
              titleEn={t("home.step3Title")}
              desc={t("home.step3Desc")}
              descEn={t("home.step3Desc")}
              speechBubble={t("home.step3Bubble")}
              speechBubbleEn={t("home.step3Bubble")}
              bgColor="bg-purple-50"
              accent="bg-purple-500"
              isRight={false}
            />
            <MangaPanel
              step={4}
              emoji="🎉"
              title={t("home.step4Title")}
              titleEn={t("home.step4Title")}
              desc={t("home.step4Desc")}
              descEn={t("home.step4Desc")}
              speechBubble={t("home.step4Bubble")}
              speechBubbleEn={t("home.step4Bubble")}
              bgColor="bg-orange-50"
              accent="bg-orange-500"
              isRight={true}
            />
          </div>

          {/* CTA */}
          <div className="text-center mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/apply">
              <Button size="lg" className="text-base px-10 py-6 shadow-lg">
                <ClipboardList className="w-5 h-5 mr-2" />
                {t("hero.ctaApply")}
              </Button>
            </Link>
            <Link href="/experiences">
              <Button size="lg" variant="outline" className="text-base px-10 py-6">
                <UtensilsCrossed className="w-5 h-5 mr-2" />
                {t("hero.cta")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Experience Category Selection ───────────────────────────────── */}
      <section className="py-14 bg-white">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              {t("whatIs.chooseTitle")}
            </h2>
            <p className="text-muted-foreground text-lg">
              {t("whatIs.chooseDesc")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Homestay Card */}
            <Link href="/experiences">
              <div className="group relative rounded-2xl overflow-hidden cursor-pointer border-2 border-transparent hover:border-primary transition-all duration-300 shadow-md hover:shadow-xl">
                <div className="aspect-[4/3] bg-gradient-to-br from-rose-50 to-orange-100 flex flex-col items-center justify-center p-8 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5" />
                  <HomeIcon className="w-16 h-16 text-primary mb-4 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                  <h3 className="text-2xl font-bold text-foreground relative z-10 mb-2">{t("home.homestayTitle")}</h3>
                  <p className="text-muted-foreground text-center relative z-10 text-sm leading-relaxed">
                    {t("home.homestayDesc")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 relative z-10">Home Cooking Experience</p>
                </div>
                <div className="bg-white p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{t("home.homestayCapacity")}</span>
                  </div>
                  <Button size="sm" className="group-hover:translate-x-1 transition-transform">
                    {t("home.search")} →
                  </Button>
                </div>
              </div>
            </Link>

            {/* Cooking School Card */}
            <Link href="/cooking-schools">
              <div className="group relative rounded-2xl overflow-hidden cursor-pointer border-2 border-transparent hover:border-amber-500 transition-all duration-300 shadow-md hover:shadow-xl">
                <div className="aspect-[4/3] bg-gradient-to-br from-amber-50 to-yellow-100 flex flex-col items-center justify-center p-8 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 to-amber-400/5" />
                  <GraduationCap className="w-16 h-16 text-amber-600 mb-4 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                  <h3 className="text-2xl font-bold text-foreground relative z-10 mb-2">{t("home.cookingTitle")}</h3>
                  <p className="text-muted-foreground text-center relative z-10 text-sm leading-relaxed">
                    {t("home.cookingDesc")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 relative z-10">Cooking School Experience</p>
                  <Badge className="absolute top-3 right-3 bg-amber-500 text-white border-0 text-xs">
                    🆕 {t("home.newBadge")}
                  </Badge>
                </div>
                <div className="bg-white p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{t("home.cookingCapacity")}</span>
                  </div>
                  <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white group-hover:translate-x-1 transition-transform">
                    {t("home.search")} →
                  </Button>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Cooking School Section ───────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-4">
            <div>
              <Badge className="mb-3 bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
                <GraduationCap className="w-3 h-3 mr-1" />
                Cooking School Experience
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                {t("whatIs.cookingTitle")}
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl">
                {t("whatIs.cookingDesc")}
              </p>
            </div>
            <Link href="/cooking-schools">
              <Button variant="outline" className="border-amber-400 text-amber-700 hover:bg-amber-50 shrink-0">
                {t("experience.viewAllCooking")}
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {cookingSchoolBenefits.map((benefit, i) => (
              <div key={i} className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mb-3">
                  {benefit.icon}
                </div>
                <h4 className="font-semibold text-foreground text-sm mb-1">{benefit.title}</h4>
                <p className="text-xs text-amber-600 font-medium mb-2">{benefit.titleEn}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{benefit.desc}</p>
              </div>
            ))}
          </div>

          {cookingSchoolsData && cookingSchoolsData.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {cookingSchoolsData.map((school) => (
                <CookingSchoolCard key={school.id} school={school} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663381534240/FWh8vTLvqLGbaqKezVTx6W/mot01_mama_ab386f86.webp"
                alt="Mama Cook"
                className="h-36 mx-auto mb-4 drop-shadow-md"
                loading="lazy"
                decoding="async"
              />
              <h3 className="text-xl font-bold text-foreground mb-2">{t("whatIs.cookingRecruitTitle")}</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {t("whatIs.cookingRecruitDesc")}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/cooking-school/register">
                  <Button className="bg-amber-500 hover:bg-amber-600 text-white">
                    <GraduationCap className="w-4 h-4 mr-2" />
                    {t("whatIs.registerCookingSchool")}
                  </Button>
                </Link>
                <Link href="/host/register">
                  <Button variant="outline">
                    <HomeIcon className="w-4 h-4 mr-2" />
                    {t("whatIs.registerHost")}
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Comparison Banner */}
          <div className="mt-10 bg-white rounded-2xl p-6 md:p-8 shadow-sm">
              <h3 className="text-xl font-bold text-foreground mb-6 text-center">
              {t("home.comparisonTitle")}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 pr-4 font-semibold text-muted-foreground w-1/3">{t("home.compFeature")}</th>
                    <th className="text-center py-3 px-4 font-semibold text-primary">
                      <HomeIcon className="w-4 h-4 inline mr-1" />
                      {t("home.homestayTitle")}
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-amber-600">
                      <GraduationCap className="w-4 h-4 inline mr-1" />
                      {t("home.cookingTitle")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { feature: t("home.comp.atmosphere"), homestay: t("home.comp.homestayAtmosphere"), school: t("home.comp.schoolAtmosphere") },
                    { feature: t("home.comp.capacity"), homestay: t("home.comp.homestayCapacity"), school: t("home.comp.schoolCapacity") },
                    { feature: t("home.comp.level"), homestay: t("home.comp.homestayLevel"), school: t("home.comp.schoolLevel") },
                    { feature: t("home.comp.language"), homestay: t("home.comp.homestayLanguage"), school: t("home.comp.schoolLanguage") },
                    { feature: t("home.comp.recipe"), homestay: t("home.comp.homestayRecipe"), school: t("home.comp.schoolRecipe") },
                    { feature: t("home.comp.recommended"), homestay: t("home.comp.homestayRecommended"), school: t("home.comp.schoolRecommended") },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 pr-4 text-muted-foreground font-medium">{row.feature}</td>
                      <td className="py-3 px-4 text-center text-foreground">{row.homestay}</td>
                      <td className="py-3 px-4 text-center text-foreground">{row.school}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features Section ─────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t("features.title")}</h2>
            <div className="w-16 h-1 bg-primary mx-auto rounded-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <div key={i} className="text-center group">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Featured Homestay Experiences ───────────────────────────────── */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container">
          <div className="flex items-center justify-between mb-10">
            <div>
              <Badge className="mb-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
                <HomeIcon className="w-3 h-3 mr-1" />
                Homestay Experience
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-1">{t("whatIs.featuredHomestay")}</h2>
              <p className="text-muted-foreground">{t("experience.featured")}</p>
            </div>
            <Link href="/experiences">
              <Button variant="outline">{t("common.seeAll")}</Button>
            </Link>
          </div>

          {experiencesData && experiencesData.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {experiencesData.map((exp) => (
                <ExperienceCard key={exp.id} exp={exp} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663381534240/FWh8vTLvqLGbaqKezVTx6W/pose05_mama_29061610.webp"
                alt="Mama Cook"
                className="h-36 mx-auto mb-4 drop-shadow-md"
                loading="lazy"
                decoding="async"
              />
              <p className="text-lg font-medium">{t("experience.noExperiences")}</p>
              <p className="text-sm mt-1">{t("experience.noExperiencesDesc")}</p>
              <Link href="/host/register">
                <Button className="mt-4" variant="outline">{t("whatIs.registerHost")}</Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ─── Guest Voice Section ─────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="text-center mb-10">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <MessageCircle className="w-3 h-3 mr-1" />
              {t("whatIs.guestReviews")}
            </Badge>
            <h2 className="text-3xl font-bold text-foreground">
              {t("whatIs.guestReviewsTitle")}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                flag: "🇺🇸",
                name: "Sarah M.",
                country: "USA",
                rating: 5,
                commentKey: "home.review1",
              },
              {
                flag: "🇩🇪",
                name: "Klaus B.",
                country: "Germany",
                rating: 5,
                commentKey: "home.review2",
              },
              {
                flag: "🇰🇷",
                name: "지민 이",
                country: "Korea",
                rating: 5,
                commentKey: "home.review3",
              },
            ].map((review, i) => (
              <div key={i} className="bg-secondary/30 rounded-2xl p-6 relative">
                {/* Quote mark */}
                <div className="text-4xl text-primary/20 font-serif leading-none mb-3">"”</div>
                  <p className="text-sm text-foreground leading-relaxed mb-4">
                  {t(review.commentKey)}
                </p>
                <div className="flex items-center gap-3 mt-auto">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">
                    {review.flag}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{review.name}</p>
                    <p className="text-xs text-muted-foreground">{review.country}</p>
                  </div>
                  <div className="ml-auto">
                    <StarRating rating={review.rating} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Guest Apply CTA Section ──────────────────────────────────────── */}
      <section className="py-16 bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 border-y border-orange-100">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 text-sm px-4 py-1">
              <ClipboardList className="w-3.5 h-3.5 mr-1.5" />
              {t("whatIs.applyFlow")}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t("hero.ctaApply")}
            </h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              {t("whatIs.applyFlowDesc")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/apply">
                <Button size="lg" className="text-base px-10 py-6 shadow-lg bg-primary hover:bg-primary/90">
                  <ClipboardList className="w-5 h-5 mr-2" />
                  {t("inquiry.submit")}
                </Button>
              </Link>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-green-600" />
                  {t("whatIs.freeNoCommit")}
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary" />
                  {t("whatIs.replyTime")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Dual CTA Section ─────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t("whatIs.becomeHostTitle")}
              </h2>
              <p className="text-primary-foreground/80 text-lg mb-6 leading-relaxed">
                {t("whatIs.becomeHostDesc")}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/host/register">
                  <Button size="lg" variant="secondary" className="text-base">
                    <HomeIcon className="w-4 h-4 mr-2" />
                    {t("whatIs.registerHost")}
                  </Button>
                </Link>
                <Link href="/cooking-school/register">
                  <Button size="lg" variant="outline" className="text-base border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                    <GraduationCap className="w-4 h-4 mr-2" />
                    {t("whatIs.registerCookingSchool")}
                  </Button>
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: "🏠", label: t("home.stat.hosts"), value: t("home.stat.hostsValue"), sub: "Hosts" },
                { icon: "🎓", label: t("home.stat.schools"), value: t("home.stat.schoolsValue"), sub: "Cooking Schools" },
                { icon: "🌏", label: t("home.stat.languages"), value: t("home.stat.languagesValue"), sub: "Languages" },
                { icon: "⭐", label: t("home.stat.rating"), value: "4.9 / 5", sub: "Rating" },
              ].map((stat, i) => (
                <div key={i} className="bg-primary-foreground/10 rounded-xl p-4 text-center backdrop-blur-sm">
                  <div className="text-2xl mb-1">{stat.icon}</div>
                  <div className="text-xl font-bold text-primary-foreground">{stat.value}</div>
                  <div className="text-xs text-primary-foreground/70 mt-1">{stat.label}</div>
                  <div className="text-xs text-primary-foreground/50">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Login CTA ────────────────────────────────────────────────────── */}
      <section className="py-8 bg-muted/30 border-t border-border">
        <div className="container text-center">
          <p className="text-muted-foreground mb-3">
            {t("whatIs.alreadyAccount")}
          </p>
          <a href={getLoginUrl()}>
            <Button variant="outline" size="sm">
              {t("nav.login")}
            </Button>
          </a>
        </div>
      </section>

      <Footer />
    </div>
    </>
  );
}
