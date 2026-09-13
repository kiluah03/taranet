import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { csrfCookie, sessionCookieOptions } from "../../../../lib/auth/security";
export async function GET() {
  const existing = (await cookies()).get(csrfCookie)?.value;
  const token = existing && /^[a-f0-9]{64}$/.test(existing) ? existing :
    Array.from(crypto.getRandomValues(new Uint8Array(32)), n => n.toString(16).padStart(2, "0")).join("");
  const response = NextResponse.json({ token }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(csrfCookie, token, { ...sessionCookieOptions(), maxAge: 3600 });
  return response;
}
