"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check, ChevronRight, Heart, House, MapPin, MessageCircleHeart, Router, ShieldCheck, Sparkles, Star, Users, Wifi, X } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { Brand } from "./brand";
import { LandingButton, LandingCard, LandingFooter, LandingHeader } from "./landing-shared";

const plans = [
  { code:"fibre-500", name:"Fibre 500", speed:"500 / 100", price:85, note:"Perfect for everyday family life.", featured:false },
  { code:"fibre-max", name:"Fibre Max 1G", speed:"950 / 500", price:99, note:"For busy homes that do everything.", featured:true },
];
const highlights = [
  { icon:Heart, eyebrow:"Pamilya first", title:"Connection that feels close", body:"Reliable video calls, streaming, study, and work—so the people you love never feel far away." },
  { icon:ShieldCheck, eyebrow:"Tiwala", title:"Honest Kiwi service", body:"Simple pricing, no confusing contracts, and friendly support from people who understand your journey." },
  { icon:Users, eyebrow:"Bayanihan", title:"Community in Aotearoa", body:"Refer your barkada and earn monthly credits while helping another family feel at home." },
];
const stories = [
  { quote:"Our Sunday calls to Manila are finally crystal clear—even when the kids are streaming. Parang nasa tabi lang namin sila.", name:"The Santos family", place:"Auckland", initials:"MS" },
  { quote:"The setup was easy and the support team spoke to us like family. We felt looked after from day one.", name:"Paolo & Anne", place:"Wellington", initials:"PA" },
  { quote:"Fast for work, gaming, and keeping our lola connected. TARA really understands Kiwi-Filipino homes.", name:"The Reyes family", place:"Christchurch", initials:"TR" },
];

const reveal = { initial:{opacity:0,y:28}, whileInView:{opacity:1,y:0}, viewport:{once:true,margin:"-80px"}, transition:{duration:.55} };

export function HomeExperience() {
  const reduce = useReducedMotion();
  const [wizard,setWizard]=useState(false);
  const [step,setStep]=useState(1);
  const [address,setAddress]=useState("");
  const [selected,setSelected]=useState(1);
  const [router,setRouter]=useState(true);
  const [submitted,setSubmitted]=useState(false);
  const [reference,setReference]=useState("");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);

  function begin(plan=1){setSelected(plan);setStep(address?2:1);setWizard(true);setSubmitted(false);setError("");}
  function addressSubmit(e:FormEvent){e.preventDefault();if(address.trim()) begin();}

  return <main className="landing">
    <LandingHeader/>
    <section className="landing-hero">
      <div className="sunburst" aria-hidden="true"/><div className="woven woven-one" aria-hidden="true"/><div className="woven woven-two" aria-hidden="true"/>
      <div className="landing-hero-inner">
        <motion.div className="landing-hero-copy" initial={reduce?false:{opacity:0,y:25}} animate={{opacity:1,y:0}} transition={{duration:.65}}>
          <motion.div className="family-badge" animate={reduce?{}:{y:[0,-4,0]}} transition={{duration:4,repeat:Infinity}}><span>☀</span> Serving Filipino families across NZ <b>🇵🇭 🇳🇿</b></motion.div>
          <p className="landing-kicker">Fibre for our Kiwi-Filipino whānau</p>
          <h1>Stay close to home.<br/><em>Grow roots here.</em></h1>
          <p className="landing-lead">Fast, dependable New Zealand fibre made for Filipino families—to connect with loved ones, chase big dreams, and feel at home in Aotearoa.</p>
          <div className="hero-actions"><LandingButton onClick={()=>begin()}>Check your address <ArrowRight/></LandingButton><LandingButton href="#plans" tone="light">See family plans</LandingButton></div>
          <div className="hero-trust"><span><Check/> No fixed term</span><span><Check/> Unlimited data</span><span><Check/> Pamilya-friendly support</span></div>
        </motion.div>
        <motion.div className="family-scene" initial={reduce?false:{opacity:0,scale:.94}} animate={{opacity:1,scale:1}} transition={{duration:.8,delay:.15}}>
          <div className="scene-sun">☀</div><div className="scene-fern">✦</div>
          <div className="family-card"><div className="family-portrait"><span>👨‍👩‍👧‍👦</span></div><div><small>CONNECTED FROM AUCKLAND</small><strong>Sunday with Lola</strong><p><i/> Manila · crystal clear</p></div></div>
          <div className="speed-chip"><Wifi/><span><b>950 Mbps</b>Family-ready fibre</span></div>
          <div className="hero-note"><Heart/> Built with puso. Backed in NZ.</div>
        </motion.div>
      </div>
      <div className="community-strip"><span>Trusted by growing Filipino communities in</span><b>Auckland</b><i/> <b>Wellington</b><i/> <b>Christchurch</b><i/> <b>Hamilton</b></div>
    </section>

    <section className="landing-section cultural" id="why">
      <motion.div className="landing-heading" {...reveal}><p className="landing-kicker">Two homes, one strong connection</p><h2>Bayanihan in Aotearoa.</h2><p>Technology with warmth, service with malasakit, and a network made for the life your family is building.</p></motion.div>
      <div className="highlight-grid">{highlights.map((item,i)=><motion.div key={item.title} {...reveal} transition={{duration:.5,delay:i*.1}}><LandingCard><div className="feature-icon"><item.icon/></div><span>{item.eyebrow}</span><h3>{item.title}</h3><p>{item.body}</p><a href="#plans">Learn more <ChevronRight/></a></LandingCard></motion.div>)}</div>
    </section>

    <section className="connection-banner"><motion.div {...reveal}><div className="connection-copy"><p className="landing-kicker">Closer across the Pacific</p><h2>From “kumusta?” to “see you soon.”</h2><p>Optimised routes help your calls, games, and shared moments travel beautifully between New Zealand and the Philippines.</p></div><div className="route-visual"><div className="route-point"><b>NZ</b><span>Aotearoa</span></div><div className="route-line"><i/><strong>42ms</strong></div><div className="route-point gold"><b>PH</b><span>Pilipinas</span></div></div></motion.div></section>

    <section className="landing-section plans-light" id="plans">
      <motion.div className="landing-heading" {...reveal}><p className="landing-kicker">Simple, honest family plans</p><h2>Choose your bilis.</h2><p>Unlimited data, clear pricing, and room for every screen in the house.</p></motion.div>
      <div className="landing-plan-grid">{plans.map((plan,i)=><motion.div key={plan.code} {...reveal} transition={{duration:.5,delay:i*.1}} whileHover={reduce?{}:{y:-6}}><LandingCard className={plan.featured?"plan-featured":""}>{plan.featured&&<div className="popular"><Sparkles/> Pamilya favourite</div>}<span>HOME FIBRE</span><h3>{plan.name}</h3><div className="landing-speed">{plan.speed}<small>Mbps</small></div><p>{plan.note}</p><div className="landing-price"><sup>$</sup>{plan.price}<span>/ month<br/>+ GST</span></div><ul><li><Check/>Unlimited data</li><li><Check/>Free standard connection</li><li><Check/>24/7 friendly support</li></ul><LandingButton tone={plan.featured?"primary":"secondary"} onClick={()=>begin(i)}>Choose {plan.name}<ArrowRight/></LandingButton></LandingCard></motion.div>)}</div>
    </section>

    <section className="landing-section stories" id="stories">
      <motion.div className="landing-heading" {...reveal}><p className="landing-kicker">Stories from our community</p><h2>Feels like family.</h2><p>Real words from Filipino-Kiwi households finding their rhythm—and their connection—in New Zealand.</p></motion.div>
      <div className="story-grid">{stories.map((story,i)=><motion.div key={story.name} {...reveal} transition={{duration:.5,delay:i*.1}}><LandingCard><div className="stars" aria-label="5 out of 5 stars">{[1,2,3,4,5].map(x=><Star key={x}/>)}</div><blockquote>“{story.quote}”</blockquote><div className="story-person"><i>{story.initials}</i><span><b>{story.name}</b><small><MapPin/> {story.place}</small></span></div></LandingCard></motion.div>)}</div>
    </section>

    <section className="landing-cta"><div className="cta-sun">☀</div><motion.div {...reveal}><p className="landing-kicker">Ready when you are</p><h2>Tara, connect na tayo.</h2><p>Bring home a little closer—and make your Kiwi home feel even warmer.</p><LandingButton onClick={()=>begin()}>Check availability <ArrowRight/></LandingButton></motion.div></section>
    <LandingFooter/>

    <AnimatePresence>{wizard&&<motion.div className="modal-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setWizard(false)}><motion.div className="wizard landing-wizard" initial={{opacity:0,y:25}} animate={{opacity:1,y:0}} exit={{opacity:0,y:15}} onClick={e=>e.stopPropagation()}><button className="modal-close" aria-label="Close" onClick={()=>setWizard(false)}><X/></button><Brand compact/><div className="progress"><i style={{width:`${step/3*100}%`}}/></div>
      {!submitted&&<p className="step-label">STEP {step} OF 3</p>}
      {step===1&&!submitted&&<form className="wizard-body" onSubmit={addressSubmit}><House className="wizard-hero-icon"/><h3>Where should we connect your family?</h3><p>Enter your New Zealand installation address.</p><label>Service address<input value={address} onChange={e=>setAddress(e.target.value)} required placeholder="12 Example Street, Auckland"/></label><LandingButton type="submit">Choose a plan <ArrowRight/></LandingButton></form>}
      {step===2&&!submitted&&<div className="wizard-body"><p className="landing-kicker">Pick your bilis</p><h3>Choose your family plan.</h3>{plans.map((p,i)=><button key={p.code} className={`wizard-plan ${selected===i?"selected":""}`} onClick={()=>setSelected(i)}><span><strong>{p.name}</strong><small>{p.speed} Mbps</small></span><b>${p.price}/mo</b></button>)}<label className="mini-check"><input type="checkbox" checked={router} onChange={e=>setRouter(e.target.checked)}/><Router/> Add WiFi 6 router (+$10/mo)</label><LandingButton onClick={()=>setStep(3)}>Your details <ArrowRight/></LandingButton></div>}
      {step===3&&!submitted&&<form className="wizard-body" onSubmit={async e=>{e.preventDefault();setBusy(true);setError("");const form=new FormData(e.currentTarget);const response=await fetch("/api/applications",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({address,planCode:plans[selected].code,firstName:form.get("firstName"),lastName:form.get("lastName"),email:form.get("email"),mobile:form.get("mobile"),router})});const result=await response.json();if(response.ok){setReference(result.reference);setSubmitted(true)}else setError(result.error||"Please try again.");setBusy(false)}}><p className="landing-kicker">Almost there</p><h3>Tell us about your whānau.</h3><div className="two-fields"><label>First name<input name="firstName" required/></label><label>Last name<input name="lastName" required/></label></div><label>Email<input name="email" type="email" required/></label><label>Mobile<input name="mobile" required/></label><label className="mini-check"><input type="checkbox" required/> I agree to the service terms and privacy policy.</label>{error&&<p className="form-error">{error}</p>}<LandingButton type="submit">{busy?"Submitting…":"Submit application"} <ArrowRight/></LandingButton></form>}
      {submitted&&<div className="wizard-body complete"><div className="success-icon"><Check/></div><p className="landing-kicker">Application received</p><h3>Salamat! We’ll take it from here.</h3><p>Your reference is <strong>{reference}</strong>. Create an account using the same email to track your connection.</p><Link className="landing-button landing-button-primary" href="/login?mode=signup">Create customer account <ArrowRight/></Link></div>}
    </motion.div></motion.div>}</AnimatePresence>
  </main>;
}
