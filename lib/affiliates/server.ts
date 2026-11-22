import { getServiceClient } from "../supabase/server";
import { normalizeAffiliateCode } from "./code";

export type AffiliateValidationResult =
  | { valid: true; displayName: string }
  | { valid: false };

export type AffiliateAttributionSource = "link" | "manual";

export type AffiliateRow = {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  code: string;
  status: "pending" | "active" | "suspended";
  commission_type: "fixed" | "percentage";
  commission_value: number | string;
};

export function computeAffiliateCommission(
  commissionType: "fixed" | "percentage",
  commissionValue: number | string,
  planMonthlyPriceNzd?: number | null,
): number {
  const value = Number(commissionValue);
  if (!Number.isFinite(value) || value < 0) return 0;
  if (commissionType === "fixed") return Math.round(value * 100) / 100;
  if (!planMonthlyPriceNzd || !Number.isFinite(planMonthlyPriceNzd) || planMonthlyPriceNzd <= 0) return 0;
  return Math.round(planMonthlyPriceNzd * (value / 100) * 100) / 100;
}

export function isSelfReferral(
  affiliate: Pick<AffiliateRow, "email" | "user_id">,
  referredEmail: string,
  referredUserId?: string | null,
): boolean {
  if (referredUserId && affiliate.user_id && referredUserId === affiliate.user_id) return true;
  return affiliate.email.trim().toLowerCase() === referredEmail.trim().toLowerCase();
}

export async function validateAffiliateCode(rawCode: string | null | undefined): Promise<AffiliateValidationResult> {
  const code = normalizeAffiliateCode(rawCode);
  if (!code) return { valid: false };
  const supabase = getServiceClient();
  if (!supabase) return { valid: false };

  const { data, error } = await supabase
    .from("affiliates")
    .select("name,status")
    .eq("code", code)
    .maybeSingle();

  if (error || !data || data.status !== "active") return { valid: false };
  return { valid: true, displayName: data.name };
}

export async function recordAffiliateReferral(input: {
  code?: string | null;
  cookieCode?: string | null;
  referredEmail: string;
  referredUserId?: string | null;
  applicationId?: string | null;
  planMonthlyPriceNzd?: number | null;
}): Promise<{ recorded: boolean; reason?: string }> {
  try {
    const manualCode = normalizeAffiliateCode(input.code);
    const cookieCode = normalizeAffiliateCode(input.cookieCode);
    const effectiveCode = manualCode ?? cookieCode;
    if (!effectiveCode) return { recorded: false, reason: "no_code" };

    const supabase = getServiceClient();
    if (!supabase) return { recorded: false, reason: "unconfigured" };

    const { data: affiliate, error: lookupError } = await supabase
      .from("affiliates")
      .select("id,user_id,name,email,code,status,commission_type,commission_value")
      .eq("code", effectiveCode)
      .maybeSingle<AffiliateRow>();

    if (lookupError || !affiliate || affiliate.status !== "active") {
      return { recorded: false, reason: "invalid_or_inactive" };
    }

    if (isSelfReferral(affiliate, input.referredEmail, input.referredUserId)) {
      return { recorded: false, reason: "self_referral" };
    }

    const attributionSource: AffiliateAttributionSource =
      cookieCode && effectiveCode === cookieCode ? "link" : "manual";
    const commissionAmount = computeAffiliateCommission(
      affiliate.commission_type,
      affiliate.commission_value,
      input.planMonthlyPriceNzd,
    );

    const { error: insertError } = await supabase.from("affiliate_referrals").insert({
      affiliate_id: affiliate.id,
      application_id: input.applicationId ?? null,
      referred_user_id: input.referredUserId ?? null,
      referred_email: input.referredEmail.trim().toLowerCase(),
      code_used: affiliate.code,
      status: "pending",
      commission_amount: commissionAmount,
      attribution_source: attributionSource,
    });

    if (insertError) return { recorded: false, reason: "insert_failed" };
    return { recorded: true };
  } catch {
    return { recorded: false, reason: "unexpected_error" };
  }
}
