"use server";
import { z } from "zod";
import { createAuthServerClient } from "../../lib/supabase/auth-server";
export async function createSupportTicket(input: { subject: string; body: string }) {
  const parsed = z.object({ subject: z.string().trim().min(1).max(120), body: z.string().trim().min(1).max(2000) }).safeParse(input);
  if (!parsed.success) return { error: "Enter a subject and message." };
  try {
    const supabase = await createAuthServerClient(true);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { error: "Please sign in again." };
    const reference = "SUP-" + crypto.randomUUID();
    const { data: ticket, error } = await supabase.from("tickets").insert({ reference, user_id: user.id, subject: parsed.data.subject, priority: "normal" }).select("id").single();
    if (error || !ticket) return { error: "Could not create your ticket. Try again." };
    const { error: messageError } = await supabase.from("ticket_messages").insert({ ticket_id: ticket.id, author_id: user.id, body: parsed.data.body });
    if (messageError) return { error: "Ticket " + reference + " was created, but its message could not be saved. Contact support with this reference." };
    return { reference };
  } catch { return { error: "Support is temporarily unavailable. Please try again." }; }
}
