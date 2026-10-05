import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  signSessionToken,
  sessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";
import { fail, handleApiError, tooManyRequests } from "@/lib/api";
import { normalizeIranMobile } from "@/lib/phone";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "نام باید حداقل ۳ کاراکتر باشد")
    .max(80, "نام بیش از حد طولانی است"),
  phone: z.string().min(1, "شماره موبایل الزامی است").max(20),
  password: z
    .string()
    .min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد")
    .max(200, "رمز عبور بیش از حد طولانی است"),
});

const ALREADY_REGISTERED = "این شماره موبایل قبلاً ثبت شده است";

export async function POST(request: Request) {
  try {
    const limit = rateLimit(
      `register:ip:${getClientIp(request)}`,
      10,
      60 * 60 * 1000
    );
    if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

    const parsed = registerSchema.safeParse(
      await request.json().catch(() => null)
    );

    if (!parsed.success) {
      return fail(400, parsed.error.issues[0]?.message || "اطلاعات نامعتبر است");
    }

    const phone = normalizeIranMobile(parsed.data.phone);
    if (!phone) return fail(400, "شماره موبایل معتبر نیست");

    const existingUser = await prisma.user.findUnique({
      where: { phone },
      select: { id: true },
    });

    if (existingUser) return fail(409, ALREADY_REGISTERED);

    const user = await prisma.user.create({
      data: {
        fullName: parsed.data.fullName,
        phone,
        passwordHash: await hashPassword(parsed.data.password),
        role: "USER",
      },
      select: { id: true, fullName: true, phone: true, role: true },
    });

    const response = NextResponse.json({
      success: true,
      message: "ثبت‌نام با موفقیت انجام شد",
      user,
    });

    response.cookies.set(
      SESSION_COOKIE_NAME,
      await signSessionToken(user),
      sessionCookieOptions
    );

    return response;
  } catch (error) {
    // Two sign-ups racing on the same phone number.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return fail(409, ALREADY_REGISTERED);
    }

    return handleApiError("POST /api/auth/register", error, "خطا در ثبت‌نام");
  }
}
