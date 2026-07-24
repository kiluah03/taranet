"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowRight, Check, ChevronRight, Gamepad2, Gift, Globe2,
  Headphones, House, Menu, Router, ShieldCheck, Sparkles, Video, X,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { Brand, StatusPill } from "./brand";

const plans = {
  residential: [
    { name: "Fibre 500", speed: "500/100", price: 85, note: "Everything your whānau needs.", featured: false },
    { name: "Fibre Max 1G", speed: "950/500", price: 99, note: "Maximum speed. Zero compromise.", featured: true },
  ],
  business: [
    { name: "Bayanihan Business", speed: "500/500", price: 129, note: "Symmetrical speed for growing teams.", featured: false },
    { name: "Business Max", speed: "950/500", price: 169, note: "Priority support and static IP.", featured: true },
  ],
};

export function HomeExperience() {
  const reduce = useReducedMotion();
  const [nav, setNav] = useState(false);
  const [segment, setSegment] = useState<keyof typeof plans>("residential");
  const [address, setAddress] = useState("");
  const [checking, setChecking] = useState(false);
  const [wizard, setWizard] = useState(false);
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState(1);
  const [router, setRouter] = useState(true);
  const [referrals, setReferrals] = useState(3);
  const [submitted, setSubmitted] = useState(false);
  const [reference, setReference] = useState("TARA-260724");

  const check = (e: FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;
    setChecking(true);
    window.setTimeout(() => { setChecking(false); setWizard(true); setStep(1); }, 750);
  };

  const savings = useMemo(() => referrals * 7, [referrals]);

  return (
    <main>
      <header className="topbar">
        <Brand />
        <nav className={nav ? "nav open" : "nav"}>
          <a href="#plans">Plans</a><a href="#network">Why TARA</a><a href="#rewards">Rewards</a>
          <Link href="/portal" className="nav-login">Customer login</Link>
          <a href="#plans" className="button button-small">Check my address <ArrowRight size={15} /></a>
        </nav>
        <button className="menu-button" onClick={() => setNav(!nav)} aria-label="Toggle menu">{nav ? <X /> : <Menu />}</button>
      </header>

      <section className="hero">
        <div className="hero-grid" />
        <div className="aurora aurora-one" /><div className="aurora aurora-two" />
        <div className="connection-line"><span /><i /><b /></div>
        <div className="hero-inner">
          <motion.div className="hero-copy" initial={reduce ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7 }}>
            <StatusPill />
            <p className="eyebrow">Aotearoa’s first Filipino ISP</p>
            <h1>Fibre that feels<br />like <span>home.</span></h1>
            <p className="hero-lead">Ultra-fast, reliable internet made for KiwiNoys. Stream, game, work, and stay close to the Philippines—without the lag.</p>
            <form className="address-check" onSubmit={check}>
              <House size={20} />
              <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Enter your New Zealand address" aria-label="New Zealand address" />
              <button disabled={checking}>{checking ? "Checking…" : "Check availability"} <ArrowRight size={17} /></button>
            </form>
            <p className="helper"><ShieldCheck size={15} /> No contracts · KiwiNoy support · Setup from $0</p>
          </motion.div>
          <motion.div className="hero-orbit" initial={reduce ? false : { opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="orbit-ring ring-a" /><div className="orbit-ring ring-b" />
            <div className="nz-node">NZ<span>Auckland</span></div>
            <div className="ph-node">PH<span>Manila</span></div>
            <div className="latency-card"><span>NZ → PH</span><strong>42<small>ms</small></strong><em>Optimised route</em></div>
          </motion.div>
        </div>
        <div className="stat-strip">
          <div><strong>1 Gbps</strong><span>Pure fibre speed</span></div>
          <div><strong>99.99%</strong><span>Network uptime</span></div>
          <div><strong>24 / 7</strong><span>KiwiNoy support</span></div>
          <div><strong>4.9 ★</strong><span>Customer love</span></div>
        </div>
      </section>

      <section id="plans" className="section plans-section">
        <div className="section-heading">
          <div><p className="eyebrow">Simple, honest pricing</p><h2>Choose your bilis.</h2><p>Premium fibre without the confusing fine print.</p></div>
          <div className="toggle">{(["residential", "business"] as const).map(x => <button key={x} className={segment === x ? "active" : ""} onClick={() => setSegment(x)}>{x}</button>)}</div>
        </div>
        <div className="plan-grid">
          {plans[segment].map((plan, i) => (
            <motion.article key={plan.name} className={`plan-card ${plan.featured ? "featured" : ""}`} whileHover={reduce ? {} : { y: -8 }}>
              {plan.featured && <div className="popular"><Sparkles size={14} /> Most sulit</div>}
              <p>{segment === "business" ? "Business fibre" : "Home fibre"}</p><h3>{plan.name}</h3>
              <div className="speed">{plan.speed}<small>Mbps</small></div>
              <p className="plan-note">{plan.note}</p>
              <div className="price"><sup>$</sup>{plan.price}<span>/mo<br />+ GST</span></div>
              <ul><li><Check /> Free standard setup</li><li><Check /> Unlimited data</li><li><Check /> 24/7 human support</li></ul>
              <button className={plan.featured ? "button full" : "button button-outline full"} onClick={() => { setSelected(i); setWizard(true); setStep(2); }}>Choose {plan.name} <ArrowRight size={16} /></button>
            </motion.article>
          ))}
        </div>
        <label className="router-addon"><div className="router-icon"><Router /></div><div><strong>Add our WiFi 6 router</strong><span>Whole-home coverage, pre-configured for you.</span></div><span className="addon-price">$10/mo</span><input type="checkbox" checked={router} onChange={e => setRouter(e.target.checked)} /></label>
      </section>

      <section id="network" className="section network-section">
        <div className="network-copy"><p className="eyebrow">Closer, even from afar</p><h2>A faster line home.</h2><p>Our optimised international routes make calls to Manila, matches with the barkada, and every “kumain ka na?” feel beautifully close.</p>
          <div className="feature-list"><div><Video /><span><strong>Crystal-clear video calls</strong>Stable 4K streaming across the Pacific.</span></div><div><Gamepad2 /><span><strong>Game without the gigil</strong>Lower latency on the routes that matter.</span></div><div><Headphones /><span><strong>Support that gets you</strong>Real people, English and Filipino friendly.</span></div></div>
        </div>
        <div className="ping-panel">
          <div className="ping-head"><span>LIVE ROUTE SIMULATION</span><span className="live"><i /> Live</span></div>
          <div className="route-map"><Globe2 /><span className="route route-1" /><span className="route route-2" /><i className="pin pin-nz">NZ</i><i className="pin pin-ph">PH</i></div>
          <div className="ping-row tara"><span>TARA.NET optimised</span><div><i style={{width:"28%"}} /></div><strong>42 ms</strong></div>
          <div className="ping-row"><span>Standard NZ broadband</span><div><i style={{width:"70%"}} /></div><strong>118 ms</strong></div>
          <p>Illustrative performance based on simulated Auckland–Manila routes.</p>
        </div>
      </section>

      <section id="rewards" className="section rewards">
        <div><p className="eyebrow">Bayanihan rewards</p><h2>Bring your barkada.<br />Lower your bill.</h2><p>Earn $7 monthly credit for every active referral. They get brilliant fibre; you both win.</p></div>
        <div className="reward-card"><Gift /><span>Your monthly credit</span><strong>${savings}<small>/mo</small></strong><input type="range" min="0" max="10" value={referrals} onChange={e => setReferrals(Number(e.target.value))} /><div className="range-label"><span>0 friends</span><b>{referrals} referral{referrals !== 1 ? "s" : ""}</b><span>10 friends</span></div><p>That’s <strong>${savings * 12}</strong> saved every year.</p></div>
      </section>

      <section className="final-cta"><div className="sun" /><p className="eyebrow">Ready when you are</p><h2>Tara, connect na.</h2><p>Join the KiwiNoys getting more from their fibre.</p><button className="button" onClick={() => setWizard(true)}>Check your address <ArrowRight /></button></section>
      <footer><Brand /><p>Fibre that feels like home.</p><div><Link href="/portal">Customer portal</Link><Link href="/admin">Admin</Link><a href="#plans">Plans</a></div><small>© 2026 TARA.NET Ltd · New Zealand</small></footer>

      <AnimatePresence>{wizard && <motion.div className="modal-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setWizard(false)}>
        <motion.div className="wizard" initial={{opacity:0, y:30, scale:.98}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:20}} onClick={e => e.stopPropagation()}>
          <button className="modal-close" onClick={() => setWizard(false)}><X /></button>
          <Brand compact />
          <div className="progress"><i style={{width:`${step / 3 * 100}%`}} /></div>
          {!submitted && <p className="step-label">STEP {step} OF 3</p>}
          {step === 1 && !submitted && <div className="wizard-body"><div className="success-icon"><Check /></div><h3>Great news—we cover your area.</h3><p>We’ll confirm the exact fibre connection during review.</p><label>Installation address<input value={address} onChange={e=>setAddress(e.target.value)} placeholder="12 Example Street, Auckland" /></label><button className="button full" onClick={() => setStep(2)}>Choose a plan <ChevronRight /></button></div>}
          {step === 2 && !submitted && <div className="wizard-body"><p className="eyebrow">Pick your bilis</p><h3>Which speed feels right?</h3>{plans[segment].map((p,i)=><button key={p.name} className={`wizard-plan ${selected===i?"selected":""}`} onClick={()=>setSelected(i)}><span><strong>{p.name}</strong><small>{p.speed} Mbps</small></span><b>${p.price}/mo</b></button>)}<label className="mini-check"><input type="checkbox" checked={router} onChange={e=>setRouter(e.target.checked)} /> Add WiFi 6 router (+$10/mo)</label><button className="button full" onClick={() => setStep(3)}>Your details <ChevronRight /></button></div>}
          {step === 3 && !submitted && <form className="wizard-body" onSubmit={async e=>{e.preventDefault();const form=new FormData(e.currentTarget);const response=await fetch("/api/applications",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({address:address||"Address pending manual review",planCode:segment==="business"?(selected?"business-max":"business-500"):(selected?"fibre-max":"fibre-500"),firstName:form.get("firstName"),lastName:form.get("lastName"),email:form.get("email"),mobile:form.get("mobile"),router})});const result=await response.json();if(response.ok){setReference(result.reference);setSubmitted(true)}}}><p className="eyebrow">Almost there</p><h3>Let’s get you connected.</h3><div className="two-fields"><label>First name<input name="firstName" required placeholder="Juan" /></label><label>Last name<input name="lastName" required placeholder="Dela Cruz" /></label></div><label>Email<input name="email" type="email" required placeholder="juan@example.nz" /></label><label>Mobile<input name="mobile" required placeholder="021 555 0123" /></label><label className="mini-check"><input type="checkbox" required /> I agree to the service terms and privacy policy.</label><button className="button full">Submit application <ArrowRight /></button></form>}
          {submitted && <div className="wizard-body complete"><div className="success-icon"><Check /></div><p className="eyebrow">Application received</p><h3>Salamat! We’ll take it from here.</h3><p>Your reference is <strong>{reference}</strong>. We’ll email the next steps within one business day.</p><Link className="button full" href="/portal">View customer portal <ArrowRight /></Link></div>}
        </motion.div>
      </motion.div>}</AnimatePresence>
    </main>
  );
}
