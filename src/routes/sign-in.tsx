import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/capsy/brand";
import { GoogleButton } from "@/components/capsy/google-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { safeNext } from "@/lib/config";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/sign-in")({
  validateSearch: (s) => z.object({ next: z.string().optional().catch(undefined) }).parse(s),
  head: () => ({
    meta: [
      { title: "Sign in — Capsy" },
      { name: "description", content: "Sign in to your Capsy account." },
      { property: "og:title", content: "Sign in — Capsy" },
      { property: "og:description", content: "Sign in to your Capsy account." },
    ],
  }),
  component: SignIn,
});

function SignIn() {
  const { next } = Route.useSearch();
  const navigate = useNavigate();
  const { session } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unverified, setUnverified] = useState(false);

  useEffect(() => {
    if (session) navigate({ to: safeNext(next), replace: true });
  }, [session, next, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setUnverified(false);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (!error) return;
    if (/not confirmed/i.test(error.message)) return setUnverified(true);
    if (error.status === 429) return setError("Too many attempts. Try again in a few minutes.");
    setError("Email or password is incorrect.");
  }

  return (
    <AuthShell title="Sign in" footer={<>New to Capsy? <Link to="/sign-up" search={{}} className="text-accent-light hover:underline">Create an account</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-accent-light hover:underline">Forgot password?</Link>
          </div>
          <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {unverified && (
          <div role="alert" className="glass-raised p-3 text-sm">
            Verify your email to continue.{" "}
            <Link to="/verify-email" search={{ email }} className="text-accent-light underline">Resend</Link>
          </div>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
      </form>
      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
      <GoogleButton />
    </AuthShell>
  );
}
