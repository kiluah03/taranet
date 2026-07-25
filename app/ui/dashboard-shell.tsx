"use client";

import { Bell, CircleHelp, CreditCard, FileText, Gift, LayoutDashboard, LogOut, Menu, Network, Search, Settings, TicketCheck, Users, Wifi, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { Brand } from "./brand";

export function DashboardShell({ admin = false, children, userName, customerReference }: { admin?: boolean; children: React.ReactNode; userName?: string; customerReference?: string }) {
  const [open, setOpen] = useState(false);
  const links = admin
    ? [[LayoutDashboard,"Overview","#overview"],[Users,"Customers","#customers"],[TicketCheck,"Applications","#applications"],[FileText,"Billing","#billing"],[CircleHelp,"Support","#support"],[Network,"Service zones","#zones"],[Settings,"Audit log","#audit"]]
    : [[LayoutDashboard,"Overview","#overview"],[Wifi,"My service","#service"],[CreditCard,"Billing","#billing"],[Gift,"Bayanihan rewards","#rewards"],[CircleHelp,"Support","#support"],[Settings,"Profile","#profile"]];
  const displayName = userName || (admin ? "Ana Dela Cruz" : "Customer");
  const initials = displayName.split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase();
  return <div className="dash">
    <aside className={open ? "sidebar open" : "sidebar"}>
      <div className="side-brand"><Brand /><button onClick={()=>setOpen(false)}><X /></button></div>
      <p className="side-label">{admin ? "OPERATIONS CONSOLE" : "CUSTOMER PORTAL"}</p>
      <nav>{links.map(([Icon,label,href],i)=><Link className={i===0?"active":""} href={href as string} key={label as string} onClick={()=>setOpen(false)}><Icon size={18}/>{label as string}</Link>)}</nav>
      <div className="side-bottom"><div className="avatar">{admin?"AD":initials}</div><span><strong>{displayName}</strong><small>{admin?"Network administrator":customerReference || "Customer account"}</small></span><form action="/auth/signout" method="post"><button aria-label="Sign out"><LogOut size={17}/></button></form></div>
    </aside>
    <div className="dash-main">
      <header className="dash-header"><button className="dash-menu" onClick={()=>setOpen(true)}><Menu /></button><div><p>{admin ? "ADMIN / OVERVIEW" : "MY TARA / OVERVIEW"}</p></div><div className="dash-actions"><button aria-label="Search"><Search /></button><button aria-label="Notifications"><Bell /></button><div className="avatar">{admin?"AD":initials}</div></div></header>
      {children}
    </div>
  </div>;
}

export function Metric({ label, value, detail, tone = "blue" }: { label:string;value:string;detail:string;tone?:string }) {
  return <article className={`metric ${tone}`}><p>{label}</p><strong>{value}</strong><span>{detail}</span></article>;
}
