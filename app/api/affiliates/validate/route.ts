import { NextResponse } from "next/server";
import { validateAffiliateCode } from "../../../../lib/affiliates/server";

export async function GET(request: Request) {
  try {
    const code = new URL(request.url).searchParams.get("code");
    const result = await validateAffiliateCode(code);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ valid: false }, { headers: { "Cache-Control": "no-store" } });
  }
}
