import { createFileRoute } from "@tanstack/react-router";
import { PublicFooter, PublicHeader } from "@/components/capsy/brand";
import { CONFIG } from "@/lib/config";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Capsy" },
      { name: "description", content: "What Capsy collects, why, and how long it is kept." },
      { property: "og:title", content: "Privacy Policy — Capsy" },
      { property: "og:description", content: "What Capsy collects, why, and how long it is kept." },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <div className="min-h-screen">
      <div className="orb-field" />
      <PublicHeader />
      <main className="glass mx-auto mt-12 max-w-3xl space-y-5 p-8 leading-relaxed text-muted-foreground [&_h1]:text-foreground [&_h2]:text-foreground">
        <h1 className="text-3xl font-semibold">Privacy Policy</h1>
        <p>Version {CONFIG.termsVersion}. {CONFIG.companyName} only collects what it needs to run the product.</p>
        <h2 className="text-lg font-semibold">What we collect</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>Your email address and a secure password hash, to run your account.</li>
          <li>When you accepted these terms.</li>
          <li>Which tool you chose when signing up, and an optional display name.</li>
          <li>Your projects: media files, caption text, timing and style.</li>
          <li>Processing records and minutes used, to enforce monthly limits.</li>
          <li>Basic product events (such as "captions generated"), without filenames or media content.</li>
        </ul>
        <h2 className="text-lg font-semibold">What we never collect</h2>
        <p>Phone numbers, addresses, dates of birth, payment details, contacts or third-party tracking identifiers. We use no advertising trackers.</p>
        <h2 className="text-lg font-semibold">Retention</h2>
        <p>Uploaded media is deleted automatically after {CONFIG.retentionDays} days. Caption text stays until you delete the project or your account.</p>
        <h2 className="text-lg font-semibold">Processing</h2>
        <p>Audio from your files is sent to our speech recognition provider to create captions. It is not used for advertising.</p>
        <h2 className="text-lg font-semibold">Your choices</h2>
        <p>You can delete any project, or delete your account from Account → Data. Questions: <a className="text-accent-light underline" href={`mailto:${CONFIG.supportEmail}`}>{CONFIG.supportEmail}</a>.</p>
      </main>
      <PublicFooter />
    </div>
  );
}
