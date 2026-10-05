import { useState } from "react";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";

export function GoogleButton({ intent, requireAgree }: { intent?: string; requireAgree?: boolean }) {
  const [error, setError] = useState<string | null>(null);
  async function go() {
    setError(null);
    if (requireAgree) return setError("Please agree to the Terms and Privacy Policy first.");
    if (intent) sessionStorage.setItem("capsy_intent", intent);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/sign-in" });
    if (result.error) return setError("Google sign-in didn't complete. Try again.");
    if (result.redirected) return;
    window.location.assign("/app");
  }
  return (
    <div>
      <Button type="button" variant="outline" size="lg" className="w-full" onClick={go}>
        <svg viewBox="0 0 24 24" aria-hidden><path fill="currentColor" d="M21.35 11.1H12v2.98h5.35c-.23 1.4-1.66 4.1-5.35 4.1-3.22 0-5.85-2.67-5.85-5.96S8.78 6.26 12 6.26c1.83 0 3.06.78 3.76 1.45l2.57-2.47C16.68 3.7 14.55 2.75 12 2.75 6.96 2.75 2.9 6.86 2.9 12s4.06 9.25 9.1 9.25c5.25 0 8.74-3.69 8.74-8.89 0-.6-.06-1.05-.14-1.26Z"/></svg>
        Continue with Google
      </Button>
      {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
