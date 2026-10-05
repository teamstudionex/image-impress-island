import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Wordmark } from "@/components/capsy/brand";
import { Button } from "@/components/ui/button";
import { ensureProfile } from "@/lib/capsy.functions";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({ meta: [{ title: "Dashboard — Capsy" }] }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const ensure = useServerFn(ensureProfile);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const intent = (data.user?.user_metadata?.["intent"] ?? sessionStorage.getItem("capsy_intent")) || undefined;
      ensure({ data: intent ? { intent, termsAccepted: true } : { termsAccepted: true } }).catch(console.error);
    });
  }, [ensure]);
  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/sign-in", search: {}, replace: true });
  }
  return (
    <div className="min-h-screen p-6">
      <div className="orb-field" />
      <header className="glass mx-auto flex max-w-5xl items-center justify-between rounded-full px-6 py-3">
        <Wordmark />
        <Button variant="ghost" onClick={signOut}>Sign out</Button>
      </header>
      <main className="glass mx-auto mt-10 max-w-5xl p-10">
        <h1 className="text-3xl font-semibold tracking-tight">Welcome to Capsy</h1>
        <p className="mt-2 text-muted-foreground">Your projects will appear here after you add a file.</p>
      </main>
    </div>
  );
}
