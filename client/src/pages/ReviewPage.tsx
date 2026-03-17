import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { Star, Lock, CheckCircle, AlertCircle, ChefHat } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useTranslation } from "react-i18next";

function StarRating({
  value,
  onChange,
  readonly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`text-2xl transition-transform ${!readonly ? "hover:scale-110 cursor-pointer" : "cursor-default"}`}
        >
          <Star
            className={`w-7 h-7 ${
              star <= (hover || value)
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function ReviewPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const bookingId = parseInt(id ?? "0");
  const [, navigate] = useLocation();
  const { isAuthenticated, user } = useAuth();

  const [overallRating, setOverallRating] = useState(5);
  const [foodRating, setFoodRating] = useState(5);
  const [hospitalityRating, setHospitalityRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: booking, isLoading } = trpc.booking.getById.useQuery(
    { id: bookingId },
    { enabled: isAuthenticated && bookingId > 0 }
  );

  const { data: bookingReviews } = trpc.review.getByBooking.useQuery(
    { bookingId },
    { enabled: isAuthenticated && bookingId > 0 }
  );
  const existingReview = bookingReviews?.find((r) => r.authorId === user?.id);

  const submitReview = trpc.review.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success(t("review.submitted"));
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">{t("booking.notFound")}</h2>
        </div>
        <Footer />
      </div>
    );
  }

  if (booking.status !== "completed") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center max-w-md">
          <AlertCircle className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t("review.notYet")}</h2>
          <p className="text-muted-foreground">{t("review.notYetDesc")}</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (existingReview || submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center max-w-md">
          <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">{t("review.submittedTitle")}</h2>
          <p className="text-muted-foreground mb-6">
            {t("review.submittedDesc")}
          </p>

          {/* Blind review explanation */}
          <div className="bg-muted rounded-xl p-4 text-left mb-6">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-sm mb-1">{t("review.blindTitle")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("review.blindDesc")}
                </p>
              </div>
            </div>
          </div>

          <Button onClick={() => navigate("/bookings")}>{t("payment.backToBookings")}</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const handleSubmit = () => {
    if (!comment.trim()) {
      toast.error(t("review.commentRequired"));
      return;
    }
    submitReview.mutate({
      bookingId,
      ratingOverall: overallRating,
      ratingCleanliness: foodRating,
      ratingCommunication: hospitalityRating,
      commentPublic: comment,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-10 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <ChefHat className="w-4 h-4" />
            <span>{t("review.experienceReview")}</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">{t("review.howWasIt")}</h1>
          <p className="text-muted-foreground">
            {t("review.howWasItDesc")}
          </p>
        </div>

        {/* Blind review notice */}
        <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-xl p-4 mb-8">
          <Lock className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-sm text-primary mb-1">{t("review.blindTitle")}</p>
            <p className="text-sm text-muted-foreground">
              {t("review.blindDescShort")}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Overall Rating */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("review.overall")}</CardTitle>
            </CardHeader>
            <CardContent>
              <StarRating value={overallRating} onChange={setOverallRating} />
              <p className="text-sm text-muted-foreground mt-2">
                {overallRating === 5 ? t("review.rating5") :
                 overallRating === 4 ? t("review.rating4") :
                 overallRating === 3 ? t("review.rating3") :
                 overallRating === 2 ? t("review.rating2") : t("review.rating1")}
              </p>
            </CardContent>
          </Card>

          {/* Food Rating */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("review.foodRating")}</CardTitle>
            </CardHeader>
            <CardContent>
              <StarRating value={foodRating} onChange={setFoodRating} />
            </CardContent>
          </Card>

          {/* Hospitality Rating */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("review.hospitalityRating")}</CardTitle>
            </CardHeader>
            <CardContent>
              <StarRating value={hospitalityRating} onChange={setHospitalityRating} />
            </CardContent>
          </Card>

          {/* Comment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("review.comment")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t("review.commentPlaceholder")}
                rows={5}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-2">{comment.length}/1000</p>
            </CardContent>
          </Card>

          <Button
            size="lg"
            className="w-full"
            onClick={handleSubmit}
            disabled={submitReview.isPending}
          >
            {submitReview.isPending ? t("common.processing") : t("review.submit")}
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
