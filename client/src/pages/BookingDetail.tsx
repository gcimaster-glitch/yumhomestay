import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CalendarDays, MessageSquare, Star, Users } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, Link } from "wouter";

export default function BookingDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const { data: booking, refetch } = trpc.booking.getById.useQuery({ id: Number(id) });
  const { data: messages, refetch: refetchMessages } = trpc.message.getByBooking.useQuery({ bookingId: Number(id) }, { enabled: !!booking });
  const { data: reviews } = trpc.review.getByBooking.useQuery({ bookingId: Number(id) }, { enabled: !!booking });

  const sendMessage = trpc.message.send.useMutation({
    onSuccess: () => { setMessage(""); refetchMessages(); },
    onError: (err) => toast.error(err.message),
  });

  const cancelBooking = trpc.booking.cancel.useMutation({
    onSuccess: () => { toast.success(t("booking.cancelSuccess")); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const submitReview = trpc.review.submit.useMutation({
    onSuccess: () => { toast.success(t("review.submitted")); setReviewComment(""); },
    onError: (err) => toast.error(err.message),
  });

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
        <Footer />
      </div>
    );
  }

  const canCancel = ["pending", "confirmed"].includes(booking.status);
  const canReview = booking.status === "completed";
  const alreadyReviewed = reviews?.some((r) => r.authorId === user?.id);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="container py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/bookings">
            <Button variant="ghost" size="sm">← {t("common.back")}</Button>
          </Link>
          <h1 className="text-2xl font-bold">{t("booking.bookingNumber", { id: booking.id })}</h1>
          <Badge>{booking.status}</Badge>
        </div>

        {/* Booking info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">{t("booking.details")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-muted-foreground" />
              <span>{new Date(booking.startTime).toLocaleString()} 〜 {new Date(booking.endTime).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>{t("booking.adults")}: {booking.adultsCount} / {t("booking.children")}: {booking.childrenCount}</span>
            </div>
            <div className="border-t pt-3 space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("booking.amount")}</span>
                <span className="font-semibold">¥{booking.amountJpy.toLocaleString()}</span>
              </div>
              {booking.dietaryRestrictions && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("booking.dietary")}</span>
                  <span>{booking.dietaryRestrictions}</span>
                </div>
              )}
              {booking.specialRequests && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("booking.specialRequests")}</span>
                  <span>{booking.specialRequests}</span>
                </div>
              )}
            </div>
            {canCancel && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => cancelBooking.mutate({ id: booking.id })}
                disabled={cancelBooking.isPending}
              >
                {t("common.cancel")}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              {t("booking.messages")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {messages && messages.length > 0 ? (
                messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.senderId === user?.id ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${msg.senderId === user?.id ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                      {msg.content}
                      <div className="text-xs opacity-60 mt-1">{new Date(msg.createdAt).toLocaleTimeString()}</div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">{t("booking.noMessages")}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Textarea
                placeholder={t("booking.messagePlaceholder")}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={() => sendMessage.mutate({ bookingId: booking.id, content: message })}
                disabled={!message.trim() || sendMessage.isPending}
              >
                {t("common.send")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Review */}
        {canReview && !alreadyReviewed && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="w-4 h-4" />
                {t("review.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">{t("review.blindNotice")}</p>
              <div>
                <Label>{t("review.overall")}</Label>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => setRating(s)}>
                      <Star className={`w-6 h-6 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>{t("review.publicComment")}</Label>
                <Textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} rows={3} />
              </div>
              <Button
                onClick={() => submitReview.mutate({ bookingId: booking.id, ratingOverall: rating, commentPublic: reviewComment })}
                disabled={submitReview.isPending}
              >
                {t("review.submit")}
              </Button>
            </CardContent>
          </Card>
        )}

        {canReview && alreadyReviewed && reviews && reviews.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("experience.reviews")}</CardTitle>
            </CardHeader>
            <CardContent>
              {reviews.filter((r) => r.isPublished).map((r) => (
                <div key={r.id} className="border-b last:border-0 py-3">
                  <div className="flex gap-0.5 mb-1">
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} className={`w-4 h-4 ${s <= r.ratingOverall ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                    ))}
                  </div>
                  <p className="text-sm text-foreground">{r.commentPublic}</p>
                  <p className="text-xs text-muted-foreground mt-1">{r.authorType === "guest" ? t("common.guest") : t("common.host")}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <Footer />
    </div>
  );
}
