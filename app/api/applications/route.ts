import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { AFFILIATE_COOKIE } from "../../../lib/affiliates/code";
import { recordAffiliateReferral } from "../../../lib/affiliates/server";
import { getServiceClient } from "../../../lib/supabase/server";

const applicationSchema = z.object({
  address: z.string().min(5).max(300),
  planCode: z.enum(["fibre-500", "fibre-max", "business-500", "business-max"]),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().email(),
  mobile: z.string().min(7).max(30),
  router: z.boolean().default(false),
  referralCode: z.string().trim().max(64).optional(),
});

export async function POST(request: Request) {
  const parsed = applicationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check the highlighted details." }, { status: 400 });
  const reference = `TARA-${Date.now().toString().slice(-8)}`;
  const supabase = getServiceClient();
  if (supabase) {
    const { data: inserted, error } = await supabase.from("applications").insert({
      reference, status: "pending_review", service_address: parsed.data.address,
      plan_code: parsed.data.planCode, first_name: parsed.data.firstName,
      last_name: parsed.data.lastName, email: parsed.data.email,
      mobile: parsed.data.mobile, router_addon: parsed.data.router,
    }).select("id").single();
    if (error) return NextResponse.json({ error: "We could not save your application." }, { status: 500 });

    try {
      const cookieCode = (await cookies()).get(AFFILIATE_COOKIE)?.value;
      const { data: plan } = await supabase
        .from("plans")
        .select("monthly_price_nzd")
        .eq("code", parsed.data.planCode)
        .maybeSingle();
      await recordAffiliateReferral({
        code: parsed.data.referralCode,
        cookieCode,
        referredEmail: parsed.data.email,
        applicationId: inserted?.id ?? null,
        planMonthlyPriceNzd: plan ? Number(plan.monthly_price_nzd) : null,
      });
    } catch {
      // Referral attribution errors must never block fibre applications.
    }
  }
  return NextResponse.json({ reference, status: supabase ? "saved" : "demo" }, { status: 201 });
}
