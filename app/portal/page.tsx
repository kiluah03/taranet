import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckCircle2, CircleHelp, Clock3, CreditCard, Gift, Router, Signal, Zap } from "lucide-react";
import { DashboardShell } from "../ui/dashboard-shell";
import { createAuthServerClient } from "../../lib/supabase/auth-server";
import { ReferralButton, SupportForm } from "./portal-actions";

export const metadata: Metadata = { title: "Customer portal" };
export const dynamic = "force-dynamic";

const money = (value: number | string | null | undefined) =>
  new Intl.NumberFormat("en-NZ", { style: "currency", currency: "NZD" }).format(Number(value ?? 0));
const date = (value: string | null | undefined) =>
  value ? new Intl.DateTimeFormat("en-NZ", { dateStyle: "medium" }).format(new Date(`${value}T00:00:00`)) : "Not scheduled";

export default async function PortalPage() {
  const supabase = await createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileResult, applicationResult, serviceResult, invoiceResult, referralResult, creditResult, ticketResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("applications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("customer_services").select("*, plans(*)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("invoices").select("*").eq("user_id", user.id).order("issued_on", { ascending: false }).limit(5),
    supabase.from("referrals").select("*").eq("referrer_id", user.id).order("created_at", { ascending: false }),
    supabase.from("credits").select("amount,status").eq("user_id", user.id),
    supabase.from("tickets").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
  ]);

  const profile = profileResult.data;
  const application = applicationResult.data;
  const service = serviceResult.data;
  const invoices = invoiceResult.data ?? [];
  const referrals = referralResult.data ?? [];
  const tickets = ticketResult.data ?? [];
  const activeCredit = (creditResult.data ?? []).filter(c => c.status === "approved" || c.status === "applied").reduce((sum, c) => sum + Number(c.amount), 0);
  const nextInvoice = invoices.find(i => i.status === "unpaid") ?? invoices[0];
  const plan = service?.plans as { name?: string; download_mbps?: number; upload_mbps?: number } | null;
  const name = profile?.full_name || user.user_metadata.full_name || user.email?.split("@")[0] || "Customer";
  const firstName = name.split(" ")[0];
  const reference = application?.reference || profile?.referral_code;

  return <DashboardShell userName={name} customerReference={reference}>
    <div className="dash-content" id="overview">
      <div className="welcome"><div><p className="eyebrow">{new Intl.DateTimeFormat("en-NZ",{dateStyle:"full"}).format(new Date())}</p><h1>Kamusta, {firstName}.</h1><p>{service ? "Your fibre service at a glance." : "Your account is ready—we’ll show your service here once activated."}</p></div></div>

      <section className="service-hero" id="service"><div className="service-glow"/><div className="service-top"><span className={service?.status === "active" ? "online" : "eyebrow"}><i/> {service ? `SERVICE ${service.status.toUpperCase()}` : application ? `APPLICATION ${application.status.replaceAll("_"," ").toUpperCase()}` : "NO ACTIVE SERVICE"}</span><span>{service?.service_address || application?.service_address || "Submit an application from the home page"}</span></div>
        <div className="service-speed"><div><span>YOUR PLAN</span><strong>{plan?.name || application?.plan_code || "Not selected"}</strong><small>{service ? "Unlimited data · No fixed term" : application ? `Reference ${application.reference}` : "Choose a plan to get started"}</small></div><div className="speed-gauge"><Zap/><strong>{plan?.download_mbps ?? "—"}<small>Mbps</small></strong><span>DOWNLOAD</span></div><div className="speed-gauge"><Signal/><strong>{plan?.upload_mbps ?? "—"}<small>Mbps</small></strong><span>UPLOAD</span></div></div>
        <div className="service-foot"><span><Router/> WiFi router <b>{service?.router_status || (application?.router_addon ? "Requested" : "Not included")}</b></span><span><Signal/> Status <b>{service?.status || application?.status || "New account"}</b></span></div>
      </section>

      <div className="portal-grid">
        <article className="dash-card bill-card" id="billing"><div className="card-head"><span><CreditCard/> NEXT BILL</span></div><p>{nextInvoice ? `Due ${date(nextInvoice.due_on)}` : "No invoice issued yet"}</p><strong>{nextInvoice ? money(nextInvoice.total) : "$0.00"}</strong><span>{nextInvoice ? `Status: ${nextInvoice.status}` : "Billing begins after service activation"}</span>{activeCredit > 0 && <div className="credit-line"><Gift/><span><b>Nice one!</b> You have {money(activeCredit)} in Bayanihan credits.</span></div>}</article>
        <article className="dash-card" id="rewards"><div className="card-head"><span><Gift/> BAYANIHAN REWARDS</span></div><div className="reward-balance"><strong>{money(activeCredit)}</strong><span>available credit</span></div><div className="friends"><span>{referrals.filter(r=>r.status==="activated").length} active referrals</span></div><p className="muted">Invite friends and earn $7 monthly credit for each activated referral.</p>{profile?.referral_code && <ReferralButton code={profile.referral_code}/>}</article>
      </div>

      <div className="portal-grid lower">
        <article className="dash-card wide"><div className="card-head"><span>RECENT INVOICES</span></div>{invoices.length ? invoices.map(invoice=><div className="invoice-row" key={invoice.id}><span>{invoice.invoice_number}<small>{date(invoice.issued_on)}</small></span><b>{money(invoice.total)}</b><em className={invoice.status==="paid"?"paid":""}>{invoice.status.toUpperCase()}</em>{invoice.pdf_path?<a href={invoice.pdf_path} target="_blank">View</a>:<span/>}</div>):<p className="muted">No invoices yet.</p>}</article>
        <article className="dash-card ticket-card" id="support"><div className="card-head"><span><CircleHelp/> SUPPORT</span></div>{tickets.length ? tickets.map(ticket=><div className="ticket-status" key={ticket.id}><Clock3/><span><b>{ticket.subject}</b>{ticket.reference} · {ticket.status.replaceAll("_"," ")}</span></div>):<div className="ticket-status"><CheckCircle2/><span><b>No open tickets</b>Your support history will appear here.</span></div>}<SupportForm/></article>
      </div>

      <article className="dash-card" id="profile"><div className="card-head"><span>PROFILE</span></div><p>{name}</p><p className="muted">{profile?.email || user.email}<br/>{profile?.mobile || "No mobile number"}</p></article>
    </div>
  </DashboardShell>;
}
