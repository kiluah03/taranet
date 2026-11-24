import { adminNotifyEmail, escapeHtml, maskEmail, sendEmail } from "./resend";

const SITE = "https://www.taranet.nz";

function wrap(title: string, lines: string[]) {
  const body = lines.map(line => `<p style="margin:0 0 12px;line-height:1.6">${escapeHtml(line)}</p>`).join("");
  return `<div style="font-family:Arial,sans-serif;color:#18181b;max-width:520px"><h2 style="color:#111b60">${escapeHtml(title)}</h2>${body}<p style="color:#5d6470;font-size:12px">TaraNet NZ · hello@taranet.nz</p></div>`;
}

async function send(to: string, subject: string, lines: string[]) {
  return sendEmail({ to, subject, text: lines.join("\n\n"), html: wrap(subject, lines) });
}

export async function notifyPartnerApplication(input: { name: string; email: string; code: string }) {
  await Promise.all([
    send(adminNotifyEmail(), `New partner application: ${input.code}`, [
      `${input.name} (${input.email}) applied for partner code ${input.code}.`,
      `Review and approve it in the admin console: ${SITE}/admin#affiliates`,
    ]),
    send(input.email, "We received your TaraNet NZ partner application", [
      `Kia ora ${input.name}, salamat for applying to the TaraNet NZ partner program.`,
      `Your requested code is ${input.code}. We'll email you once it is approved.`,
    ]),
  ]);
}

export async function notifyPartnerApproved(input: { name: string; email: string; code: string }) {
  await send(input.email, "Your TaraNet NZ partner code is active", [
    `Kia ora ${input.name}, your partner code ${input.code} is now active.`,
    `Share this link: ${SITE}/?ref=${input.code}`,
    "You earn for every referred customer once their fibre connection is active.",
  ]);
}

export async function notifyReferralRecorded(input: { partnerName: string; partnerEmail: string; code: string; referredEmail: string }) {
  await Promise.all([
    send(input.partnerEmail, "New referral using your TaraNet NZ code", [
      `Kia ora ${input.partnerName}, someone (${maskEmail(input.referredEmail)}) signed up using your code ${input.code}.`,
      "It stays pending until their fibre connection is active.",
    ]),
    send(adminNotifyEmail(), `New affiliate referral: ${input.code}`, [
      `${input.referredEmail} signed up using partner code ${input.code} (${input.partnerName}).`,
      `Manage it in the admin console: ${SITE}/admin#affiliates`,
    ]),
  ]);
}

export async function notifyReferralStatus(input: { partnerName: string; partnerEmail: string; code: string; referredEmail: string; status: "qualified" | "paid" }) {
  const lines = input.status === "qualified"
    ? [`Good news ${input.partnerName}: the referral ${maskEmail(input.referredEmail)} using code ${input.code} is now qualified.`]
    : [`Kia ora ${input.partnerName}: your commission for referral ${maskEmail(input.referredEmail)} (code ${input.code}) has been marked paid.`];
  await send(input.partnerEmail, `Referral ${input.status}`, lines);
}
