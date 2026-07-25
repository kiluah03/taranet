"use client";

import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { ReactNode, useState } from "react";
import { Brand } from "./brand";

export function LandingButton({ children, href, tone = "primary", onClick, type = "button" }: { children: ReactNode; href?: string; tone?: "primary"|"secondary"|"light"; onClick?: () => void; type?: "button"|"submit" }) {
  const className = `landing-button landing-button-${tone}`;
  if (href) return <Link href={href} className={className}>{children}</Link>;
  return <button type={type} className={className} onClick={onClick}>{children}</button>;
}

export function LandingCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <article className={`landing-card ${className}`}>{children}</article>;
}

export function LandingHeader() {
  const [open, setOpen] = useState(false);
  return <header className="landing-header"><div className="landing-nav">
    <Brand/>
    <nav className={open ? "landing-links open" : "landing-links"} aria-label="Main navigation">
      <a href="#why" onClick={()=>setOpen(false)}>Why TARA</a><a href="#plans" onClick={()=>setOpen(false)}>Plans</a><a href="#stories" onClick={()=>setOpen(false)}>Our community</a>
      <span className="culture-tag" aria-label="Philippines and New Zealand">🇵🇭 <i/> 🇳🇿</span>
      <Link href="/login" className="landing-login">Log in</Link>
      <LandingButton href="/login?mode=signup">Join TARA <ArrowRight size={16}/></LandingButton>
    </nav>
    <button className="landing-menu" aria-label={open?"Close menu":"Open menu"} onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button>
  </div></header>;
}

export function LandingFooter() {
  return <footer className="landing-footer"><div className="landing-footer-main"><div><Brand/><h2>Salamat & kia ora.</h2><p>Fibre made for Filipino families building a beautiful life in Aotearoa.</p></div><div><strong>Explore</strong><a href="#plans">Plans</a><a href="#why">Why TARA</a><Link href="/login">Customer portal</Link></div><div><strong>Connect</strong><a href="mailto:hello@taranet.nz">hello@taranet.nz</a><span>Auckland, New Zealand</span><div className="socials"><a href="#" aria-label="TARA.NET on Facebook">f</a><a href="#" aria-label="TARA.NET on Instagram">◎</a></div></div></div><div className="landing-footer-base"><span>© 2026 TARA.NET Ltd</span><span>Privacy · Terms · Made with puso in Aotearoa</span></div></footer>;
}
