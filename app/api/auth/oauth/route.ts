import { NextResponse } from "next/server";
import { checkCsrf } from "../../../../lib/auth/csrf";

// Social authentication is paused until provider credentials are configured.
export async function POST(request: Request) {
  try {
    if (!await checkCsrf(request)) return NextResponse.json({ error: "Refresh the page and try again." }, { status: 403 });
    return NextResponse.json(
      { error: "Social sign-in is currently disabled. Please use email and password." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ error: "Sign-in is temporarily unavailable. Please try again." }, { status: 503 });
  }
}
