import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/capsy/brand";
import { GoogleButton } from "@/components/capsy/google-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { INTENTS } from "@/lib/config";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/sign-up")({
  validateSearch: (s) => z.object({ intent: z.enum(INTENTS).optional().catch(undefined) }).parse(s),
  head: () => ({
    meta: [
      { title: "Create your account — Capsy" },
      { name: "description", content: "Create a Capsy account to generate and edit captions." },
      { property: "og:title", content: "Create your account — Capsy" },
      { property: "og:description", content: "Create a Capsy account to generate and edit captions." },
    ],
  }),
  component: SignUp,
});

function SignUp() {
  const { intent } = Route.useSearch();
  const navigate = useNavigate();
  const { session } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) navigate({ to: "/app", replace: true });
  }, [session, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 10 || password.length > 128) return setError("Use 10 to 128 characters for your password.");
    if (!agree) return setError("Please agree to the Terms and Privacy Policy.");
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/app`, data: { intent: intent ?? null, terms_accepted: true } },
    });
    setBusy(false);
    if (error && /password/i.test(error.message)) return setError(error.message);
    if (error && error.status === 429) return setError("Too many attempts. Try again in a minute.");
    navigate({ to: "/verify-email", search: { email } });
  }

  return (
    <AuthShell title="Create your account" footer={<>Already have an account? <Link to="/sign-in" className="text-accent-light hover:underline">Sign in</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input id="password" type={show ? "text" : "password"} autoComplete="new-password" required minLength={10} maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10" />
            <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">10 to 128 characters.</p>
        </div>
        <label className="flex items-start gap-3 text-sm">
          <Checkbox checked={agree} onCheckedChange={(v) => setAgree(v === true)} className="mt-0.5" />
          <span>I agree to the <Link to="/terms" className="text-accent-light underline">Terms</Link> and <Link to="/privacy" className="text-accent-light underline">Privacy Policy</Link></span>
        </label>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? "Creating account…" : "Create account"}</Button>
      </form>
      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
      <GoogleButton intent={intent} requireAgree={!agree} />
    </AuthShell>
  );
}
