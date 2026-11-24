"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { ReactNode, useState } from "react";
import { Brand } from "./brand";

export function LandingButton({ children, href, tone = "primary", onClick, type = "button" }: { children: ReactNode; href?: string; tone?: "primary"|"secondary"|"light"; onClick?: () => void; type?: "button"|"submit" }) {
  const className = `landing-button landing-button-${tone}`;
  if (href) {
    if (href.startsWith("mailto:") || href.startsWith("http") || href.startsWith("#")) {
      return <a href={href} className={className}>{children}</a>;
    }
    return <Link href={href} className={className}>{children}</Link>;
  }
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
      <Link href="/#why" onClick={()=>setOpen(false)}>Why TARA</Link>
      <Link href="/#plans" onClick={()=>setOpen(false)}>Plans</Link>
      <Link href="/login" className="landing-login" onClick={()=>setOpen(false)}>Log in</Link>
    </nav>
    <button className="landing-menu" aria-label={open?"Close menu":"Open menu"} onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button>
  </div></header>;
}

export function LandingFooter() {
  return <footer className="landing-footer"><div className="landing-footer-main"><div><Brand/><h2>Salamat & kia ora.</h2><p>Fibre made for Filipino families building a beautiful life in Aotearoa.</p></div><div><strong>Explore</strong><Link href="/#plans">Plans</Link><Link href="/#why">Why TARA</Link><Link href="/partners">Become a partner</Link><Link href="/login">Customer portal</Link><Link href="/privacy">Privacy Policy</Link><Link href="/terms">Terms of Service</Link></div><div><strong>Connect</strong><a href="mailto:hello@taranet.nz">hello@taranet.nz</a><span>Auckland, New Zealand</span><div className="socials"><a href="https://www.facebook.com/TaraNetNZ" aria-label="TARANET NZ on Facebook">f</a></div></div></div><div className="landing-footer-base"><span>© 2026 TaraNet NZ</span><span><Link href="/privacy">Privacy Policy</Link> · <Link href="/terms">Terms of Service</Link> · Made with puso in Aotearoa</span></div></footer>;
}
