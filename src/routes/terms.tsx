import { createFileRoute } from "@tanstack/react-router";
import { PublicFooter, PublicHeader } from "@/components/capsy/brand";
import { CONFIG, formatBytes } from "@/lib/config";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Capsy" },
      { name: "description", content: "The terms for using Capsy." },
      { property: "og:title", content: "Terms of Service — Capsy" },
      { property: "og:description", content: "The terms for using Capsy." },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <div className="min-h-screen">
      <div className="orb-field" />
      <PublicHeader />
      <main className="glass mx-auto mt-12 max-w-3xl space-y-5 p-8 leading-relaxed text-muted-foreground [&_h1]:text-foreground [&_h2]:text-foreground">
        <h1 className="text-3xl font-semibold">Terms of Service</h1>
        <p>Version {CONFIG.termsVersion}. By creating an account you agree to these terms.</p>
        <h2 className="text-lg font-semibold">Your content</h2>
        <p>You keep all rights to files you upload. Only upload media you have the right to use. We process your files only to provide the service.</p>
        <h2 className="text-lg font-semibold">Limits</h2>
        <p>Files up to {formatBytes(CONFIG.maxFileBytes)} and {CONFIG.maxDurationMs / 60000} minutes. {CONFIG.monthlyMinutes} processing minutes per account per month. Media is deleted after {CONFIG.retentionDays} days.</p>
        <h2 className="text-lg font-semibold">Accuracy</h2>
        <p>Captions are generated automatically and can contain mistakes. Review them before publishing.</p>
        <h2 className="text-lg font-semibold">Acceptable use</h2>
        <p>Don't use Capsy for unlawful content, to attack the service, or to get around usage limits.</p>
        <h2 className="text-lg font-semibold">Ending your account</h2>
        <p>You can delete your account at any time. We may suspend accounts that break these terms.</p>
        <h2 className="text-lg font-semibold">Contact</h2>
        <p><a className="text-accent-light underline" href={`mailto:${CONFIG.supportEmail}`}>{CONFIG.supportEmail}</a></p>
      </main>
      <PublicFooter />
    </div>
  );
}
