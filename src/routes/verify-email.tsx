import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/capsy/brand";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/verify-email")({
  validateSearch: (s) => z.object({ email: z.string().optional().catch(undefined) }).parse(s),
  head: () => ({
    meta: [
      { title: "Check your email — Capsy" },
      { name: "description", content: "Confirm your email address to start using Capsy." },
      { property: "og:title", content: "Check your email — Capsy" },
      { property: "og:description", content: "Confirm your email address to start using Capsy." },
    ],
  }),
  component: Verify,
});

function Verify() {
  const { email } = Route.useSearch();
  const [cooldown, setCooldown] = useState(60);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function resend() {
    if (!email) return;
    setMsg(null);
    const { error } = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: `${window.location.origin}/app` } });
    setCooldown(60);
    setMsg(error?.status === 429 ? "Please wait a little before trying again." : "If that address needs verifying, a new link is on its way.");
  }

  return (
    <AuthShell title="Check your email">
      <div className="flex flex-col items-center text-center">
        <MailCheck className="h-10 w-10 text-accent-light" aria-hidden />
        <p className="mt-4 text-muted-foreground">
          We sent a verification link{email ? <> to <span className="font-medium text-foreground">{email}</span></> : null}. Open it to finish creating your account.
        </p>
        {email && (
          <Button variant="secondary" className="mt-6" onClick={resend} disabled={cooldown > 0}>
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend"}
          </Button>
        )}
        {msg && <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">{msg}</p>}
        <Link to="/sign-up" search={{}} className="mt-6 text-sm text-accent-light hover:underline">Use a different email</Link>
      </div>
    </AuthShell>
  );
}
