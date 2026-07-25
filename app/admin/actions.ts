"use server";

import { revalidatePath } from "next/cache";
import { createAuthServerClient } from "../../lib/supabase/auth-server";

async function requireAdmin() {
  const supabase = await createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") throw new Error("Admin access required.");
  return { supabase, user };
}

export async function reviewApplication(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  if (!["approved", "rejected"].includes(status)) throw new Error("Invalid status.");
  const { error } = await supabase.from("applications").update({
    status, reviewed_by: user.id, reviewed_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) throw new Error(error.message);
  await supabase.from("audit_events").insert({ actor_id: user.id, action: `application.${status}`, entity_type: "application", entity_id: id });
  revalidatePath("/admin");
}

export async function activateApplication(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const id = String(formData.get("id"));
  const { data: application, error: applicationError } = await supabase.from("applications").select("*").eq("id", id).single();
  if (applicationError || !application) throw new Error("Application not found.");
  if (!application.user_id) throw new Error("Customer must create an account before activation.");
  const { data: plan } = await supabase.from("plans").select("id").eq("code", application.plan_code).single();
  if (!plan) throw new Error("Plan not found.");
  const { data: existing } = await supabase.from("customer_services").select("id").eq("application_id", id).maybeSingle();
  if (!existing) {
    const { error } = await supabase.from("customer_services").insert({
      user_id: application.user_id, plan_id: plan.id, application_id: id,
      status: "active", service_address: application.service_address,
      router_status: application.router_addon ? "provisioning" : null,
      activated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
  }
  await supabase.from("applications").update({ status: "activated", reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq("id", id);
  await supabase.from("audit_events").insert({ actor_id: user.id, action: "application.activated", entity_type: "application", entity_id: id });
  revalidatePath("/admin");
}

export async function updateTicket(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  if (!["in_progress", "waiting_customer", "resolved", "closed"].includes(status)) throw new Error("Invalid status.");
  const { error } = await supabase.from("tickets").update({ status, assigned_to: user.id, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(error.message);
  await supabase.from("audit_events").insert({ actor_id: user.id, action: `ticket.${status}`, entity_type: "ticket", entity_id: id });
  revalidatePath("/admin");
}
