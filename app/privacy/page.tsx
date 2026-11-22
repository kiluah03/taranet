import type { Metadata } from "next";
import Link from "next/link";
import { LandingFooter, LandingHeader } from "../ui/landing-shared";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How TaraNet NZ collects, uses, stores, and protects personal information under the New Zealand Privacy Act 2020.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="landing">
      <LandingHeader />
      <section className="legal-hero">
        <div className="legal-hero-inner">
          <p className="landing-kicker">TaraNet NZ · Legal</p>
          <h1>Privacy Policy</h1>
          <p>
            How TaraNet NZ collects, uses, holds, and safeguards your personal information in accordance with the New Zealand Privacy Act 2020.
          </p>
          <p className="legal-meta">Effective: 2026 · New Zealand Residential &amp; Family Fibre Services</p>
        </div>
      </section>

      <section className="legal-section">
        <article className="legal-card">
          <h2>1. Who we are</h2>
          <p>
            TaraNet NZ provides residential fibre internet and related telecommunications services across Aotearoa New Zealand. We respect your privacy and handle personal information in accordance with the Information Privacy Principles set out in the Privacy Act 2020 (NZ).
          </p>

          <h2>2. Information we collect</h2>
          <p>When you enquire about, apply for, or use TaraNet NZ fibre services, we may collect:</p>
          <ul>
            <li>Contact and identity details, such as your full name, email address, mobile number, and installation address.</li>
            <li>Account, billing, referral, and payment records needed to manage your monthly subscription and any $5 NZD monthly referral credits.</li>
            <li>Technical and network information required to provision, diagnose, and maintain your fibre connection (such as ONT/router status, line diagnostics, and support history).</li>
            <li>Communications you send to our support team by email or through our customer portal.</li>
          </ul>

          <h2>3. How we use your information</h2>
          <ul>
            <li>To verify fibre availability at your New Zealand address and coordinate installation or transfer with wholesale network operators.</li>
            <li>To deliver, maintain, and troubleshoot your internet service and provide friendly community technical support.</li>
            <li>To issue GST invoices, manage contract terms (month-to-month or 12-month), apply referral credits, and prevent fraud or unauthorised access.</li>
            <li>To meet our legal and regulatory obligations under New Zealand telecommunications and tax laws.</li>
          </ul>

          <h2>4. Sharing your information</h2>
          <p>
            We do not sell your personal information. We only share it where necessary to deliver your service or comply with the law—for example with Local Fibre Companies (such as Chorus, Enable, Tuatahi First Fibre, or Northpower Fibre), payment and billing providers, secure cloud infrastructure partners, or regulatory authorities when legally required. Where service providers operate outside New Zealand, we take reasonable steps to ensure comparable privacy safeguards are in place.
          </p>

          <h2>5. Storage, security, and retention</h2>
          <p>
            We use technical and organisational safeguards—including encrypted connections, role-based access controls, and secure authentication—to protect your personal information against loss, unauthorised access, or disclosure. We retain personal information only for as long as needed to provide your services and satisfy New Zealand statutory record-keeping requirements.
          </p>

          <h2>6. Accessing and correcting your information</h2>
          <p>
            Under the Privacy Act 2020, you have the right to request access to the personal information we hold about you and to ask for it to be corrected if it is inaccurate. To make a request or raise a privacy question, email{" "}
            <a href="mailto:hello@taranet.nz">hello@taranet.nz</a>.
          </p>
          <p>
            If you are not satisfied with our response, you may contact the Office of the Privacy Commissioner at{" "}
            <a href="https://www.privacy.org.nz" target="_blank" rel="noreferrer">privacy.org.nz</a>.
          </p>

          <h2>7. Updates to this policy</h2>
          <p>
            We may update this Privacy Policy from time to time to reflect changes in our services or New Zealand privacy requirements. The latest version will always be published on this page.
          </p>
        </article>

        <Link href="/" className="legal-back">← Back to TaraNet NZ</Link>
      </section>

      <LandingFooter />
    </main>
  );
}
