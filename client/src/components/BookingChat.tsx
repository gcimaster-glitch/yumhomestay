import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, User, ShieldCheck, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface BookingChatProps {
  inquiryId?: number;
  bookingId?: number;
  onClose?: () => void;
}

type SenderRole = "guest" | "host" | "admin" | "ai";

interface ChatMessage {
  id: number;
  senderRole: SenderRole;
  content: string;
  isAiGenerated: boolean;
  isReadByGuest: boolean;
  isReadByAdmin: boolean;
  createdAt: Date;
}

const MAMA_COOK_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663381534240/FWh8vTLvqLGbaqKezVTx6W/pose05_mama_29061610.webp";

function RoleIcon({ role }: { role: SenderRole }) {
  if (role === "ai") return <img src={MAMA_COOK_URL} alt="AI" className="w-full h-full object-contain" />;
  if (role === "admin") return <ShieldCheck className="w-4 h-4 text-blue-500" />;
  return <User className="w-4 h-4 text-green-500" />;
}

function RoleLabel({ role }: { role: SenderRole }) {
  const { t } = useTranslation();
  const labels: Record<SenderRole, string> = {
    guest: t("chat.you"),
    host: t("chat.host"),
    admin: t("chat.staff"),
    ai: t("chat.aiAssistant"),
  };
  return <span className="text-xs font-medium text-muted-foreground">{labels[role]}</span>;
}

export function BookingChat({ inquiryId, bookingId, onClose }: BookingChatProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const isAdmin = user?.role === "admin";

  const { data: messages, isLoading, refetch } = trpc.chat.getMessages.useQuery(
    { inquiryId, bookingId },
    { refetchInterval: 10000 }
  );

  const sendMessage = trpc.chat.sendMessage.useMutation({
    onSuccess: () => {
      setInput("");
      refetch();
    },
    onError: (err) => toast.error(t("chat.sendFailed") + ": " + err.message),
  });

  const adminReply = trpc.chat.adminReply.useMutation({
    onSuccess: () => {
      setInput("");
      refetch();
    },
    onError: (err) => toast.error(t("chat.sendFailed") + ": " + err.message),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    if (isAdmin) {
      adminReply.mutate({ inquiryId, bookingId, content: trimmed });
    } else {
      sendMessage.mutate({ inquiryId, bookingId, content: trimmed });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isPending = sendMessage.isPending || adminReply.isPending;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">{t("chat.supportChat")}</span>
          <Badge variant="secondary" className="text-xs">
            {t("chat.aiAutoReply")}
          </Badge>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            ✕
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages && messages.length === 0 ? (
          <div className="text-center py-6 space-y-2">
            <img src={MAMA_COOK_URL} alt="Mama Cook" className="h-24 mx-auto drop-shadow-md" />
            <p className="text-sm font-semibold text-foreground">{t("chat.mamaCookGreeting")}</p>
            <p className="text-sm text-muted-foreground">
              {t("chat.mamaCookDesc")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("chat.aiMonitoring")}
            </p>
          </div>
        ) : (
          (messages as ChatMessage[])?.map((msg) => {
            const isOwn = !isAdmin && msg.senderRole === "guest";
            const isAdminMsg = msg.senderRole === "admin";
            const isAiMsg = msg.senderRole === "ai";

            return (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-2",
                  isOwn ? "flex-row-reverse" : "flex-row"
                )}
              >
                {/* Avatar */}
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 overflow-hidden",
                  isOwn ? "bg-green-100" : isAiMsg ? "bg-purple-50" : "bg-blue-100"
                )}>
                  <RoleIcon role={msg.senderRole} />
                </div>

                {/* Bubble */}
                <div className={cn("max-w-[75%] space-y-1", isOwn && "items-end flex flex-col")}>
                  <RoleLabel role={msg.senderRole} />
                  <div className={cn(
                    "rounded-2xl px-3 py-2 text-sm leading-relaxed",
                    isOwn
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : isAiMsg
                      ? "bg-purple-50 border border-purple-200 text-foreground rounded-tl-sm"
                      : isAdminMsg
                      ? "bg-blue-50 border border-blue-200 text-foreground rounded-tl-sm"
                      : "bg-muted text-foreground rounded-tl-sm"
                  )}>
                    {msg.content}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3 space-y-2 bg-background">
        <div className="flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("chat.inputPlaceholder")}
            rows={2}
            className="resize-none text-sm"
            disabled={isPending}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isPending}
            className="flex-shrink-0 h-10 w-10"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          {t("chat.aiMonitoring")}
        </p>
      </div>
    </div>
  );
}
