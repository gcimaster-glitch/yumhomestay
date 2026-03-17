import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, MapPin, Globe, Clock, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useSeoMeta } from "@/hooks/useSeoMeta";

export default function Contact() {
  const { t } = useTranslation();
  useSeoMeta({
    titleJa: 'お問い合わせ｜YumHomeStay ホームステイ・料理教室',
    titleEn: 'Contact YumHomeStay | Homestay & Cooking Class Support',
    titleZh: '联系我们 | YumHomeStay',
    titleKo: '문의하기 | YumHomeStay',
    descriptionJa: 'YumHomeStayへのお問い合わせはこちら。予約・ホスト申請・パートナーシップなどご相談ください。',
    descriptionEn: 'Contact YumHomeStay for booking support, host applications, and partnership inquiries.',
    keywordsJa: 'YumHomeStay お問い合わせ,ホームステイ サポート,料理教室 問い合わせ',
    keywordsEn: 'YumHomeStay contact, homestay support, cooking class inquiry',
    ogUrl: 'https://yumhomestay.com/contact',
  });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [inquiryType, setInquiryType] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const INQUIRY_TYPES = [
    { value: "guest", label: t("contact.typeGuest") },
    { value: "host", label: t("contact.typeHost") },
    { value: "cooking_school", label: t("contact.typeCookingSchool") },
    { value: "payment", label: t("contact.typePayment") },
    { value: "technical", label: t("contact.typeTechnical") },
    { value: "media", label: t("contact.typeMedia") },
    { value: "other", label: t("contact.typeOther") },
  ];

  const submitContact = trpc.contact.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: () => {
      toast.error(t("contact.sendFailed"));
    },
  });
  // 後方互換性のためエイリアス
  const notifyOwner = submitContact;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !inquiryType || !message) {
      toast.error(t("contact.requiredFields"));
      return;
    }
    submitContact.mutate({
      name,
      email,
      inquiryType,
      message: subject ? `[件名: ${subject}]\n${message}` : message,
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-2xl py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">{t("contact.submitted")}</h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            {t("contact.submittedDesc")}
          </p>
          <Button variant="outline" onClick={() => setSubmitted(false)}>
            {t("contact.sendAnother")}
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="bg-muted/30 border-b border-border py-12">
        <div className="container max-w-4xl">
          <div className="flex items-center gap-3 mb-3">
            <Mail className="w-6 h-6 text-amber-600" />
            <Badge variant="secondary">{t("contact.support")}</Badge>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t("contact.title")}</h1>
          <p className="text-muted-foreground">
            {t("contact.subtitle")}
          </p>
        </div>
      </section>

      <div className="container max-w-4xl py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Contact Info */}
          <div className="space-y-4">
            <Card className="border border-border/60">
              <CardContent className="p-5 space-y-4">
                <h2 className="font-bold text-foreground">{t("contact.contactInfo")}</h2>

                <div className="flex items-start gap-3 text-sm">
                  <Mail className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">{t("contact.emailLabel")}</p>
                    <a href="mailto:info@g-ex.co.jp" className="text-amber-600 hover:underline">
                      info@g-ex.co.jp
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">{t("contact.address")}</p>
                    <p className="text-muted-foreground">
                      {t("contact.addressValue")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-sm">
                  <Globe className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">{t("contact.website")}</p>
                    <a
                      href="https://g-ex.co.jp"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-600 hover:underline"
                    >
                      g-ex.co.jp
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-sm">
                  <Clock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">{t("contact.hours")}</p>
                    <p className="text-muted-foreground">
                      {t("contact.hoursValue")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-amber-100 bg-amber-50">
              <CardContent className="p-5">
                <h3 className="font-bold text-amber-800 mb-2 text-sm">{t("contact.faqTitle")}</h3>
                <p className="text-xs text-amber-700 mb-3">
                  {t("contact.faqDesc")}
                </p>
                <a
                  href="/faq"
                  className="text-xs text-amber-600 font-medium hover:underline"
                >
                  {t("contact.faqLink")}
                </a>
              </CardContent>
            </Card>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            <Card className="border border-border/60">
              <CardContent className="p-6">
                <h2 className="font-bold text-foreground mb-5">{t("contact.formTitle")}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">
                        {t("contact.nameLabel")} <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t("profile.namePlaceholder")}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">
                        {t("profile.email")} <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="inquiry-type">
                      {t("contact.typeLabel")} <span className="text-destructive">*</span>
                    </Label>
                    <Select value={inquiryType} onValueChange={setInquiryType} required>
                      <SelectTrigger id="inquiry-type">
                        <SelectValue placeholder={t("contact.typePlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {INQUIRY_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="subject">{t("contact.subjectLabel")}</Label>
                    <Input
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder={t("contact.subjectPlaceholder")}
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">
                      {t("contact.messageLabel")} <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={t("contact.messagePlaceholder")}
                      rows={6}
                      required
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-right">{message.length}/2000</p>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {t("contact.privacyAgreement")}
                    <a href="/privacy" className="text-amber-600 hover:underline">{t("contact.privacyPolicy")}</a>
                    {t("contact.privacyAgreementEnd")}
                  </p>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={notifyOwner.isPending}
                  >
                    {notifyOwner.isPending ? t("common.sending") : t("contact.submit")}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
