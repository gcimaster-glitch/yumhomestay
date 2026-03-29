import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { adminRouter } from "./routers/admin";
import { bookingRouter } from "./routers/booking";
import { cookingSchoolRouter } from "./routers/cookingSchool";
import { stripeRouter } from "./routers/stripe";
import { experienceRouter } from "./routers/experience";
import { hostRouter } from "./routers/host";
import { messageRouter } from "./routers/message";
import { paymentRouter } from "./routers/payment";
import { reviewRouter } from "./routers/review";
import { userRouter } from "./routers/user";
import { availabilityRouter } from "./routers/availability";
import { troubleRouter } from "./routers/trouble";
import { inquiryRouter } from "./routers/inquiry";
import { chatRouter } from "./routers/chat";
import { leadRouter } from "./routers/lead";
import { contactRouter } from "./routers/contact";
import { kycRouter } from "./routers/kyc";
import { authRouter } from "./routers/auth";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    // 独自認証（メール/パスワード・Google・LINE）
    register: authRouter.registerStep1,
    loginWithEmail: authRouter.loginWithEmail,
    requestPasswordReset: authRouter.requestPasswordReset,
    resetPassword: authRouter.resetPassword,
    agreeToTerms: authRouter.agreeToTerms,
    getGoogleAuthUrl: authRouter.getGoogleAuthUrl,
    getLineAuthUrl: authRouter.getLineAuthUrl,
  }),
  user: userRouter,
  host: hostRouter,
  experience: experienceRouter,
  booking: bookingRouter,
  payment: paymentRouter,
  review: reviewRouter,
  message: messageRouter,
  admin: adminRouter,
  cookingSchool: cookingSchoolRouter,
  stripe: stripeRouter,
  availability: availabilityRouter,
  trouble: troubleRouter,
  inquiry: inquiryRouter,
  chat: chatRouter,
  lead: leadRouter,
  contact: contactRouter,
  kyc: kycRouter,
});

export type AppRouter = typeof appRouter;
