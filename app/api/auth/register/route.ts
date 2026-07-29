import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  signSessionToken,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";

const registerSchema = z.object({
  fullName: z.string().min(3, "نام باید حداقل ۳ کاراکتر باشد"),
  phone: z
    .string()
    .regex(/^(\+98|0)?9\d{9}$/, "شماره موبایل معتبر نیست"),
  password: z.string().min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message || "اطلاعات نامعتبر است",
        },
        { status: 400 }
      );
    }

    const { fullName, phone, password } = parsed.data;

    const normalizedPhone = phone.trim();

    const existingUser = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "این شماره موبایل قبلاً ثبت شده است",
        },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        fullName: fullName.trim(),
        phone: normalizedPhone,
        passwordHash,
        role: "USER",
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        role: true,
      },
    });

    const token = signSessionToken({
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      message: "ثبت‌نام با موفقیت انجام شد",
      user,
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch {
    return NextResponse.json(
      { success: false, message: "خطا در ثبت‌نام" },
      { status: 500 }
    );
  }
}