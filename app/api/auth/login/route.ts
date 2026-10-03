import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  comparePassword,
  signSessionToken,
  sessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";
import { fail, handleApiError, tooManyRequests } from "@/lib/api";
import { normalizeIranMobile } from "@/lib/phone";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const loginSchema = z.object({
  phone: z.string().min(1, "شماره موبایل الزامی است").max(20),
  password: z.string().min(1, "رمز عبور الزامی است").max(200),
});

const WINDOW_MS = 15 * 60 * 1000;
// Same answer for an unknown phone and a wrong password, so the endpoint
// cannot be used to find out which numbers are registered.
const INVALID_CREDENTIALS = "شماره موبایل یا رمز عبور اشتباه است";

export async function POST(request: Request) {
  try {
    const ipLimit = rateLimit(`login:ip:${getClientIp(request)}`, 30, WINDOW_MS);
    if (!ipLimit.allowed) return tooManyRequests(ipLimit.retryAfterSeconds);

    const parsed = loginSchema.safeParse(await request.json().catch(() => null));

    if (!parsed.success) {
      return fail(
        400,
        parsed.error.issues[0]?.message || "اطلاعات ورود نامعتبر است"
      );
    }

    const phone = normalizeIranMobile(parsed.data.phone);
    if (!phone) return fail(400, "شماره موبایل معتبر نیست");

    const phoneLimit = rateLimit(`login:phone:${phone}`, 8, WINDOW_MS);
    if (!phoneLimit.allowed) return tooManyRequests(phoneLimit.retryAfterSeconds);

    const user = await prisma.user.findUnique({
      where: { phone },
      select: {
        id: true,
        fullName: true,
        phone: true,
        passwordHash: true,
        role: true,
        isActive: true,
      },
    });

    const isPasswordValid = await comparePassword(
      parsed.data.password,
      user?.passwordHash ?? null
    );

    if (!user || !user.isActive || !isPasswordValid) {
      return fail(401, INVALID_CREDENTIALS);
    }

    const sessionUser = {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
    };

    const response = NextResponse.json({
      success: true,
      message: "ورود با موفقیت انجام شد",
      user: sessionUser,
    });

    response.cookies.set(
      SESSION_COOKIE_NAME,
      await signSessionToken(sessionUser),
      sessionCookieOptions
    );

    return response;
  } catch (error) {
    return handleApiError("POST /api/auth/login", error, "خطا در ورود به حساب");
  }
}
