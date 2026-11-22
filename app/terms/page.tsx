import type { Metadata } from "next";
import Link from "next/link";
import { LandingFooter, LandingHeader } from "../ui/landing-shared";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Standard New Zealand residential fibre terms and conditions for TaraNet NZ customers.",
};

export default function TermsOfServicePage() {
  return (
    <main className="landing">
      <LandingHeader />
      <section className="legal-hero">
        <div className="legal-hero-inner">
          <p className="landing-kicker">TaraNet NZ · Legal</p>
          <h1>Terms of Service</h1>
          <p>
            Clear, plain-language terms governing residential fibre internet services provided by TaraNet NZ in Aotearoa New Zealand.
          </p>
          <p className="legal-meta">Effective: 2026 · New Zealand Residential &amp; Family Fibre Services</p>
        </div>
      </section>

      <section className="legal-section">
        <article className="legal-card">
          <h2>1. Agreement &amp; service availability</h2>
          <p>
            These Terms of Service apply to fibre broadband services supplied by TaraNet NZ. Service availability depends on fibre coverage and installation readiness at your New Zealand address via the relevant Local Fibre Company (such as Chorus, Enable, Tuatahi First Fibre, or Northpower Fibre).
          </p>

          <h2>2. Plans, pricing, and GST</h2>
          <ul>
            <li>All plan prices are stated in New Zealand dollars (NZD) inclusive of 15% GST, with the GST-exclusive amount shown alongside for transparency (for example, Fibre 500 at $97.75 per month / $85 + GST, and Fibre Max 1G at $113.85 per month / $99 + GST).</li>
            <li>Standard residential fibre connections are provided free of charge where standard installation conditions apply. Non-standard installation charges, if any, will be confirmed with you before work proceeds.</li>
            <li>We will give you reasonable advance notice before making any material change to your plan pricing or core terms.</li>
          </ul>

          <h2>3. Contract terms &amp; cancellation</h2>
          <p>
            You may choose either a <strong>month-to-month</strong> term or a <strong>12-month term</strong> when connecting your service:
          </p>
          <ul>
            <li><strong>Month-to-month plans:</strong> Cancel at any time by giving us notice before your next billing cycle, with no early termination fee.</li>
            <li><strong>12-month term plans:</strong> Remain active for 12 consecutive months from service activation. Any early termination fee or equipment return terms will be clearly disclosed to you before you sign up.</li>
          </ul>

          <h2>4. Referral credits</h2>
          <p>
            Eligible customers who refer friends or whānau to TaraNet NZ receive a <strong>$5 NZD credit per month</strong> for each active, qualifying referred connection, applied toward monthly service charges in accordance with our current referral programme guidelines.
          </p>

          <h2>5. Acceptable use &amp; equipment</h2>
          <p>
            Residential fibre plans include unlimited data for normal household use. You agree not to use the service for unlawful activity, network abuse, spam, or reselling bandwidth without our written permission. You are responsible for keeping your router, Wi-Fi passwords, and account credentials secure.
          </p>

          <h2>6. Service performance, outages &amp; liability</h2>
          <p>
            Advertised fibre speeds reflect maximum theoretical wholesale line speeds; actual speeds vary with home Wi-Fi setup, connected devices, and international routing. While we work closely with New Zealand wholesale fibre partners to maintain high reliability, uninterrupted or fault-free service cannot be guaranteed at all times.
          </p>

          <h2>7. Your rights under New Zealand law</h2>
          <p>
            Nothing in these terms limits your statutory rights under the <strong>Consumer Guarantees Act 1993</strong> or the <strong>Fair Trading Act 1986</strong> for residential services. If you ever have a complaint, please contact us first at{" "}
            <a href="mailto:hello@taranet.nz">hello@taranet.nz</a> so we can resolve it promptly. If an issue remains unresolved, eligible residential customers may refer disputes to the{" "}
            <a href="https://www.tdr.org.nz" target="_blank" rel="noreferrer">Telecommunications Dispute Resolution (TDR)</a>{" "}
            scheme.
          </p>

          <h2>8. Contact us</h2>
          <p>
            Questions about these terms, your plan, or getting connected? Reach our Auckland-based team at{" "}
            <a href="mailto:hello@taranet.nz">hello@taranet.nz</a>.
          </p>
        </article>

        <Link href="/" className="legal-back">← Back to TaraNet NZ</Link>
      </section>

      <LandingFooter />
    </main>
  );
}
