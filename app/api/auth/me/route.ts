import { NextResponse } from "next/server";
import { getCurrentUserFromCookie } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUserFromCookie();

  // 200 for visitors too: "not signed in" is a normal answer, not an error.
  return NextResponse.json(
    { success: Boolean(user), user },
    { headers: { "Cache-Control": "no-store" } }
  );
}
