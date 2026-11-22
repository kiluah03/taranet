import { NextResponse } from "next/server";
import { z } from "zod";
import { generateAffiliateCode, normalizeAffiliateCode } from "../../../../lib/affiliates/code";
import { checkCsrf } from "../../../../lib/auth/csrf";
import { getServiceClient } from "../../../../lib/supabase/server";

const applySchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  preferredCode: z.string().trim().max(32).optional(),
});

const json = (body: object, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  try {
    if (!await checkCsrf(request)) {
      return json({ error: "Refresh the page and try again." }, 403);
    }
    const parsed = applySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return json({ error: "Enter your full name and a valid email address." }, 400);
    }

    const rawPreferred = parsed.data.preferredCode?.trim() || "";
    const code = rawPreferred
      ? normalizeAffiliateCode(rawPreferred)
      : generateAffiliateCode(parsed.data.name);

    if (!code) {
      return json(
        { error: "Partner codes must be 2–32 characters using letters, numbers, hyphens, or underscores." },
        400,
      );
    }

    const supabase = getServiceClient();
    if (!supabase) {
      return json({ error: "Partner applications are temporarily unavailable. Please email hello@taranet.nz." }, 503);
    }

    const { error } = await supabase.from("affiliates").insert({
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      code,
      status: "pending",
      commission_type: "fixed",
      commission_value: 5.0,
    });

    if (error) {
      if (error.code === "23505") {
        return json({ error: "That partner code is already taken. Please try another code." }, 409);
      }
      return json({ error: "Could not submit your partner application. Please try again." }, 500);
    }

    return json(
      {
        code,
        message: `Salamat! Your partner application for code ${code} has been received. Our team will review and activate it shortly.`,
      },
      201,
    );
  } catch {
    return json({ error: "Partner applications are temporarily unavailable. Please try again." }, 503);
  }
}
