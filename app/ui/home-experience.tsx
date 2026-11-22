"use client";

import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check, ChevronRight, Feather, Heart, ShieldCheck, Sparkles, Users, Wifi } from "lucide-react";
import Image from "next/image";
import { LandingButton, LandingCard, LandingFooter, LandingHeader } from "./landing-shared";

function SunSilhouette() {
  return <span className="sun-silhouette" aria-hidden="true">
    {Array.from({ length: 8 }, (_, ray) => <span className="sun-silhouette-ray" key={ray} style={{ transform: `rotate(${ray * 45}deg)` }} />)}
  </span>;
}

const plans = [
  { code: "fibre-500", name: "Fibre 500", speed: "500 / 100", priceInclGst: "97.75", priceExGst: "$85 + GST", note: "Perfect for everyday family life.", featured: false },
  { code: "fibre-max", name: "Fibre Max 1G", speed: "950 / 500", priceInclGst: "113.85", priceExGst: "$99 + GST", note: "For busy homes that do everything.", featured: true },
];
const highlights = [
  { icon: Heart, eyebrow: "Pamilya first", title: "Connection that feels close", body: "Reliable video calls, streaming, study, and work—so the people you love never feel far away." },
  { icon: ShieldCheck, eyebrow: "Tiwala", title: "Honest Kiwi service", body: "Simple pricing, clear contracts, and friendly support from people who understand your journey." },
  { icon: Users, eyebrow: "Bayanihan", title: "Community in Aotearoa", body: "Refer your barkada and earn $5 NZD every month while helping another family feel at home." },
];

const reveal = { initial: { opacity: 0, y: 28 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-80px" }, transition: { duration: .55 } };

export function HomeExperience() {
  const reduce = useReducedMotion();

  return <main className="landing">
    <LandingHeader />
    <section className="landing-hero">
      <div className="sunburst" aria-hidden="true"><SunSilhouette /></div><div className="woven woven-one" aria-hidden="true" /><div className="woven woven-two" aria-hidden="true" />
      <div className="landing-hero-inner">
        <motion.div className="landing-hero-copy" initial={reduce ? false : { opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65 }}>
          <motion.div className="family-badge" animate={reduce ? {} : { y: [0, -4, 0] }} transition={{ duration: 4, repeat: Infinity }}><span>☀</span> Serving Filipino families across NZ <b>🇵🇭 🇳🇿</b></motion.div>
          <p className="landing-kicker">Fibre for our Kiwi-Filipino whānau</p>
          <h1>Stay close to home.<br /><em>Grow roots here.</em></h1>
          <p className="landing-lead">Fast, dependable New Zealand fibre made for Filipino families—to connect with loved ones, chase big dreams, and feel at home in Aotearoa.</p>
          <div className="hero-actions"><LandingButton href="#plans" tone="light">See family plans</LandingButton></div>
          <div className="hero-trust"><span><Check /> Choose your terms</span><span><Check /> Unlimited data</span><span><Check /> Pamilya-friendly support</span></div>
        </motion.div>
        <motion.div className="family-scene" initial={reduce ? false : { opacity: 0, scale: .94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .8, delay: .15 }}>
          <div className="scene-sun" aria-hidden="true"><SunSilhouette /></div>
          <motion.div className="scene-fern" animate={reduce ? {} : { rotate: [-20, -16, -20], y: [0, -8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} aria-hidden="true"><Feather /></motion.div>
          <motion.div className="family-card" animate={reduce ? {} : { y: [0, -9, 0], rotate: [0, -.35, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
            <div className="family-portrait">
              <motion.div className="family-photo-motion" animate={reduce ? {} : { scale: [1, 1.045, 1], x: [0, -5, 0] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}>
                <Image src="/hero-family-v1.png" alt="A smiling Filipino family enjoying a video call together at home" fill priority sizes="(max-width: 900px) 90vw, 42vw" />
              </motion.div>
              <div className="family-photo-glow" aria-hidden="true" />
            </div>
            <div><small>CONNECTED FROM AUCKLAND</small><strong>Sunday with Lola</strong><p><i /> Manila · crystal clear</p></div>
          </motion.div>
          <motion.div className="speed-chip" animate={reduce ? {} : { y: [0, 7, 0], x: [0, -3, 0] }} transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: .5 }}><Wifi /><span><b>950 Mbps</b>Family-ready fibre</span></motion.div>
          <motion.div className="hero-note" animate={reduce ? {} : { y: [0, -6, 0] }} transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}><Heart /> Built with puso. Backed in NZ.</motion.div>
          <div className="signal-ring signal-ring-one" aria-hidden="true" /><div className="signal-ring signal-ring-two" aria-hidden="true" />
        </motion.div>
      </div>
    </section>

    <section className="landing-section cultural" id="why">
      <motion.div className="landing-heading" {...reveal}><p className="landing-kicker">Two homes, one strong connection</p><h2>Competitive prices, $5 NZD a month for every referral, community technical support</h2><p>Technology with warmth, service with malasakit, and a network made for the life your family is building.</p></motion.div>
      <div className="highlight-grid">{highlights.map((item, i) => <motion.div key={item.title} {...reveal} transition={{ duration: .5, delay: i * .1 }}><LandingCard><div className="feature-icon"><item.icon /></div><span>{item.eyebrow}</span><h3>{item.title}</h3><p>{item.body}</p><a href="#plans">Learn more <ChevronRight /></a></LandingCard></motion.div>)}</div>
    </section>

    <section className="connection-banner"><motion.div {...reveal}><div className="connection-copy"><h2>From “kumusta?” to “see you soon.”</h2><p>Optimised routes help your calls, games, and shared moments travel beautifully between New Zealand and the Philippines.</p></div><div className="route-visual"><div className="route-point"><b>NZ</b><span>Aotearoa</span></div><div className="route-line"><i /></div><div className="route-point gold"><b>PH</b><span>Pilipinas</span></div></div></motion.div></section>

    <section className="landing-section plans-light" id="plans">
      <motion.div className="landing-heading" {...reveal}><p className="landing-kicker">Simple, honest family plans</p><h2>Choose your bilis.</h2><p>Unlimited data, clear pricing, and room for every screen in the house.</p></motion.div>
      <div className="landing-plan-grid">{plans.map((plan, i) => <motion.div key={plan.code} {...reveal} transition={{ duration: .5, delay: i * .1 }} whileHover={reduce ? {} : { y: -6 }}><LandingCard className={plan.featured ? "plan-featured" : ""}>{plan.featured && <div className="popular"><Sparkles /> Pamilya favourite</div>}<span>HOME FIBRE</span><h3>{plan.name}</h3><div className="landing-speed">{plan.speed}<small>Mbps</small></div><p>{plan.note}</p><div className="landing-price-block"><div className="landing-price"><sup>$</sup>{plan.priceInclGst}<span>per month</span></div><p className="landing-price-gst">({plan.priceExGst})</p></div><ul><li><Check />Unlimited data</li><li><Check />Free standard connection</li><li><Check />Friendly support</li></ul><p className="landing-plan-term">Choose month-to-month or a 12-month term</p><LandingButton tone={plan.featured ? "primary" : "secondary"} href="mailto:hello@taranet.nz">Contact us <ArrowRight /></LandingButton></LandingCard></motion.div>)}</div>
    </section>

    <LandingFooter />
  </main>;
}
