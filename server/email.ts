/**
 * YumHomeStay Email Service using Resend
 * Handles all transactional emails with multi-language support
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = "YumHomeStay <noreply@yumhomestay.com>";

type EmailPayload = {
  to: string | string[];
  subject: string;
  html: string;
};

async function sendEmail(payload: EmailPayload): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY not set, skipping email send");
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: Array.isArray(payload.to) ? payload.to : [payload.to],
        subject: payload.subject,
        html: payload.html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[Email] Resend error:", err);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[Email] Failed to send email:", err);
    return false;
  }
}

// ─── Email Templates ──────────────────────────────────────────────────────────

function baseTemplate(content: string, lang: string = "ja"): string {
  return `
<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>YumHomeStay</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8f9fa; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #e85d04, #f48c06); padding: 32px 40px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px; }
    .body { padding: 40px; }
    .footer { background: #f8f9fa; padding: 24px 40px; text-align: center; border-top: 1px solid #e9ecef; }
    .footer p { color: #868e96; font-size: 12px; margin: 0; }
    .btn { display: inline-block; background: #e85d04; color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; margin: 16px 0; }
    .info-box { background: #fff8f0; border: 1px solid #ffd8a8; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ffe8cc; }
    .info-row:last-child { border-bottom: none; }
    .label { color: #868e96; font-size: 14px; }
    .value { font-weight: 600; font-size: 14px; }
    h2 { color: #212529; font-size: 20px; margin-top: 0; }
    p { color: #495057; line-height: 1.7; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🍜 YumHomeStay</h1>
      <p>Authentic Japanese Home Cooking Experience</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>© 2025 YumHomeStay. All rights reserved.</p>
      <p style="margin-top:8px;">このメールに心当たりがない場合は無視してください。</p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Booking Confirmation ─────────────────────────────────────────────────────

export async function sendBookingConfirmationToGuest(params: {
  to: string;
  guestName: string;
  bookingId: number;
  experienceTitle: string;
  hostName: string;
  startTime: Date;
  guestCount: number;
  totalAmountJpy: number;
  currency: string;
  totalAmountForeign: number;
  lang?: string;
}) {
  const dateStr = params.startTime.toLocaleDateString("ja-JP", {
    year: "numeric", month: "long", day: "numeric",
    weekday: "long", hour: "2-digit", minute: "2-digit",
  });

  const content = `
    <h2>ご予約が確定しました 🎉</h2>
    <p>${params.guestName} 様、YumHomeStayのご予約ありがとうございます。</p>
    <div class="info-box">
      <div class="info-row">
        <span class="label">予約番号</span>
        <span class="value">#${params.bookingId}</span>
      </div>
      <div class="info-row">
        <span class="label">体験プログラム</span>
        <span class="value">${params.experienceTitle}</span>
      </div>
      <div class="info-row">
        <span class="label">ホスト</span>
        <span class="value">${params.hostName}</span>
      </div>
      <div class="info-row">
        <span class="label">日時</span>
        <span class="value">${dateStr}</span>
      </div>
      <div class="info-row">
        <span class="label">参加人数</span>
        <span class="value">${params.guestCount}名</span>
      </div>
      <div class="info-row">
        <span class="label">お支払い金額</span>
        <span class="value">¥${params.totalAmountJpy.toLocaleString()} (${params.currency} ${params.totalAmountForeign.toFixed(2)})</span>
      </div>
    </div>
    <p>当日の詳細（集合場所・地図・注意事項）は別途メールにてお送りします。</p>
    <p>ご不明な点がございましたら、お気軽にお問い合わせください。</p>
  `;

  return sendEmail({
    to: params.to,
    subject: `【YumHomeStay】ご予約確定 - ${params.experienceTitle}`,
    html: baseTemplate(content, params.lang ?? "ja"),
  });
}

// ─── Reminder Emails ──────────────────────────────────────────────────────────

export async function sendReminderEmail(params: {
  to: string;
  guestName: string;
  bookingId: number;
  experienceTitle: string;
  hostName: string;
  startTime: Date;
  meetingPoint: string;
  googleMapsUrl?: string;
  reminderType: "10days" | "3days" | "1day" | "morning" | "3hours";
  lang?: string;
}) {
  const l = params.lang ?? "ja";
  const isJa = l.startsWith("ja");
  const isZh = l.startsWith("zh");
  const isKo = l.startsWith("ko");

  // リマインダータイプのラベル（4言語）
  const reminderLabels: Record<string, Record<string, string>> = {
    ja: { "10days": "10日前", "3days": "3日前", "1day": "前日", "morning": "当日朝", "3hours": "3時間前" },
    en: { "10days": "10 days before", "3days": "3 days before", "1day": "Day before", "morning": "Morning of", "3hours": "3 hours before" },
    zh: { "10days": "上次前10天", "3days": "上次前3天", "1day": "前一天", "morning": "当天早上", "3hours": "3小时前" },
    ko: { "10days": "10일 전", "3days": "3일 전", "1day": "전날", "morning": "당일 아침", "3hours": "3시간 전" },
  };
  const langKey = isJa ? "ja" : isZh ? "zh" : isKo ? "ko" : "en";
  const typeLabel = reminderLabels[langKey][params.reminderType];

  const dateLocale = isJa ? "ja-JP" : isZh ? "zh-CN" : isKo ? "ko-KR" : "en-US";
  const dateStr = params.startTime.toLocaleDateString(dateLocale, {
    year: "numeric", month: "long", day: "numeric",
    weekday: "long", hour: "2-digit", minute: "2-digit",
  });

  let subject: string;
  let content: string;

  if (isJa) {
    subject = `【YumHomeStay】リマインダー（${typeLabel}）- ${params.experienceTitle}`;
    content = `
      <h2>リマインダー（${typeLabel}）</h2>
      <p>${params.guestName} 様、YumHomeStayの体験まであと少しです！</p>
      <div class="info-box">
        <div class="info-row"><span class="label">体験プログラム</span><span class="value">${params.experienceTitle}</span></div>
        <div class="info-row"><span class="label">日時</span><span class="value">${dateStr}</span></div>
        <div class="info-row"><span class="label">ホスト</span><span class="value">${params.hostName}</span></div>
        <div class="info-row"><span class="label">集合場所</span><span class="value">${params.meetingPoint}</span></div>
      </div>
      ${params.googleMapsUrl ? `<a href="${params.googleMapsUrl}" class="btn">地図を確認する</a>` : ""}
      <p>当日は時間に余裕を持ってお越しください。楽しい体験をお楽しみに！</p>
    `;
  } else if (isZh) {
    subject = `【YumHomeStay】提醒（${typeLabel}）- ${params.experienceTitle}`;
    content = `
      <h2>提醒（${typeLabel}）</h2>
      <p>亲爱的 ${params.guestName}，YumHomeStay的体验即将开始！</p>
      <div class="info-box">
        <div class="info-row"><span class="label">体验项目</span><span class="value">${params.experienceTitle}</span></div>
        <div class="info-row"><span class="label">日期时间</span><span class="value">${dateStr}</span></div>
        <div class="info-row"><span class="label">主家</span><span class="value">${params.hostName}</span></div>
        <div class="info-row"><span class="label">集合地点</span><span class="value">${params.meetingPoint}</span></div>
      </div>
      ${params.googleMapsUrl ? `<a href="${params.googleMapsUrl}" class="btn">查看地图</a>` : ""}
      <p>请提前出发，期待与您共度美好时光！</p>
    `;
  } else if (isKo) {
    subject = `【YumHomeStay】리마인더（${typeLabel}）- ${params.experienceTitle}`;
    content = `
      <h2>리마인더（${typeLabel}）</h2>
      <p>안녕하세요, ${params.guestName}님! YumHomeStay 체험이 얼마 남지 않았습니다!</p>
      <div class="info-box">
        <div class="info-row"><span class="label">체험 프로그램</span><span class="value">${params.experienceTitle}</span></div>
        <div class="info-row"><span class="label">일시</span><span class="value">${dateStr}</span></div>
        <div class="info-row"><span class="label">호스트</span><span class="value">${params.hostName}</span></div>
        <div class="info-row"><span class="label">집합 장소</span><span class="value">${params.meetingPoint}</span></div>
      </div>
      ${params.googleMapsUrl ? `<a href="${params.googleMapsUrl}" class="btn">지도 보기</a>` : ""}
      <p>시간여유를 가지고 와 주세요. 즐거운 체험을 기대해 주세요!</p>
    `;
  } else {
    subject = `[YumHomeStay] Reminder (${typeLabel}) - ${params.experienceTitle}`;
    content = `
      <h2>Reminder (${typeLabel})</h2>
      <p>Dear ${params.guestName}, your YumHomeStay experience is coming up soon!</p>
      <div class="info-box">
        <div class="info-row"><span class="label">Experience</span><span class="value">${params.experienceTitle}</span></div>
        <div class="info-row"><span class="label">Date & Time</span><span class="value">${dateStr}</span></div>
        <div class="info-row"><span class="label">Host</span><span class="value">${params.hostName}</span></div>
        <div class="info-row"><span class="label">Meeting Point</span><span class="value">${params.meetingPoint}</span></div>
      </div>
      ${params.googleMapsUrl ? `<a href="${params.googleMapsUrl}" class="btn">View Map</a>` : ""}
      <p>Please arrive with plenty of time to spare. We look forward to your visit!</p>
    `;
  }

  return sendEmail({
    to: params.to,
    subject,
    html: baseTemplate(content, l),
  });
}

// ─── Completion & Survey ──────────────────────────────────────────────────────

export async function sendCompletionEmail(params: {
  to: string;
  guestName: string;
  bookingId: number;
  experienceTitle: string;
  reviewUrl: string;
  couponCode?: string;
  lang?: string;
}) {
  const content = `
    <h2>体験が完了しました！ありがとうございました 🙏</h2>
    <p>${params.guestName} 様、本日はYumHomeStayをご利用いただきありがとうございました。</p>
    <p>素晴らしい体験はいかがでしたか？ぜひ感想をレビューとしてお聞かせください。</p>
    <a href="${params.reviewUrl}" class="btn">レビューを投稿する</a>
    ${params.couponCode ? `
    <div class="info-box" style="margin-top:24px;">
      <p style="margin:0 0 8px; font-weight:600;">次回のご利用に使える割引クーポン 🎁</p>
      <p style="margin:0; font-size:20px; font-weight:700; color:#e85d04; letter-spacing:2px;">${params.couponCode}</p>
      <p style="margin:8px 0 0; font-size:12px; color:#868e96;">次回予約時にご利用ください</p>
    </div>
    ` : ""}
    <p>またのご利用をお待ちしております。</p>
  `;

  return sendEmail({
    to: params.to,
    subject: `【YumHomeStay】体験完了 - ${params.experienceTitle}`,
    html: baseTemplate(content, params.lang ?? "ja"),
  });
}

// ─── Host Notification ────────────────────────────────────────────────────────

export async function sendHostBookingNotification(params: {
  to: string;
  hostName: string;
  bookingId: number;
  guestName: string;
  guestCountry: string;
  experienceTitle: string;
  startTime: Date;
  guestCount: number;
  hostPayoutJpy: number;
  lang?: string;
}) {
  const dateStr = params.startTime.toLocaleDateString("ja-JP", {
    year: "numeric", month: "long", day: "numeric",
    weekday: "long", hour: "2-digit", minute: "2-digit",
  });

  const content = `
    <h2>新しい予約リクエストが届きました 📬</h2>
    <p>${params.hostName} 様、新しい予約リクエストをご確認ください。</p>
    <div class="info-box">
      <div class="info-row">
        <span class="label">予約番号</span>
        <span class="value">#${params.bookingId}</span>
      </div>
      <div class="info-row">
        <span class="label">体験プログラム</span>
        <span class="value">${params.experienceTitle}</span>
      </div>
      <div class="info-row">
        <span class="label">ゲスト</span>
        <span class="value">${params.guestName}（${params.guestCountry}）</span>
      </div>
      <div class="info-row">
        <span class="label">日時</span>
        <span class="value">${dateStr}</span>
      </div>
      <div class="info-row">
        <span class="label">参加人数</span>
        <span class="value">${params.guestCount}名</span>
      </div>
      <div class="info-row">
        <span class="label">報酬（予定）</span>
        <span class="value">¥${params.hostPayoutJpy.toLocaleString()}</span>
      </div>
    </div>
    <p>ダッシュボードから承認または辞退をお願いします。</p>
  `;

  return sendEmail({
    to: params.to,
    subject: `【YumHomeStay】新しい予約リクエスト - ${params.experienceTitle}`,
    html: baseTemplate(content, params.lang ?? "ja"),
  });
}

// ─── Payout Notification ─────────────────────────────────────────────────────

export async function sendPayoutNotification(params: {
  to: string;
  hostName: string;
  payoutAmount: number;
  payoutDate: Date;
  bookingCount: number;
  lang?: string;
}) {
  const dateStr = params.payoutDate.toLocaleDateString("ja-JP", {
    year: "numeric", month: "long", day: "numeric",
  });

  const content = `
    <h2>報酬のお支払いのお知らせ 💰</h2>
    <p>${params.hostName} 様、今月の報酬をお振り込みしました。</p>
    <div class="info-box">
      <div class="info-row">
        <span class="label">支払い日</span>
        <span class="value">${dateStr}</span>
      </div>
      <div class="info-row">
        <span class="label">対象体験数</span>
        <span class="value">${params.bookingCount}件</span>
      </div>
      <div class="info-row">
        <span class="label">お振込金額</span>
        <span class="value">¥${params.payoutAmount.toLocaleString()}</span>
      </div>
    </div>
    <p>ご不明な点がございましたら、お問い合わせください。</p>
  `;

  return sendEmail({
    to: params.to,
    subject: `【YumHomeStay】報酬お支払いのお知らせ`,
    html: baseTemplate(content, params.lang ?? "ja"),
  });
}

// ─── Booking Cancellation ────────────────────────────────────────────────────

export async function sendCancellationEmail(params: {
  to: string;
  name: string;
  bookingId: number;
  experienceTitle: string;
  reason?: string;
  refundAmount?: number;
  lang?: string;
}) {
  const content = `
    <h2>予約がキャンセルされました</h2>
    <p>${params.name} 様、予約 #${params.bookingId}（${params.experienceTitle}）がキャンセルされました。</p>
    ${params.reason ? `<p><strong>理由：</strong>${params.reason}</p>` : ""}
    ${params.refundAmount ? `
    <div class="info-box">
      <div class="info-row">
        <span class="label">返金金額</span>
        <span class="value">¥${params.refundAmount.toLocaleString()}</span>
      </div>
    </div>
    <p>返金は5〜10営業日以内に処理されます。</p>
    ` : ""}
    <p>またのご利用をお待ちしております。</p>
  `;

  return sendEmail({
    to: params.to,
    subject: `【YumHomeStay】予約キャンセルのお知らせ - ${params.experienceTitle}`,
    html: baseTemplate(content, params.lang ?? "ja"),
  });
}

// ─── Cooking School Review Notifications ─────────────────────────────────────

export async function sendCookingSchoolApprovedEmail(params: {
  to: string;
  ownerName: string;
  schoolName: string;
  dashboardUrl: string;
  lang?: string;
}) {
  const content = `
    <h2>🎉 料理教室が承認されました！</h2>
    <p>${params.ownerName} 様、この度はYumHomeStayにご登録いただきありがとうございます。</p>
    <p>ご申請いただいた料理教室 <strong>「${params.schoolName}」</strong> の審査が完了し、<strong>承認されました</strong>。</p>
    <div class="info-box">
      <p style="margin:0 0 8px; font-weight:600;">次のステップ</p>
      <ul style="margin:0; padding-left:20px; line-height:1.8;">
        <li>ダッシュボードにログインして教室情報を充実させましょう</li>
        <li>体験プログラム（レッスン内容・料金・定員）を登録してください</li>
        <li>空き日程を設定すると、ゲストからの予約を受け付けられます</li>
      </ul>
    </div>
    <a href="${params.dashboardUrl}" class="btn">ダッシュボードを開く</a>
    <p>ご不明な点がございましたら、お気軽にお問い合わせください。</p>
    <p>YumHomeStayチーム一同、皆様のご活躍を応援しております。</p>
  `;
  return sendEmail({
    to: params.to,
    subject: `【YumHomeStay】料理教室「${params.schoolName}」が承認されました`,
    html: baseTemplate(content, params.lang ?? "ja"),
  });
}

export async function sendCookingSchoolRejectedEmail(params: {
  to: string;
  ownerName: string;
  schoolName: string;
  reason?: string;
  reapplyUrl: string;
  lang?: string;
}) {
  const content = `
    <h2>料理教室の審査結果について</h2>
    <p>${params.ownerName} 様、YumHomeStayにご申請いただきありがとうございます。</p>
    <p>誠に恐れ入りますが、ご申請いただいた料理教室 <strong>「${params.schoolName}」</strong> につきまして、今回は承認が見送りとなりました。</p>
    ${params.reason ? `
    <div class="info-box">
      <p style="margin:0 0 8px; font-weight:600;">審査担当者からのコメント</p>
      <p style="margin:0; color:#495057;">${params.reason}</p>
    </div>
    ` : ""}
    <p>必要な書類や情報をご確認・修正のうえ、再度ご申請いただくことが可能です。</p>
    <a href="${params.reapplyUrl}" class="btn">再申請する</a>
    <p>ご不明な点がございましたら、サポートまでお問い合わせください。</p>
  `;
  return sendEmail({
    to: params.to,
    subject: `【YumHomeStay】料理教室「${params.schoolName}」の審査結果について`,
    html: baseTemplate(content, params.lang ?? "ja"),
  });
}

export async function sendCookingSchoolSuspendedEmail(params: {
  to: string;
  ownerName: string;
  schoolName: string;
  reason?: string;
  contactUrl: string;
  lang?: string;
}) {
  const content = `
    <h2>料理教室の一時停止について</h2>
    <p>${params.ownerName} 様、いつもYumHomeStayをご利用いただきありがとうございます。</p>
    <p>ご登録の料理教室 <strong>「${params.schoolName}」</strong> を一時的に停止いたしました。</p>
    ${params.reason ? `
    <div class="info-box">
      <p style="margin:0 0 8px; font-weight:600;">停止理由</p>
      <p style="margin:0; color:#495057;">${params.reason}</p>
    </div>
    ` : ""}
    <p>停止期間中は新規予約の受付が停止されます。詳細についてはサポートまでお問い合わせください。</p>
    <a href="${params.contactUrl}" class="btn">サポートに問い合わせる</a>
  `;
  return sendEmail({
    to: params.to,
    subject: `【YumHomeStay】料理教室「${params.schoolName}」の一時停止について`,
    html: baseTemplate(content, params.lang ?? "ja"),
  });
}

// ─── Host Registration Emails ─────────────────────────────────────────────────

/** 申請受付メール（登録料支払い前に送信） */
export async function sendHostRegistrationReceivedEmail(params: {
  to: string;
  hostName: string;
  interviewPrefs: string;
  paymentUrl: string;
  lang?: string;
}) {
  const content = `
    <h2>ホスト登録申請を受け付けました</h2>
    <p>${params.hostName} 様、YumHomeStayへのホスト登録申請ありがとうございます。</p>
    <p>以下の内容で申請を受け付けました。</p>
    <div class="info-box">
      <div class="info-row">
        <span class="label">ZOOM面談希望日時</span>
        <span class="value" style="text-align:right; max-width:60%;">${params.interviewPrefs}</span>
      </div>
      <div class="info-row">
        <span class="label">登録料</span>
        <span class="value">¥5,000（税込）</span>
      </div>
    </div>
    <p><strong>次のステップ：</strong>登録料（¥5,000）のお支払いをお願いします。お支払い完了後、担当者よりZOOM面談の日程確定メールをお送りします。</p>
    <a href="${params.paymentUrl}" class="btn">登録料を支払う（¥5,000）</a>
    <p style="font-size:13px; color:#868e96; margin-top:16px;">
      ※ 登録料のお支払いはStripeの安全な決済ページで行われます。<br>
      ※ 審査に通過しなかった場合、登録料は全額返金いたします。
    </p>
  `;
  return sendEmail({
    to: params.to,
    subject: "【YumHomeStay】ホスト登録申請を受け付けました",
    html: baseTemplate(content, params.lang ?? "ja"),
  });
}

/** 登録料支払い完了メール */
export async function sendHostRegistrationFeeConfirmedEmail(params: {
  to: string;
  hostName: string;
  lang?: string;
}) {
  const content = `
    <h2>登録料のお支払いを確認しました</h2>
    <p>${params.hostName} 様、登録料（¥5,000）のお支払いを確認いたしました。</p>
    <div class="info-box">
      <div class="info-row">
        <span class="label">支払い金額</span>
        <span class="value">¥5,000（税込）</span>
      </div>
      <div class="info-row">
        <span class="label">ステータス</span>
        <span class="value" style="color:#2f9e44;">支払い完了</span>
      </div>
    </div>
    <p>担当者がご希望の日時をもとにZOOM面談の日程を確定し、改めてご連絡いたします。</p>
    <p><strong>登録後の流れ：</strong></p>
    <ol style="color:#495057; line-height:2;">
      <li>ZOOM面談（約30分）</li>
      <li>審査結果のご通知</li>
      <li>合格後：オンライン研修（約2時間）</li>
      <li>認定書発行 → 体験プログラム登録 → 受け入れ開始</li>
    </ol>
    <p>ご不明な点はサポートまでお問い合わせください。</p>
  `;
  return sendEmail({
    to: params.to,
    subject: "【YumHomeStay】登録料のお支払いを確認しました",
    html: baseTemplate(content, params.lang ?? "ja"),
  });
}

/** 審査承認・認定書発行メール */
export async function sendHostApprovedEmail(params: {
  to: string;
  hostName: string;
  dashboardUrl: string;
  calendarUrl: string;
  lang?: string;
}) {
  const content = `
    <h2>🎉 ホスト審査に合格しました！</h2>
    <p>${params.hostName} 様、YumHomeStayのホスト審査に合格されました。おめでとうございます！</p>
    <div class="info-box" style="background:#f0fff4; border-color:#b2f2bb;">
      <div class="info-row">
        <span class="label">ステータス</span>
        <span class="value" style="color:#2f9e44;">認定ホスト（YumHost）</span>
      </div>
      <div class="info-row">
        <span class="label">認定書</span>
        <span class="value">発行済み</span>
      </div>
    </div>
    <p>これより、YumHostとして体験プログラムの登録・ゲストの受け入れを開始できます。</p>
    <p><strong>今すぐ始めましょう：</strong></p>
    <ol style="color:#495057; line-height:2;">
      <li>ホストダッシュボードで体験プログラムを登録</li>
      <li>空き日程カレンダーに受け入れ可能な日時を登録</li>
      <li>ゲストからの予約を受け付け開始！</li>
    </ol>
    <a href="${params.dashboardUrl}" class="btn">ホストダッシュボードへ</a>
    <a href="${params.calendarUrl}" class="btn" style="background:#2f9e44; margin-left:8px;">空き日程を登録する</a>
    <p style="font-size:13px; color:#868e96; margin-top:16px;">
      ※ 報酬は末締め翌末払いでお振り込みいたします。<br>
      ※ ご不明な点はホストサポートまでお問い合わせください。
    </p>
  `;
  return sendEmail({
    to: params.to,
    subject: "【YumHomeStay】ホスト審査合格のお知らせ・認定書発行",
    html: baseTemplate(content, params.lang ?? "ja"),
  });
}

/** 審査却下メール */
export async function sendHostRejectedEmail(params: {
  to: string;
  hostName: string;
  reason?: string;
  contactUrl: string;
  lang?: string;
}) {
  const content = `
    <h2>ホスト審査結果のご連絡</h2>
    <p>${params.hostName} 様、YumHomeStayへのホスト登録申請にご応募いただき、誠にありがとうございました。</p>
    <p>慎重に審査いたしました結果、今回は登録をお断りさせていただくことになりました。</p>
    ${params.reason ? `
    <div class="info-box">
      <p style="margin:0 0 8px; font-weight:600;">審査結果の理由</p>
      <p style="margin:0; color:#495057;">${params.reason}</p>
    </div>
    ` : ""}
    <p>なお、登録料（¥5,000）は全額ご返金いたします。返金処理には5〜10営業日かかる場合があります。</p>
    <p>ご不明な点や再申請についてのご相談は、サポートまでお問い合わせください。</p>
    <a href="${params.contactUrl}" class="btn">サポートに問い合わせる</a>
  `;
  return sendEmail({
    to: params.to,
    subject: "【YumHomeStay】ホスト審査結果のご連絡",
    html: baseTemplate(content, params.lang ?? "ja"),
  });
}

// ─── Guest Inquiry Flow Emails ────────────────────────────────────────────────

/** ゲスト申込受付メール（多言語対応） */
export async function sendGuestInquiryReceivedEmail(params: {
  to: string;
  guestName: string;
  adultsCount: number;
  childrenCount?: number;
  preferredArea?: string;
  preferredDateFrom?: string;
  preferredDateTo?: string;
  lang?: string;
}) {
  const lang = params.lang ?? "ja";
  const dateRange = params.preferredDateFrom
    ? `${params.preferredDateFrom}${params.preferredDateTo ? ` - ${params.preferredDateTo}` : ""}`
    : "—";
  const guestCount = `${params.adultsCount}${lang === "ja" ? "名" : ""}${params.childrenCount ? (lang === "ja" ? ` / 子供${params.childrenCount}名` : ` / ${params.childrenCount} child(ren)`) : ""}`;

  const subjects: Record<string, string> = {
    ja: "【YumHomeStay】ホームステイ体験のお申込みを受け付けました",
    en: "[YumHomeStay] We Received Your Homestay Application",
    zh: "【YumHomeStay】我们已收到您的家庭寄宿申请",
    ko: "[YumHomeStay] 홈스테이 신청을 접수했습니다",
  };

  const bodyMap: Record<string, string> = {
    ja: `
    <h2>ホームステイ体験のお申込みを受け付けました</h2>
    <p>${params.guestName} 様、YumHomeStayへのお申込みありがとうございます。</p>
    <p>以下の内容でお申込みを受け付けました。担当スタッフが内容を確認し、3〜5営業日以内にご連絡いたします。</p>
    <div class="info-box">
      <p style="margin:0 0 8px; font-weight:600;">お申込み内容</p>
      <table style="width:100%; border-collapse:collapse;">
        <tr><td style="padding:4px 0; color:#6c757d; width:40%;">参加人数</td><td>${guestCount}</td></tr>
        <tr><td style="padding:4px 0; color:#6c757d;">希望エリア</td><td>${params.preferredArea ?? "未指定"}</td></tr>
        <tr><td style="padding:4px 0; color:#6c757d;">希望日程</td><td>${dateRange}</td></tr>
      </table>
    </div>
    <p>マッチングが完了しましたら、ホスト情報・体験プログラムの詳細をメールにてお送りします。</p>
    <p>ご不明な点はお気軽にお問い合わせください。</p>`,
    en: `
    <h2>We Received Your Homestay Application</h2>
    <p>Dear ${params.guestName}, thank you for applying to YumHomeStay.</p>
    <p>We have received your application. Our team will review it and contact you within 3–5 business days.</p>
    <div class="info-box">
      <p style="margin:0 0 8px; font-weight:600;">Your Application</p>
      <table style="width:100%; border-collapse:collapse;">
        <tr><td style="padding:4px 0; color:#6c757d; width:40%;">Guests</td><td>${guestCount}</td></tr>
        <tr><td style="padding:4px 0; color:#6c757d;">Preferred Area</td><td>${params.preferredArea ?? "Not specified"}</td></tr>
        <tr><td style="padding:4px 0; color:#6c757d;">Preferred Dates</td><td>${dateRange}</td></tr>
      </table>
    </div>
    <p>Once matched, we will send you the host details and program information by email.</p>
    <p>Please feel free to contact us if you have any questions.</p>`,
    zh: `
    <h2>我们已收到您的家庭寄宿申请</h2>
    <p>${params.guestName} 您好，感谢您申请YumHomeStay。</p>
    <p>我们已收到您的申请，工作人员将在3〜5个工作日内与您联系。</p>
    <div class="info-box">
      <p style="margin:0 0 8px; font-weight:600;">申请内容</p>
      <table style="width:100%; border-collapse:collapse;">
        <tr><td style="padding:4px 0; color:#6c757d; width:40%;">参与人数</td><td>${guestCount}</td></tr>
        <tr><td style="padding:4px 0; color:#6c757d;">希望地区</td><td>${params.preferredArea ?? "未指定"}</td></tr>
        <tr><td style="padding:4px 0; color:#6c757d;">希望日期</td><td>${dateRange}</td></tr>
      </table>
    </div>
    <p>匹配完成后，我们将通过邮件发送房东信息和体验详情。</p>
    <p>如有疑问，请随时联系我们。</p>`,
    ko: `
    <h2>홈스테이 신청을 접수했습니다</h2>
    <p>${params.guestName} 님, YumHomeStay에 신청해 주셔서 감사합니다.</p>
    <p>신청을 접수했습니다. 담당 스태프가 내용을 확인하고 3〜5영업일 이내에 연락드리겠습니다.</p>
    <div class="info-box">
      <p style="margin:0 0 8px; font-weight:600;">신청 내용</p>
      <table style="width:100%; border-collapse:collapse;">
        <tr><td style="padding:4px 0; color:#6c757d; width:40%;">참가 인원</td><td>${guestCount}</td></tr>
        <tr><td style="padding:4px 0; color:#6c757d;">희망 지역</td><td>${params.preferredArea ?? "미지정"}</td></tr>
        <tr><td style="padding:4px 0; color:#6c757d;">희망 일정</td><td>${dateRange}</td></tr>
      </table>
    </div>
    <p>매칭이 완료되면 호스트 정보와 체험 프로그램 상세 내용을 이메일로 보내드립니다.</p>
    <p>궁금한 점이 있으시면 언제든지 문의해 주세요.</p>`,
  };

  return sendEmail({
    to: params.to,
    subject: subjects[lang] ?? subjects.en,
    html: baseTemplate(bodyMap[lang] ?? bodyMap.en, lang),
  });
}

/** ゲスト申込確定通知メール（マッチング完了，多言語対応） */
export async function sendGuestInquiryConfirmedEmail(params: {
  to: string;
  guestName: string;
  hostBioEn?: string;
  hostNearestStation?: string;
  experienceTitleJa?: string;
  experienceTitleEn?: string;
  lang?: string;
}) {
  const lang = params.lang ?? "ja";
  const expTitle = lang === "ja" && params.experienceTitleJa ? params.experienceTitleJa : (params.experienceTitleEn ?? "");

  const subjects: Record<string, string> = {
    ja: "【YumHomeStay】ホームステイ体験のマッチングが確定しました",
    en: "[YumHomeStay] Your Homestay Match is Confirmed!",
    zh: "【YumHomeStay】您的家庭寄宿匹配已确定！",
    ko: "[YumHomeStay] 홈스테이 매칭이 확정되었습니다!",
  };

  const stationRow = params.hostNearestStation
    ? `<tr><td style="padding:4px 0; color:#6c757d; width:40%;">${lang === "ja" ? "最寄り駅" : lang === "zh" ? "最近车站" : lang === "ko" ? "가장 가까운 역" : "Nearest Station"}</td><td>${params.hostNearestStation}</td></tr>`
    : "";

  const bodyMap: Record<string, string> = {
    ja: `
    <h2>🎉 ホームステイ体験のマッチングが確定しました！</h2>
    <p>${params.guestName} 様、お待たせいたしました。ご希望に合うホストとのマッチングが確定しました。</p>
    ${expTitle ? `<div class="info-box"><p style="margin:0 0 8px; font-weight:600;">体験プログラム</p><table style="width:100%; border-collapse:collapse;"><tr><td style="padding:4px 0; color:#6c757d; width:40%;">プログラム名</td><td>${expTitle}</td></tr>${stationRow}</table></div>` : ""}
    <p>担当スタッフより請求リンクをお送りします。お支払い確認後、当日の詳細情報（地図・注意事項等）をお送りします。</p>
    <p>ご不明な点はお気軽にお問い合わせください。</p>`,
    en: `
    <h2>🎉 Your Homestay Match is Confirmed!</h2>
    <p>Dear ${params.guestName}, great news! We have found a perfect host for you.</p>
    ${expTitle ? `<div class="info-box"><p style="margin:0 0 8px; font-weight:600;">Your Experience</p><table style="width:100%; border-collapse:collapse;"><tr><td style="padding:4px 0; color:#6c757d; width:40%;">Program</td><td>${expTitle}</td></tr>${stationRow}</table></div>` : ""}
    <p>Our staff will send you a payment link shortly. Once payment is confirmed, we will send you the full details including directions and what to expect on the day.</p>
    <p>Please feel free to contact us if you have any questions.</p>`,
    zh: `
    <h2>🎉 您的家庭寄宿匹配已确定！</h2>
    <p>${params.guestName} 您好，我们为您找到了匹配的房东！</p>
    ${expTitle ? `<div class="info-box"><p style="margin:0 0 8px; font-weight:600;">体验详情</p><table style="width:100%; border-collapse:collapse;"><tr><td style="padding:4px 0; color:#6c757d; width:40%;">项目名称</td><td>${expTitle}</td></tr>${stationRow}</table></div>` : ""}
    <p>工作人员将尽快发送付款链接。付款确认后，我们将发送当天的详细信息（地图、注意事项等）。</p>
    <p>如有疑问，请随时联系我们。</p>`,
    ko: `
    <h2>🎉 홈스테이 매칭이 확정되었습니다!</h2>
    <p>${params.guestName} 님, 좋은 소식입니다! 완벽한 호스트를 찾았습니다.</p>
    ${expTitle ? `<div class="info-box"><p style="margin:0 0 8px; font-weight:600;">체험 정보</p><table style="width:100%; border-collapse:collapse;"><tr><td style="padding:4px 0; color:#6c757d; width:40%;">프로그램</td><td>${expTitle}</td></tr>${stationRow}</table></div>` : ""}
    <p>담당 스태프가 결제 링크를 보내드리겠습니다. 결제 확인 후 당일 상세 정보를 이메일로 보내드리겠습니다.</p>
    <p>궁금한 점이 있으시면 언제든지 문의해 주세요.</p>`,
  };

  return sendEmail({
    to: params.to,
    subject: subjects[lang] ?? subjects.en,
    html: baseTemplate(bodyMap[lang] ?? bodyMap.en, lang),
  });
}

/** ゲスト申込却下メール */
export async function sendGuestInquiryRejectedEmail(params: {
  to: string;
  guestName: string;
  rejectionReason?: string;
}) {
  const content = `
    <h2>ホームステイ体験のお申込みについて</h2>
    <p>${params.guestName} 様、YumHomeStayへのお申込みありがとうございます。</p>
    <p>誠に恐れ入りますが、今回のご希望条件に合うホストのご紹介が難しい状況となりました。</p>
    ${params.rejectionReason ? `
    <div class="info-box">
      <p style="margin:0 0 8px; font-weight:600;">理由</p>
      <p style="margin:0; color:#495057;">${params.rejectionReason}</p>
    </div>
    ` : ""}
    <p>条件を変更してのご再申込みも歓迎しております。ご不明な点はお気軽にお問い合わせください。</p>
  `;
  return sendEmail({
    to: params.to,
    subject: "【YumHomeStay】ホームステイ体験のお申込みについて",
    html: baseTemplate(content, "ja"),
  });
}

/** ゲストへ請求リンク送信メール（多言語対応） */
export async function sendGuestPaymentLinkEmail(params: {
  to: string;
  guestName: string;
  paymentLinkUrl: string;
  adultsCount: number;
  childrenCount?: number;
  lang?: string;
}) {
  const lang = params.lang ?? "ja";
  const guestCount = `${params.adultsCount}${lang === "ja" ? "名" : ""}${params.childrenCount ? (lang === "ja" ? ` / 子供${params.childrenCount}名` : ` / ${params.childrenCount} child(ren)`) : ""}`;

  const subjects: Record<string, string> = {
    ja: "【YumHomeStay】お支払いのご案内",
    en: "[YumHomeStay] Payment Instructions",
    zh: "【YumHomeStay】付款说明",
    ko: "[YumHomeStay] 결제 안내",
  };

  const bodyMap: Record<string, string> = {
    ja: `
    <h2>💳 お支払いのご案内</h2>
    <p>${params.guestName} 様、マッチングが確定しましたので、お支払いのご案内をお送りします。</p>
    <div class="info-box">
      <p style="margin:0 0 8px; font-weight:600;">参加人数</p>
      <p style="margin:0;">大人 ${guestCount}</p>
    </div>
    <p>下記のボタンよりお支払い手続きをお願いいたします。</p>
    <a href="${params.paymentLinkUrl}" class="btn">お支払いページへ</a>
    <p style="color:#6c757d; font-size:14px; margin-top:16px;">※ リンクの有効期限にご注意ください。ご不明な点はお気軽にお問い合わせください。</p>`,
    en: `
    <h2>💳 Payment Instructions</h2>
    <p>Dear ${params.guestName}, your homestay match is confirmed! Please complete the payment to finalize your booking.</p>
    <div class="info-box">
      <p style="margin:0 0 8px; font-weight:600;">Guests</p>
      <p style="margin:0;">${guestCount}</p>
    </div>
    <p>Please click the button below to proceed to the payment page.</p>
    <a href="${params.paymentLinkUrl}" class="btn">Go to Payment Page</a>
    <p style="color:#6c757d; font-size:14px; margin-top:16px;">Please note the link expiration date. Contact us if you have any questions.</p>`,
    zh: `
    <h2>💳 付款说明</h2>
    <p>${params.guestName} 您好，您的家庭寄宿匹配已确定！请完成付款以确认预订。</p>
    <div class="info-box">
      <p style="margin:0 0 8px; font-weight:600;">参与人数</p>
      <p style="margin:0;">${guestCount}</p>
    </div>
    <p>请点击下方按鈕进行付款。</p>
    <a href="${params.paymentLinkUrl}" class="btn">前往付款页面</a>
    <p style="color:#6c757d; font-size:14px; margin-top:16px;">请注意链接有效期。如有疑问，请随时联系我们。</p>`,
    ko: `
    <h2>💳 결제 안내</h2>
    <p>${params.guestName} 님, 홈스테이 매칭이 확정되었습니다! 예약을 확정하려면 결제를 완료해 주세요.</p>
    <div class="info-box">
      <p style="margin:0 0 8px; font-weight:600;">참가 인원</p>
      <p style="margin:0;">${guestCount}</p>
    </div>
    <p>아래 버튼을 클릭하여 결제 페이지로 이동하세요.</p>
    <a href="${params.paymentLinkUrl}" class="btn">결제 페이지로 이동</a>
    <p style="color:#6c757d; font-size:14px; margin-top:16px;">링크 유효기간에 주의하세요. 궁금한 점이 있으시면 언제든지 문의해 주세요.</p>`,
  };

  return sendEmail({
    to: params.to,
    subject: subjects[lang] ?? subjects.en,
    html: baseTemplate(bodyMap[lang] ?? bodyMap.en, lang),
  });
}

/** ホストへ候補ゲスト連絡メール */
export async function sendHostContactedEmail(params: {
  to: string;
  hostName: string;
  adultsCount: number;
  childrenCount?: number;
  preferredArea?: string;
  preferredDateFrom?: string;
  preferredDateTo?: string;
  originCountry?: string;
  dietaryRestrictions?: string;
}) {
  const dateRange = params.preferredDateFrom
    ? `${params.preferredDateFrom}${params.preferredDateTo ? ` 〜 ${params.preferredDateTo}` : ""}`
    : "未定";
  const content = `
    <h2>ゲストのご紹介</h2>
    <p>${params.hostName} 様、いつもYumHomeStayをご利用いただきありがとうございます。</p>
    <p>以下のゲストのご受入れが可能かどうかご確認をお願いいたします。</p>
    <div class="info-box">
      <p style="margin:0 0 8px; font-weight:600;">ゲスト情報</p>
      <table style="width:100%; border-collapse:collapse;">
        <tr><td style="padding:4px 0; color:#6c757d; width:40%;">参加人数</td><td>大人 ${params.adultsCount}名${params.childrenCount ? ` / 子供 ${params.childrenCount}名` : ""}</td></tr>
        <tr><td style="padding:4px 0; color:#6c757d;">出身国</td><td>${params.originCountry ?? "未指定"}</td></tr>
        <tr><td style="padding:4px 0; color:#6c757d;">希望日程</td><td>${dateRange}</td></tr>
        <tr><td style="padding:4px 0; color:#6c757d;">食事制限</td><td>${params.dietaryRestrictions ?? "なし"}</td></tr>
      </table>
    </div>
    <p>ご受入れ可能な場合は、担当スタッフまでご連絡ください。</p>
  `;
  return sendEmail({
    to: params.to,
    subject: "【YumHomeStay】ゲストのご紹介",
    html: baseTemplate(content, "ja"),
  });
}

export async function sendVideoCallScheduledEmail(params: {
  to: string;
  guestName: string;
  scheduledAt: Date;
  meetingUrl?: string | null;
  notes?: string | null;
  lang?: string;
}) {
  const isJa = !params.lang || params.lang === "ja";
  const dateStr = params.scheduledAt.toLocaleString(isJa ? "ja-JP" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });

  const content = isJa
    ? `
    <h2>ビデオ面談のご案内</h2>
    <p>${params.guestName} 様、YumHomeStayをご利用いただきありがとうございます。</p>
    <p>ホームステイ体験に向けたビデオ面談の日程が決まりましたのでご案内いたします。</p>
    <div class="info-box">
      <p style="margin:0 0 8px; font-weight:600;">ビデオ面談の詳細</p>
      <table style="width:100%; border-collapse:collapse;">
        <tr><td style="padding:4px 0; color:#6c757d; width:40%;">日時</td><td>${dateStr}（日本時間）</td></tr>
        ${params.meetingUrl ? `<tr><td style="padding:4px 0; color:#6c757d;">参加リンク</td><td><a href="${params.meetingUrl}" style="color:#e85d04;">${params.meetingUrl}</a></td></tr>` : ""}
        ${params.notes ? `<tr><td style="padding:4px 0; color:#6c757d;">備考</td><td>${params.notes}</td></tr>` : ""}
      </table>
    </div>
    <p>当日は時間に余裕を持ってご準備ください。ご不明な点はお気軽にお問い合わせください。</p>
    `
    : `
    <h2>Video Call Scheduled</h2>
    <p>Dear ${params.guestName}, thank you for using YumHomeStay.</p>
    <p>Your video call for the homestay experience has been scheduled.</p>
    <div class="info-box">
      <p style="margin:0 0 8px; font-weight:600;">Video Call Details</p>
      <table style="width:100%; border-collapse:collapse;">
        <tr><td style="padding:4px 0; color:#6c757d; width:40%;">Date &amp; Time</td><td>${dateStr} (JST)</td></tr>
        ${params.meetingUrl ? `<tr><td style="padding:4px 0; color:#6c757d;">Meeting Link</td><td><a href="${params.meetingUrl}" style="color:#e85d04;">${params.meetingUrl}</a></td></tr>` : ""}
        ${params.notes ? `<tr><td style="padding:4px 0; color:#6c757d;">Notes</td><td>${params.notes}</td></tr>` : ""}
      </table>
    </div>
    <p>Please be ready a few minutes before the scheduled time. Feel free to contact us if you have any questions.</p>
    `;

  return sendEmail({
    to: params.to,
    subject: isJa ? "【YumHomeStay】ビデオ面談のご案内" : "【YumHomeStay】Video Call Scheduled",
    html: baseTemplate(content, isJa ? "ja" : "en"),
  });
}

// ─── Email Verification (Email Change) ───────────────────────────────────────
export async function sendEmailVerificationEmail(params: {
  to: string;
  newEmail: string;
  verifyUrl: string;
  lang?: string;
}): Promise<boolean> {
  const { to, newEmail, verifyUrl, lang = "ja" } = params;

  const subjects: Record<string, string> = {
    ja: "【YumHomeStay】メールアドレス変更の確認",
    en: "[YumHomeStay] Confirm Your Email Address Change",
    zh: "【YumHomeStay】请确认您的邮箱地址更改",
    ko: "[YumHomeStay] 이메일 주소 변경 확인",
  };
  const subject = subjects[lang] ?? subjects.en;

  const bodyMap: Record<string, string> = {
    ja: `<h2 style="color:#2d6a4f;">メールアドレス変更の確認</h2>
    <p>YumHomeStayをご利用いただきありがとうございます。</p>
    <p>以下のメールアドレスへの変更リクエストを受け付けました：</p>
    <p style="font-size:1.1em;font-weight:bold;color:#1b4332;">${newEmail}</p>
    <p>下のボタンをクリックして、変更を確定してください。このリンクは<strong>24時間</strong>有効です。</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${verifyUrl}" style="background:#2d6a4f;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:1em;font-weight:bold;">メールアドレスを確認する</a>
    </div>
    <p style="color:#666;font-size:0.9em;">このリクエストに心当たりがない場合は、このメールを無視してください。</p>`,
    en: `<h2 style="color:#2d6a4f;">Confirm Your Email Address Change</h2>
    <p>Thank you for using YumHomeStay.</p>
    <p>We received a request to change your email address to:</p>
    <p style="font-size:1.1em;font-weight:bold;color:#1b4332;">${newEmail}</p>
    <p>Click the button below to confirm the change. This link is valid for <strong>24 hours</strong>.</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${verifyUrl}" style="background:#2d6a4f;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:1em;font-weight:bold;">Confirm Email Address</a>
    </div>
    <p style="color:#666;font-size:0.9em;">If you did not request this change, please ignore this email.</p>`,
    zh: `<h2 style="color:#2d6a4f;">请确认您的邮箱地址更改</h2>
    <p>感谢您使用YumHomeStay。</p>
    <p>我们收到了将您的邮箱地址更改为以下地址的请求：</p>
    <p style="font-size:1.1em;font-weight:bold;color:#1b4332;">${newEmail}</p>
    <p>请点击下方按钮确认更改。此链接有效期为<strong>24小时</strong>。</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${verifyUrl}" style="background:#2d6a4f;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:1em;font-weight:bold;">确认邮箱地址</a>
    </div>
    <p style="color:#666;font-size:0.9em;">如果您没有发起此请求，请忽略此邮件。</p>`,
    ko: `<h2 style="color:#2d6a4f;">이메일 주소 변경 확인</h2>
    <p>YumHomeStay를 이용해 주셔서 감사합니다.</p>
    <p>다음 이메일 주소로의 변경 요청을 받았습니다:</p>
    <p style="font-size:1.1em;font-weight:bold;color:#1b4332;">${newEmail}</p>
    <p>아래 버튼을 클릭하여 변경을 확인해 주세요. 이 링크는 <strong>24시간</strong> 동안 유효합니다.</p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${verifyUrl}" style="background:#2d6a4f;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:1em;font-weight:bold;">이메일 주소 확인</a>
    </div>
    <p style="color:#666;font-size:0.9em;">이 요청을 하지 않으셨다면 이 이메일을 무시해 주세요.</p>`,
  };

  return sendEmail({
    to,
    subject,
    html: baseTemplate(bodyMap[lang] ?? bodyMap.en, lang),
  });
}

// ─── BtoB リード向けメール ────────────────────────────────────────────────────

const LEAD_TYPE_LABEL: Record<string, string> = {
  host: "ホストファミリー",
  cooking_school: "料理教室",
  agent: "旅行代理店",
};

/** リード登録確認メール（申込者向け） */
export async function sendLeadConfirmationEmail(params: {
  to: string;
  name: string;
  type: "host" | "cooking_school" | "agent";
  accessTokenUrl?: string;
}): Promise<boolean> {
  const { to, name, type, accessTokenUrl } = params;
  const typeLabel = LEAD_TYPE_LABEL[type] ?? type;
  const subject = `【YumHomeStay】ビジネス詳細資料をお送りします（${typeLabel}向け）`;
  const businessLinkSection = accessTokenUrl ? `
    <div style="margin:28px 0;padding:20px;background:#f0faf5;border-radius:8px;border-left:4px solid #2d6a4f;">
      <p style="margin:0 0 12px;font-weight:bold;color:#2d6a4f;font-size:1.05em;">📄 ビジネス詳細資料・収益シミュレーター</p>
      <p style="margin:0 0 16px;font-size:0.95em;color:#444;">以下のボタンから、収益シミュレーター・ビジネスモデル詳細・登録フォームをご覧いただけます。</p>
      <a href="${accessTokenUrl}" style="background:#2d6a4f;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;font-size:1em;">ビジネス詳細資料を見る →</a>
      <p style="margin:12px 0 0;font-size:0.8em;color:#888;">※ このリンクはあなた専用です。第三者との共有はお控えください。</p>
    </div>` : `
    <p style="margin:16px 0;">担当者より3営業日以内にご連絡いたします。</p>`;
  const body = `
    <h2 style="color:#2d6a4f;">お問い合わせありがとうございます</h2>
    <p>${name} 様</p>
    <p>この度は YumHomeStay の<strong>${typeLabel}向けビジネスプラン</strong>にご興味をいただきありがとうございます。</p>
    ${businessLinkSection}
    <p>ご不明な点がございましたら、お気軽にお問い合わせください。</p>
    <p style="margin-top:32px;color:#666;font-size:0.9em;">
      ※ このメールは自動送信です。返信はできません。<br>
      お問い合わせは <a href="https://yumhomestay.com/contact" style="color:#2d6a4f;">こちら</a> からお願いします。
    </p>`;
  return sendEmail({ to, subject, html: baseTemplate(body, "ja") });
}

/** リード登録通知メール（オーナー向け） */
export async function sendLeadNotificationEmail(params: {
  to: string;
  lead: {
    name: string;
    company?: string | null;
    email: string;
    phone: string;
    type: string;
    prefecture?: string | null;
    nearestStation?: string | null;
    maxGuests?: number | null;
    agentRegion?: string | null;
    agentCountry?: string | null;
    q1Answer?: string | null;
    q2Answer?: string | null;
  };
}): Promise<boolean> {
  const { to, lead } = params;
  const typeLabel = LEAD_TYPE_LABEL[lead.type] ?? lead.type;
  const subject = `【YHS管理】新規リード登録：${typeLabel} / ${lead.name}`;
  const rows = [
    ["種別", typeLabel],
    ["氏名", lead.name],
    ["会社名", lead.company ?? "—"],
    ["メール", lead.email],
    ["電話", lead.phone],
    ["都道府県", lead.prefecture ?? "—"],
    ["最寄り駅", lead.nearestStation ?? "—"],
    ["最大受入人数", lead.maxGuests != null ? `${lead.maxGuests}名` : "—"],
    ["代理店エリア", lead.agentRegion ?? "—"],
    ["取扱国", lead.agentCountry ?? "—"],
    ["Q1回答", lead.q1Answer ?? "—"],
    ["Q2回答", lead.q2Answer ?? "—"],
  ];
  const tableRows = rows
    .map(([k, v]) => `<tr><td style="padding:6px 12px;font-weight:bold;background:#f0faf5;">${k}</td><td style="padding:6px 12px;">${v}</td></tr>`)
    .join("");
  const body = `
    <h2 style="color:#2d6a4f;">新規リードが登録されました</h2>
    <table style="border-collapse:collapse;width:100%;margin-top:16px;">${tableRows}</table>
    <p style="margin-top:24px;">
      <a href="https://yumhomestay.com/admin" style="background:#2d6a4f;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">管理画面でリードを確認する</a>
    </p>`;
  return sendEmail({ to, subject, html: baseTemplate(body, "ja") });
}

/** リード返信メール（担当者 → リード） */
export async function sendLeadReplyEmail(params: {
  to: string;
  name: string;
  message: string;
}): Promise<boolean> {
  const { to, name, message } = params;
  const subject = "【YumHomeStay】お問い合わせへの返信";
  const body = `
    <h2 style="color:#2d6a4f;">YumHomeStay からのご返信</h2>
    <p>${name} 様</p>
    <div style="background:#f8f9fa;border-left:4px solid #2d6a4f;padding:16px;margin:16px 0;white-space:pre-wrap;">${message}</div>
    <p>ご不明な点がございましたら、お気軽にご返信ください。</p>`;
  return sendEmail({ to, subject, html: baseTemplate(body, "ja") });
}

// ─── パスワードリセットメール ──────────────────────────────────────────────────
export async function sendPasswordResetEmail(params: {
  to: string;
  name: string;
  resetUrl: string;
}): Promise<boolean> {
  const { to, name, resetUrl } = params;
  const subject = "【YumHomeStay】パスワードリセットのご案内";
  const body = `
    <h2>パスワードリセット</h2>
    <p>${name} 様</p>
    <p>パスワードリセットのリクエストを受け付けました。<br>
    以下のボタンをクリックして、新しいパスワードを設定してください。</p>
    <p style="text-align:center;margin:32px 0;">
      <a href="${resetUrl}" class="btn">パスワードをリセットする</a>
    </p>
    <div class="info-box">
      <p style="margin:0;font-size:13px;color:#868e96;">
        このリンクは<strong>1時間</strong>で無効になります。<br>
        身に覚えのない場合は、このメールを無視してください。
      </p>
    </div>`;
  return sendEmail({ to, subject, html: baseTemplate(body, "ja") });
}

// ─── ウェルカムメール（登録完了後）──────────────────────────────────────────────
export async function sendWelcomeEmail(params: {
  to: string;
  name: string;
}): Promise<boolean> {
  const { to, name } = params;
  const subject = "【YumHomeStay】ご登録ありがとうございます";
  const body = `
    <h2>ようこそ、YumHomeStayへ！</h2>
    <p>${name} 様</p>
    <p>YumHomeStayへのご登録が完了しました。<br>
    日本のホームステイ体験を通じて、素晴らしい思い出をお作りください。</p>
    <p style="text-align:center;margin:32px 0;">
      <a href="https://www.yumhomestay.com" class="btn">サイトを見る</a>
    </p>
    <div class="info-box">
      <p style="margin:0;font-size:13px;">
        ご不明な点がございましたら、お問い合わせページからご連絡ください。
      </p>
    </div>`;
  return sendEmail({ to, subject, html: baseTemplate(body, "ja") });
}

// ─── 新規登録メール確認（仮登録トークン送信）──────────────────────────────────
export async function sendRegistrationVerificationEmail(params: {
  to: string;
  name: string;
  verifyUrl: string;
}): Promise<boolean> {
  const { to, name, verifyUrl } = params;
  const subject = "【YumHomeStay】メールアドレスの確認をお願いします";
  const body = `
    <h2>YumHomeStayへようこそ！</h2>
    <p>${name} 様</p>
    <p>ご登録ありがとうございます。<br>
    以下のボタンをクリックして、メールアドレスの確認を完了してください。</p>
    <p style="text-align:center;margin:32px 0;">
      <a href="${verifyUrl}" class="btn">メールアドレスを確認する</a>
    </p>
    <div class="info-box">
      <p style="margin:0;font-size:13px;color:#868e96;">
        このリンクは<strong>24時間</strong>で無効になります。<br>
        身に覚えのない場合は、このメールを無視してください。
      </p>
    </div>`;
  return sendEmail({ to, subject, html: baseTemplate(body, "ja") });
}
