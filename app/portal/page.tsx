import type { Metadata } from "next";
import { ArrowDownToLine, ArrowRight, CheckCircle2, CircleHelp, Clock3, CreditCard, Gift, MessageSquare, Router, Signal, Zap } from "lucide-react";
import { DashboardShell } from "../ui/dashboard-shell";

export const metadata: Metadata = { title: "Customer portal" };

export default function PortalPage() {
  return <DashboardShell><div className="dash-content">
    <div className="welcome"><div><p className="eyebrow">FRIDAY, 24 JULY</p><h1>Kamusta, Juan.</h1><p>Everything’s running beautifully at home.</p></div><button className="button">Get support <MessageSquare size={17}/></button></div>
    <section className="service-hero"><div className="service-glow"/><div className="service-top"><span className="online"><i/> SERVICE ONLINE</span><span>12 Maharlika Lane, Auckland</span></div><div className="service-speed"><div><span>YOUR PLAN</span><strong>Fibre Max 1G</strong><small>Unlimited data · No fixed term</small></div><div className="speed-gauge"><Zap/><strong>950<small>Mbps</small></strong><span>DOWNLOAD</span></div><div className="speed-gauge"><Signal/><strong>487<small>Mbps</small></strong><span>UPLOAD</span></div></div><div className="service-foot"><span><Router/> WiFi 6 router <b>Online</b></span><span><Signal/> Network latency <b>6 ms</b></span><button>Manage service <ArrowRight/></button></div></section>
    <div className="portal-grid">
      <article className="dash-card bill-card"><div className="card-head"><span><CreditCard/> NEXT BILL</span><button>View all</button></div><p>Due 03 August 2026</p><strong>$125.35</strong><span>Includes GST and $7 referral credit</span><div className="credit-line"><Gift/><span><b>Nice one!</b> Your Bayanihan credit saved you $7.</span></div><button className="button full">View invoice <ArrowDownToLine/></button></article>
      <article className="dash-card"><div className="card-head"><span><Gift/> BAYANIHAN REWARDS</span><button>Details</button></div><div className="reward-balance"><strong>$21</strong><span>monthly credit</span></div><div className="friends"><i>MS</i><i>AR</i><i>KL</i><span>3 active referrals</span></div><p className="muted">Invite one more friend and save another $7 every month.</p><button className="ghost-button">Copy referral link</button></article>
    </div>
    <div className="portal-grid lower">
      <article className="dash-card wide"><div className="card-head"><span>RECENT INVOICES</span><button>Billing history</button></div><div className="invoice-row"><span>INV-2026-071<small>03 Jul 2026</small></span><b>$132.35</b><em className="paid">PAID</em><button><ArrowDownToLine/></button></div><div className="invoice-row"><span>INV-2026-063<small>03 Jun 2026</small></span><b>$132.35</b><em className="paid">PAID</em><button><ArrowDownToLine/></button></div><div className="invoice-row"><span>INV-2026-055<small>03 May 2026</small></span><b>$139.35</b><em className="paid">PAID</em><button><ArrowDownToLine/></button></div></article>
      <article className="dash-card ticket-card"><div className="card-head"><span><CircleHelp/> SUPPORT</span><button>All tickets</button></div><div className="ticket-status"><CheckCircle2/><span><b>No open tickets</b>Your service looks all good.</span></div><button className="ghost-button">Start a support ticket</button><p><Clock3/> Average reply today: 4 min</p></article>
    </div>
  </div></DashboardShell>;
}
