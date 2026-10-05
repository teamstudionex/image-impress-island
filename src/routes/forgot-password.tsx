import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/capsy/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — Capsy" },
      { name: "description", content: "Get a link to reset your Capsy password." },
      { property: "og:title", content: "Reset your password — Capsy" },
      { property: "og:description", content: "Get a link to reset your Capsy password." },
    ],
  }),
  component: Forgot,
});

function Forgot() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false);
    setSent(true);
  }
  return (
    <AuthShell title="Reset your password" footer={<Link to="/sign-in" search={{}} className="text-accent-light hover:underline">Back to sign in</Link>}>
      {sent ? (
        <p aria-live="polite" className="text-muted-foreground">If an account exists for that email, we've sent a reset link.</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={busy}>Send reset link</Button>
        </form>
      )}
    </AuthShell>
  );
}
