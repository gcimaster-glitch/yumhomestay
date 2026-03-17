import { useState } from "react";
import { Star, MessageSquare, ThumbsUp, User, Reply, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

// ─── Star Rating Input ────────────────────────────────────────────────────────
function StarInput({ value, onChange, size = "md" }: { value: number; onChange: (v: number) => void; size?: "sm" | "md" }) {
  const [hovered, setHovered] = useState(0);
  const sz = size === "sm" ? "w-5 h-5" : "w-7 h-7";
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`${sz} transition-colors ${
              star <= (hovered || value) ? "fill-amber-400 text-amber-400" : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Star Display ─────────────────────────────────────────────────────────────
export function StarDisplay({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const sz = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sz} ${star <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
        />
      ))}
    </div>
  );
}

// ─── Rating Summary Bar ───────────────────────────────────────────────────────
export function RatingSummary({ avgRating, count }: { avgRating: number; count: number }) {
  const { t } = useTranslation();
  if (count === 0) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <MessageSquare className="w-4 h-4" />
        <span>{t("review.noReviews")}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <span className="text-3xl font-bold text-foreground">{avgRating.toFixed(1)}</span>
      <div>
        <StarDisplay rating={avgRating} size="md" />
        <p className="text-sm text-muted-foreground mt-0.5">{t("review.reviewCount", { count })}</p>
      </div>
    </div>
  );
}

// ─── Single Review Card ───────────────────────────────────────────────────────
interface ReviewData {
  id: number;
  authorName: string | null;
  ratingOverall: number;
  ratingFood?: number | null;
  ratingHost?: number | null;
  ratingValue?: number | null;
  titleJa?: string | null;
  titleEn?: string | null;
  commentJa?: string | null;
  commentEn?: string | null;
  replyByHost?: string | null;
  repliedAt?: Date | string | null;
  createdAt: Date | string;
}

export function ReviewCard({
  review,
  lang = "ja",
  isHost = false,
  onReplySuccess,
}: {
  review: ReviewData;
  lang?: "ja" | "en";
  isHost?: boolean;
  onReplySuccess?: () => void;
}) {
  const { t } = useTranslation();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState(review.replyByHost ?? "");
  const [showReply, setShowReply] = useState(true);

  const title = lang === "ja" ? review.titleJa : review.titleEn;
  const comment = lang === "ja" ? review.commentJa : review.commentEn;
  const date = new Date(review.createdAt).toLocaleDateString(lang === "ja" ? "ja-JP" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const utils = trpc.useUtils();
  const replyMutation = trpc.review.hostReplyToReview.useMutation({
    onSuccess: () => {
      toast.success(t("review.replySubmitted"));
      setShowReplyForm(false);
      utils.review.getByExperience.invalidate();
      utils.review.getByCookingSchool.invalidate();
      utils.review.getMyHostReviews.invalidate();
      onReplySuccess?.();
    },
    onError: () => {
      toast.error(t("review.replyFailed"));
    },
  });

  const handleReply = () => {
    if (!replyText.trim()) return;
    replyMutation.mutate({ reviewId: review.id, reply: replyText.trim() });
  };

  return (
    <Card className="border border-border/60 hover:border-border transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">{review.authorName ?? "Anonymous"}</p>
              <p className="text-xs text-muted-foreground">{date}</p>
            </div>
          </div>
          <StarDisplay rating={review.ratingOverall} />
        </div>

        {title && <p className="font-medium text-foreground mb-1">{title}</p>}
        {comment && <p className="text-sm text-muted-foreground leading-relaxed">{comment}</p>}

        {/* Sub-ratings */}
        {(review.ratingFood || review.ratingHost || review.ratingValue) && (
          <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border/40">
            {review.ratingFood && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>{t("review.foodRating")}</span>
                <StarDisplay rating={review.ratingFood} />
              </div>
            )}
            {review.ratingHost && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>{t("review.hospitalityRating")}</span>
                <StarDisplay rating={review.ratingHost} />
              </div>
            )}
            {review.ratingValue && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>{t("review.valueRating")}</span>
                <StarDisplay rating={review.ratingValue} />
              </div>
            )}
          </div>
        )}

        {/* Host reply display */}
        {review.replyByHost && (
          <div className="mt-3 pt-3 border-t border-border/40">
            <button
              className="flex items-center gap-1.5 text-xs text-primary font-medium mb-2"
              onClick={() => setShowReply((v) => !v)}
            >
              <Reply className="w-3.5 h-3.5" />
              {t("review.hostReply")}
              {showReply ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {showReply && (
              <div className="bg-primary/5 rounded-md p-3 text-sm text-foreground leading-relaxed border-l-2 border-primary/40">
                {review.replyByHost}
              </div>
            )}
          </div>
        )}

        {/* Host reply form (only visible to host) */}
        {isHost && (
          <div className="mt-3 pt-3 border-t border-border/40">
            {!showReplyForm ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setShowReplyForm(true)}
              >
                <Reply className="w-3.5 h-3.5 mr-1" />
                {review.replyByHost ? t("review.editReply") : t("review.addReply")}
              </Button>
            ) : (
              <div className="space-y-2">
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={t("review.replyPlaceholder")}
                  rows={3}
                  maxLength={1000}
                  className="resize-none text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleReply}
                    disabled={replyMutation.isPending || !replyText.trim()}
                  >
                    {replyMutation.isPending ? t("common.processing") : t("review.submitReply")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setShowReplyForm(false); setReplyText(review.replyByHost ?? ""); }}
                  >
                    {t("common.cancel")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Review Form ──────────────────────────────────────────────────────────────
interface ReviewFormProps {
  experienceId?: number;
  cookingSchoolId?: number;
  onSuccess?: () => void;
}

function ReviewForm({ experienceId, cookingSchoolId, onSuccess }: ReviewFormProps) {
  const { t } = useTranslation();
  const [ratingOverall, setRatingOverall] = useState(0);
  const [ratingFood, setRatingFood] = useState(0);
  const [ratingHost, setRatingHost] = useState(0);
  const [ratingValue, setRatingValue] = useState(0);
  const [titleJa, setTitleJa] = useState("");
  const [commentJa, setCommentJa] = useState("");

  const utils = trpc.useUtils();
  const submitMutation = trpc.review.submitExperienceReview.useMutation({
    onSuccess: () => {
      toast.success(t("review.reviewSubmitted"));
      if (experienceId) utils.review.getByExperience.invalidate({ experienceId });
      if (cookingSchoolId) utils.review.getByCookingSchool.invalidate({ cookingSchoolId });
      onSuccess?.();
      // Reset form
      setRatingOverall(0);
      setRatingFood(0);
      setRatingHost(0);
      setRatingValue(0);
      setTitleJa("");
      setCommentJa("");
    },
    onError: (err) => {
      if (err.data?.code === "CONFLICT") {
        toast.error(t("review.alreadySubmitted"));
      } else if (err.data?.code === "UNAUTHORIZED") {
        toast.error(t("review.loginRequired"));
      } else if (err.data?.code === "FORBIDDEN") {
        toast.error(t("review.completedBookingRequired"));
      } else {
        toast.error(t("review.submitFailed"));
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ratingOverall === 0) {
      toast.error(t("review.selectRating"));
      return;
    }
    submitMutation.mutate({
      experienceId,
      cookingSchoolId,
      ratingOverall,
      ratingFood: ratingFood > 0 ? ratingFood : undefined,
      ratingHost: ratingHost > 0 ? ratingHost : undefined,
      ratingValue: ratingValue > 0 ? ratingValue : undefined,
      titleJa: titleJa || undefined,
      commentJa: commentJa || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Overall rating */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          {t("review.overall")} <span className="text-destructive">*</span>
        </label>
        <StarInput value={ratingOverall} onChange={setRatingOverall} />
      </div>

      {/* Sub-ratings */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">{t("review.foodRating")}</label>
          <StarInput value={ratingFood} onChange={setRatingFood} size="sm" />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">{t("review.hospitalityRating")}</label>
          <StarInput value={ratingHost} onChange={setRatingHost} size="sm" />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">{t("review.valueRating")}</label>
          <StarInput value={ratingValue} onChange={setRatingValue} size="sm" />
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">{t("review.titleOptional")}</label>
        <Input
          value={titleJa}
          onChange={(e) => setTitleJa(e.target.value)}
          placeholder={t("review.titlePlaceholder")}
          maxLength={255}
        />
      </div>

      {/* Comment */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">{t("review.commentOptional")}</label>
        <Textarea
          value={commentJa}
          onChange={(e) => setCommentJa(e.target.value)}
          placeholder={t("review.commentFreePlaceholder")}
          rows={4}
          maxLength={2000}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1 text-right">{commentJa.length}/2000</p>
      </div>

      <Button
        type="submit"
        disabled={submitMutation.isPending || ratingOverall === 0}
        className="w-full"
      >
        {submitMutation.isPending ? t("common.processing") : t("review.submitReview")}
      </Button>
    </form>
  );
}

// ─── Full Review Section (list + form) ───────────────────────────────────────
interface ReviewSectionProps {
  experienceId?: number;
  cookingSchoolId?: number;
  lang?: "ja" | "en";
  isHost?: boolean;
}

export function ReviewSection({ experienceId, cookingSchoolId, lang = "ja", isHost = false }: ReviewSectionProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);

  const experienceQuery = trpc.review.getByExperience.useQuery(
    { experienceId: experienceId! },
    { enabled: !!experienceId }
  );
  const cookingSchoolQuery = trpc.review.getByCookingSchool.useQuery(
    { cookingSchoolId: cookingSchoolId! },
    { enabled: !!cookingSchoolId }
  );

  const data = experienceId ? experienceQuery.data : cookingSchoolQuery.data;
  const isLoading = experienceId ? experienceQuery.isLoading : cookingSchoolQuery.isLoading;

  const reviews = data?.reviews ?? [];
  const summary = data?.summary ?? { avgRating: 0, count: 0 };

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            {t("review.reviewsTitle")}
          </h2>
          <div className="mt-2">
            <RatingSummary avgRating={summary.avgRating} count={summary.count} />
          </div>
        </div>
        {/* ゲストのみレビュー投稿ボタンを表示（ホストは返信のみ） */}
        {user && !isHost && !showForm && (
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
            <ThumbsUp className="w-4 h-4 mr-1.5" />
            {t("review.writeReview")}
          </Button>
        )}
        {!user && (
          <Badge variant="secondary" className="text-xs">
            {t("review.loginToReview")}
          </Badge>
        )}
      </div>

      {/* Review form */}
      {showForm && user && !isHost && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-5">
            <h3 className="font-semibold text-foreground mb-4">{t("review.submitReview")}</h3>
            <ReviewForm
              experienceId={experienceId}
              cookingSchoolId={cookingSchoolId}
              onSuccess={() => setShowForm(false)}
            />
            <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => setShowForm(false)}>
              {t("common.cancel")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Reviews list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{t("review.beFirst")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} lang={lang} isHost={isHost} />
          ))}
        </div>
      )}
    </section>
  );
}
