import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  comparePassword,
  signSessionToken,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";

const loginSchema = z.object({
  phone: z
    .string()
    .regex(/^(\+98|0)?9\d{9}$/, "شماره موبایل معتبر نیست"),
  password: z.string().min(1, "رمز عبور الزامی است"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message || "اطلاعات ورود نامعتبر است",
        },
        { status: 400 }
      );
    }

    const { phone, password } = parsed.data;
    const normalizedPhone = phone.trim();

    const user = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
      select: {
        id: true,
        fullName: true,
        phone: true,
        passwordHash: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "کاربری با این مشخصات پیدا نشد",
        },
        { status: 401 }
      );
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          message: "شماره موبایل یا رمز عبور اشتباه است",
        },
        { status: 401 }
      );
    }

    const token = signSessionToken({
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      message: "ورود با موفقیت انجام شد",
      user: {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
      },
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
      {
        success: false,
        message: "خطا در ورود به حساب",
      },
      { status: 500 }
    );
  }
}