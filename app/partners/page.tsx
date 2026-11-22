import type { Metadata } from "next";
import Link from "next/link";
import { LandingFooter, LandingHeader } from "../ui/landing-shared";
import { PartnerApplicationForm } from "./partner-form";

export const metadata: Metadata = {
  title: "Become a Partner",
  description: "Apply for a TaraNet NZ affiliate partner code and earn $5 NZD every month for each activated referral.",
};

export default function PartnersPage() {
  return (
    <main className="landing">
      <LandingHeader />
      <section className="legal-hero">
        <div className="legal-hero-inner">
          <p className="landing-kicker">TaraNet NZ · Bayanihan Partner Program</p>
          <h1>Become a partner.</h1>
          <p>
            Share TaraNet NZ fibre with your community, barkada, or audience across Aotearoa and earn $5 NZD every month for every qualifying activated connection.
          </p>
        </div>
      </section>

      <section className="legal-section">
        <article className="legal-card">
          <h2>How it works</h2>
          <ul>
            <li><strong>Request your partner code</strong> using the form below. Our team reviews every application quickly.</li>
            <li><strong>Share your link</strong> (<code>https://www.taranet.nz/?ref=YOURCODE</code>) or give your code directly to friends and community members.</li>
            <li><strong>Earn $5 NZD per month</strong> once their fibre connection is installed and active.</li>
          </ul>

          <h2>Request a partner code</h2>
          <PartnerApplicationForm />
        </article>

        <Link href="/" className="legal-back">← Back to TaraNet NZ</Link>
      </section>

      <LandingFooter />
    </main>
  );
}
