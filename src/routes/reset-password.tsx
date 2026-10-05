import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/capsy/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Choose a new password — Capsy" },
      { name: "description", content: "Set a new password for your Capsy account." },
      { property: "og:title", content: "Choose a new password — Capsy" },
      { property: "og:description", content: "Set a new password for your Capsy account." },
    ],
  }),
  component: Reset,
});

function Reset() {
  const navigate = useNavigate();
  const [ready, setReady] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "PASSWORD_RECOVERY" || s) setReady(true);
    });
    const t = setTimeout(async () => {
      const { data: s } = await supabase.auth.getSession();
      setReady((r) => r ?? !!s.session);
    }, 1500);
    return () => {
      data.subscription.unsubscribe();
      clearTimeout(t);
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 10 || password.length > 128) return setError("Use 10 to 128 characters.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setBusy(false);
      return setError(error.message);
    }
    await supabase.auth.signOut({ scope: "others" });
    navigate({ to: "/app", replace: true });
  }

  if (ready === false)
    return (
      <AuthShell title="This link has expired">
        <p className="text-muted-foreground">Reset links work once and expire after an hour.</p>
        <Button asChild className="mt-6"><Link to="/forgot-password">Send a new link</Link></Button>
      </AuthShell>
    );

  return (
    <AuthShell title="Choose a new password">
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pw">New password</Label>
          <Input id="pw" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={!ready} />
          <p className="text-xs text-muted-foreground">10 to 128 characters.</p>
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={!ready || busy}>Save password</Button>
      </form>
    </AuthShell>
  );
}
