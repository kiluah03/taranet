"use server";

import { revalidatePath } from "next/cache";
import { createAuthServerClient } from "../../lib/supabase/auth-server";

async function requireAdmin() {
  const supabase = await createAuthServerClient(true);
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

export async function updateCustomerRole(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const id = String(formData.get("id"));
  const role = String(formData.get("role"));
  if (!["customer", "support", "admin"].includes(role)) throw new Error("Invalid role.");
  if (id === user.id && role !== "admin") throw new Error("You cannot remove your own admin access.");
  const { error } = await supabase.from("profiles").update({ role, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(error.message);
  await supabase.from("audit_events").insert({ actor_id: user.id, action: `profile.role.${role}`, entity_type: "profile", entity_id: id });
  revalidatePath("/admin");
}

export async function updateService(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  if (!["provisioning", "active", "suspended", "cancelled"].includes(status)) throw new Error("Invalid status.");
  const { error } = await supabase.from("customer_services").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  await supabase.from("audit_events").insert({ actor_id: user.id, action: `service.${status}`, entity_type: "customer_service", entity_id: id });
  revalidatePath("/admin");
}

export async function createInvoice(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const userId = String(formData.get("userId"));
  const subtotal = Number(formData.get("subtotal"));
  const description = String(formData.get("description"));
  const dueOn = String(formData.get("dueOn"));
  if (!userId || !description || !dueOn || !Number.isFinite(subtotal) || subtotal <= 0) throw new Error("Invalid invoice.");
  const gst = Math.round(subtotal * 0.15 * 100) / 100;
  const invoiceNumber = `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-7)}`;
  const { data: invoice, error } = await supabase.from("invoices").insert({
    user_id: userId, invoice_number: invoiceNumber, status: "unpaid",
    issued_on: new Date().toISOString().slice(0, 10), due_on: dueOn, subtotal, gst,
  }).select("id").single();
  if (error || !invoice) throw new Error(error?.message || "Invoice could not be created.");
  const { error: itemError } = await supabase.from("invoice_items").insert({ invoice_id: invoice.id, description, quantity: 1, unit_price: subtotal });
  if (itemError) throw new Error(itemError.message);
  await supabase.from("audit_events").insert({ actor_id: user.id, action: "invoice.created", entity_type: "invoice", entity_id: invoice.id });
  revalidatePath("/admin");
}

export async function createZone(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const name = String(formData.get("name"));
  const region = String(formData.get("region"));
  const postcodes = String(formData.get("postcodes")).split(",").map(x => x.trim()).filter(Boolean);
  if (!name || !region) throw new Error("Name and region are required.");
  const { data, error } = await supabase.from("service_zones").insert({ name, region, postcodes, active: true }).select("id").single();
  if (error) throw new Error(error.message);
  await supabase.from("audit_events").insert({ actor_id: user.id, action: "service_zone.created", entity_type: "service_zone", entity_id: data.id });
  revalidatePath("/admin");
}

export async function toggleZone(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const id = String(formData.get("id"));
  const active = String(formData.get("active")) === "true";
  const { error } = await supabase.from("service_zones").update({ active }).eq("id", id);
  if (error) throw new Error(error.message);
  await supabase.from("audit_events").insert({ actor_id: user.id, action: active ? "service_zone.enabled" : "service_zone.disabled", entity_type: "service_zone", entity_id: id });
  revalidatePath("/admin");
}
