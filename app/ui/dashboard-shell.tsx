"use client";

import { Bell, CircleHelp, CreditCard, FileText, Gift, LayoutDashboard, LogOut, Menu, Network, Search, Settings, TicketCheck, Users, Wifi, X } from "lucide-react";
import { useState } from "react";
import { Brand } from "./brand";

export function DashboardShell({ admin = false, children }: { admin?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const links = admin
    ? [[LayoutDashboard,"Overview"],[Users,"Customers"],[TicketCheck,"Applications"],[FileText,"Billing"],[CircleHelp,"Support"],[Network,"Service zones"],[Settings,"Settings"]]
    : [[LayoutDashboard,"Overview"],[Wifi,"My service"],[CreditCard,"Billing"],[Gift,"Bayanihan rewards"],[CircleHelp,"Support"],[Settings,"Profile"]];
  return <div className="dash">
    <aside className={open ? "sidebar open" : "sidebar"}>
      <div className="side-brand"><Brand /><button onClick={()=>setOpen(false)}><X /></button></div>
      <p className="side-label">{admin ? "OPERATIONS CONSOLE" : "CUSTOMER PORTAL"}</p>
      <nav>{links.map(([Icon,label],i)=><button className={i===0?"active":""} key={label as string}><Icon size={18}/>{label as string}</button>)}</nav>
      <div className="side-bottom"><div className="avatar">{admin?"AD":"JD"}</div><span><strong>{admin?"Ana Dela Cruz":"Juan Dela Cruz"}</strong><small>{admin?"Network administrator":"TARA-10482"}</small></span><LogOut size={17}/></div>
    </aside>
    <div className="dash-main">
      <header className="dash-header"><button className="dash-menu" onClick={()=>setOpen(true)}><Menu /></button><div><p>{admin ? "ADMIN / OVERVIEW" : "MY TARA / OVERVIEW"}</p></div><div className="dash-actions"><button><Search /></button><button><Bell /><i /></button><div className="avatar">{admin?"AD":"JD"}</div></div></header>
      {children}
    </div>
  </div>;
}

export function Metric({ label, value, detail, tone = "blue" }: { label:string;value:string;detail:string;tone?:string }) {
  return <article className={`metric ${tone}`}><p>{label}</p><strong>{value}</strong><span>{detail}</span></article>;
}
