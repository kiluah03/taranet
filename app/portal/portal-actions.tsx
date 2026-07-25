"use client";

import { FormEvent, useMemo, useState } from "react";
import { Copy, MessageSquarePlus } from "lucide-react";
import { createAuthBrowserClient } from "../../lib/supabase/auth-client";

export function ReferralButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(`${window.location.origin}/?ref=${code}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }
  return <button className="ghost-button" onClick={copy}><Copy size={14}/>{copied ? "Copied!" : "Copy referral link"}</button>;
}

export function SupportForm({ userId }: { userId: string }) {
  const supabase = useMemo(() => createAuthBrowserClient(), []);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const subject = String(form.get("subject"));
    const body = String(form.get("body"));
    const reference = `SUP-${Date.now().toString().slice(-7)}`;
    const { data: ticket, error } = await supabase.from("tickets").insert({
      reference, user_id: userId, subject, priority: "normal",
    }).select("id").single();
    if (!error && ticket) {
      const { error: messageError } = await supabase.from("ticket_messages").insert({
        ticket_id: ticket.id, author_id: userId, body,
      });
      if (!messageError) {
        setMessage(`Ticket ${reference} created.`);
        setOpen(false);
        window.setTimeout(() => window.location.reload(), 900);
      } else setMessage(messageError.message);
    } else setMessage(error?.message ?? "Could not create the ticket.");
    setBusy(false);
  }

  return <div>
    <button className="ghost-button" onClick={() => setOpen(!open)}><MessageSquarePlus size={15}/>Start a support ticket</button>
    {open && <form className="support-form" onSubmit={submit}>
      <label>Subject<input name="subject" required maxLength={120}/></label>
      <label>How can we help?<textarea name="body" required maxLength={2000}/></label>
      <button className="button full" disabled={busy}>{busy ? "Sending…" : "Send request"}</button>
    </form>}
    {message && <p className="muted">{message}</p>}
  </div>;
}
