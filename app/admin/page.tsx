import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Check, Clock3, LifeBuoy, Users } from "lucide-react";
import { DashboardShell, Metric } from "../ui/dashboard-shell";
import { createAuthServerClient } from "../../lib/supabase/auth-server";
import { activateApplication, createInvoice, createZone, reviewApplication, toggleZone, updateCustomerRole, updateService, updateTicket } from "./actions";

export const metadata: Metadata = { title: "Admin console" };
export const dynamic = "force-dynamic";

function age(value: string) {
  const minutes = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / 1440)}d ago`;
}

export default async function AdminPage() {
  const supabase = await createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");
  const { data: admin } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (admin?.role !== "admin") redirect("/portal");

  const [profilesResult, applicationsResult, servicesResult, invoicesResult, ticketsResult, auditResult, zonesResult] = await Promise.all([
    supabase.from("profiles").select("id,full_name,email,role").order("created_at", { ascending: false }),
    supabase.from("applications").select("*").order("created_at", { ascending: false }).limit(25),
    supabase.from("customer_services").select("*, profiles!customer_services_user_id_fkey(full_name,email), plans(name,code)").order("created_at", { ascending: false }),
    supabase.from("invoices").select("total,status"),
    supabase.from("tickets").select("*, profiles!tickets_user_id_fkey(full_name,email)").order("created_at", { ascending: false }).limit(15),
    supabase.from("audit_events").select("*").order("created_at", { ascending: false }).limit(8),
    supabase.from("service_zones").select("*").order("region").order("name"),
  ]);

  const profiles = profilesResult.data ?? [];
  const applications = applicationsResult.data ?? [];
  const tickets = ticketsResult.data ?? [];
  const audits = auditResult.data ?? [];
  const services = servicesResult.data ?? [];
  const zones = zonesResult.data ?? [];
  const revenue = (invoicesResult.data ?? []).filter(x => x.status === "paid").reduce((sum, x) => sum + Number(x.total), 0);
  const pending = applications.filter(x => x.status === "pending_review");
  const openTickets = tickets.filter(x => !["resolved", "closed"].includes(x.status));

  return <DashboardShell admin userName={admin.full_name} customerReference={admin.username || "Administrator"}>
    <div className="dash-content" id="overview">
      <div className="welcome"><div><p className="eyebrow">{new Intl.DateTimeFormat("en-NZ",{dateStyle:"full"}).format(new Date())}</p><h1>Operations overview</h1><p>Live customer, application, billing, and support data.</p></div></div>
      <div className="metrics">
        <Metric label="CUSTOMERS" value={String(profiles.filter(x=>x.role==="customer").length)} detail={`${services.filter(x=>x.status==="active").length} active services`}/>
        <Metric label="PAID REVENUE" value={new Intl.NumberFormat("en-NZ",{style:"currency",currency:"NZD",maximumFractionDigits:0}).format(revenue)} detail="Across recorded invoices" tone="gold"/>
        <Metric label="PENDING SIGNUPS" value={String(pending.length)} detail={`${applications.length} total applications`} tone="coral"/>
        <Metric label="SUPPORT QUEUE" value={String(openTickets.length)} detail={`${tickets.length} recent tickets`} tone="green"/>
      </div>

      <div className="admin-grid">
        <article className="dash-card signups" id="applications"><div className="card-head"><span>APPLICATIONS</span></div>
          <div className="admin-list">{applications.length ? applications.map(app =>
            <div className="admin-record" key={app.id}>
              <div><strong>{app.first_name} {app.last_name}</strong><small>{app.email} · {app.reference}</small><small>{app.plan_code} · {app.service_address}</small></div>
              <em className={app.status === "activated" ? "ready" : "review"}>{app.status.replaceAll("_"," ")}</em>
              <div className="admin-actions">
                {app.status === "pending_review" && <>
                  <form action={reviewApplication}><input type="hidden" name="id" value={app.id}/><input type="hidden" name="status" value="approved"/><button>Approve</button></form>
                  <form action={reviewApplication}><input type="hidden" name="id" value={app.id}/><input type="hidden" name="status" value="rejected"/><button>Reject</button></form>
                </>}
                {app.status === "approved" && <form action={activateApplication}><input type="hidden" name="id" value={app.id}/><button className="primary">Activate</button></form>}
              </div>
            </div>) : <p className="muted">No applications yet.</p>}</div>
        </article>

        <article className="dash-card activity"><div className="card-head"><span>RECENT ACTIVITY</span><i className="live-dot"/></div>
          {audits.length ? audits.map(event=><div key={event.id}><i className="green"><Check/></i><span><b>{event.action.replaceAll("."," ")}</b>{event.entity_type}<small>{age(event.created_at)}</small></span></div>):<p className="muted">Admin actions will appear here.</p>}
        </article>
      </div>

      <div className="admin-grid lower">
        <article className="dash-card" id="support"><div className="card-head"><span><LifeBuoy/> SUPPORT TICKETS</span></div>
          <div className="admin-list">{tickets.length ? tickets.map(ticket=><div className="admin-record" key={ticket.id}>
            <div><strong>{ticket.subject}</strong><small>{ticket.reference} · {(ticket.profiles as {full_name?:string}|null)?.full_name || "Customer"}</small><small>{age(ticket.created_at)}</small></div>
            <em className={ticket.status === "resolved" ? "ready" : "review"}>{ticket.status.replaceAll("_"," ")}</em>
            <form action={updateTicket} className="admin-actions"><input type="hidden" name="id" value={ticket.id}/><select name="status" defaultValue={ticket.status}><option value="in_progress">In progress</option><option value="waiting_customer">Waiting customer</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select><button>Update</button></form>
          </div>):<p className="muted">No support tickets.</p>}</div>
        </article>
        <article className="dash-card" id="customers"><div className="card-head"><span><Users/> CUSTOMERS & STAFF</span></div>
          {profiles.map(profile=><div className="admin-record" key={profile.id}><div><strong>{profile.full_name}</strong><small>{profile.email}</small></div><em>{profile.role}</em><form action={updateCustomerRole} className="admin-actions"><input type="hidden" name="id" value={profile.id}/><select name="role" defaultValue={profile.role}><option value="customer">Customer</option><option value="support">Support</option><option value="admin">Admin</option></select><button>Save</button></form></div>)}
        </article>
      </div>

      <div className="admin-grid" id="billing">
        <article className="dash-card"><div className="card-head"><span>CUSTOMER SERVICES</span></div>
          <div className="admin-list">{services.length ? services.map(service=><div className="admin-record" key={service.id}><div><strong>{(service.profiles as {full_name?:string}|null)?.full_name || "Customer"} · {(service.plans as {name?:string}|null)?.name || "Plan"}</strong><small>{service.service_address}</small></div><em>{service.status}</em><form action={updateService} className="admin-actions"><input type="hidden" name="id" value={service.id}/><select name="status" defaultValue={service.status}><option value="provisioning">Provisioning</option><option value="active">Active</option><option value="suspended">Suspended</option><option value="cancelled">Cancelled</option></select><button>Save</button></form></div>):<p className="muted">No services activated yet.</p>}</div>
        </article>
        <article className="dash-card"><div className="card-head"><span>CREATE INVOICE</span></div>
          <form action={createInvoice} className="admin-form"><label>Customer<select name="userId" required defaultValue=""><option value="" disabled>Select customer</option>{profiles.filter(x=>x.role==="customer").map(p=><option value={p.id} key={p.id}>{p.full_name} · {p.email}</option>)}</select></label><label>Description<input name="description" required placeholder="Monthly fibre service"/></label><label>Subtotal (NZD)<input name="subtotal" type="number" min="0.01" step="0.01" required/></label><label>Due date<input name="dueOn" type="date" required/></label><button className="button full">Create invoice</button></form>
        </article>
      </div>

      <div className="admin-grid lower" id="zones">
        <article className="dash-card"><div className="card-head"><span>SERVICE ZONES</span></div>
          <div className="admin-list">{zones.map(zone=><div className="admin-record" key={zone.id}><div><strong>{zone.name}</strong><small>{zone.region} · {(zone.postcodes as string[]).join(", ") || "No postcodes"}</small></div><em className={zone.active?"ready":"review"}>{zone.active?"active":"disabled"}</em><form action={toggleZone} className="admin-actions"><input type="hidden" name="id" value={zone.id}/><input type="hidden" name="active" value={String(!zone.active)}/><button>{zone.active?"Disable":"Enable"}</button></form></div>)}</div>
        </article>
        <article className="dash-card"><div className="card-head"><span>ADD SERVICE ZONE</span></div><form action={createZone} className="admin-form"><label>Name<input name="name" required placeholder="Central Auckland"/></label><label>Region<input name="region" required placeholder="Auckland"/></label><label>Postcodes<input name="postcodes" placeholder="1010, 1021, 1023"/></label><button className="button full">Add zone</button></form></article>
      </div>

      <article className="dash-card" id="audit"><div className="card-head"><span>AUDIT LOG</span></div>{audits.length ? audits.map(event=><div className="admin-record" key={event.id}><div><strong>{event.action.replaceAll("."," ")}</strong><small>{event.entity_type} · {event.entity_id}</small></div><em>{age(event.created_at)}</em><span/></div>):<p className="muted">No admin actions recorded yet.</p>}</article>
    </div>
  </DashboardShell>;
}
