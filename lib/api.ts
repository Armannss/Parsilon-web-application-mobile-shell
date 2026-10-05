import { NextResponse } from "next/server";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

export function fail(status: number, message: string, headers?: HeadersInit) {
  return NextResponse.json({ success: false, message }, { status, headers });
}

export const unauthorized = () => fail(401, "ابتدا وارد حساب شوید");
export const forbidden = () => fail(403, "دسترسی غیرمجاز");
export const tooManyRequests = (retryAfterSeconds: number) =>
  fail(429, "تعداد درخواست‌ها زیاد است. کمی بعد دوباره تلاش کنید.", {
    "Retry-After": String(retryAfterSeconds),
  });

/** Maps thrown errors to a response without leaking internals to the client. */
export function handleApiError(
  label: string,
  error: unknown,
  fallbackMessage: string
) {
  if (error instanceof ApiError) {
    return fail(error.status, error.message);
  }

  console.error(`${label} error:`, error);
  return fail(500, fallbackMessage);
}
