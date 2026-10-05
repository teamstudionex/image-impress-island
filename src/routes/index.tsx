import { createFileRoute, Link } from "@tanstack/react-router";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { PublicFooter, PublicHeader } from "@/components/capsy/brand";
import { CONFIG, ENABLED_LANGUAGES, formatBytes } from "@/lib/config";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Capsy — Captions for your videos, ready to edit" },
      { name: "description", content: "Upload a video or audio file. Capsy generates captions in English, Hindi and Hinglish, you fix them and export SRT, VTT or TXT." },
      { property: "og:title", content: "Capsy — Captions for your videos, ready to edit" },
      { property: "og:description", content: "Generate, edit and export captions for your videos in English, Hindi and Hinglish." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const languages = ENABLED_LANGUAGES.map((l) => l.label).join(", ");

function HeroVisual() {
  // Abstract, decorative only: bars stand in for caption lines; no text or numbers.
  const bars = [62, 88, 40, 74, 54, 92, 36, 70, 58, 80, 46, 66, 30, 84, 50, 72, 42, 90, 60, 38, 76, 52, 86, 44];
  return (
    <div aria-hidden className="relative mx-auto aspect-square w-full max-w-md [perspective:1200px]">
      <div className="hero-stack absolute inset-0">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="glass absolute inset-x-6 p-6"
            style={{ top: `${14 + i * 18}%`, height: "46%", transform: `translateZ(${i * 60}px)`, opacity: 0.55 + i * 0.2 }}
          >
            {i === 0 && (
              <div className="flex h-full items-end gap-1.5">
                {bars.map((h, k) => (
                  <span key={k} className="flex-1 rounded-full bg-accent-light/50" style={{ height: `${h}%` }} />
                ))}
              </div>
            )}
            {i === 1 && (
              <div className="space-y-3">
                {[78, 54, 66].map((w, k) => (
                  <div key={k} className="h-3 rounded-full bg-foreground/25" style={{ width: `${w}%` }} />
                ))}
              </div>
            )}
            {i === 2 && (
              <div className="flex h-full flex-col justify-end gap-2.5 pb-2">
                <div className="mx-auto h-4 w-4/5 rounded-full bg-primary shadow-[var(--glow-accent)]" />
                <div className="mx-auto h-4 w-3/5 rounded-full bg-foreground/80" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Home() {
  const steps = [
    ["Upload", "Add a video or audio file. It stays private to your account."],
    ["Generate", "Capsy listens to the speech and writes timed captions."],
    ["Edit", "Fix words and timing in a list that follows playback."],
    ["Style", "Pick a caption look and see it over your video."],
    ["Export", "Download SRT, VTT or plain text."],
  ];
  const faq = [
    ["Which files can I use?", `${CONFIG.acceptedExtensions.map((e) => e.toUpperCase()).join(", ")}. Up to ${formatBytes(CONFIG.maxFileBytes)} and ${CONFIG.maxDurationMs / 60000} minutes per file.`],
    ["Which languages are supported?", `${languages}. Hinglish captions are written in Roman script.`],
    ["How long are my files kept?", `Uploaded media is deleted automatically after ${CONFIG.retentionDays} days. Your caption text stays until you delete the project.`],
    ["Are my files private?", "Yes. Files are stored in private storage that only your account can read."],
    ["Do I need an account?", "Yes. Captions are tied to projects in your account, so you need to sign up and verify your email."],
    ["How much can I process?", `Each account can process ${CONFIG.monthlyMinutes} minutes of media per month.`],
    ["How do I delete my account?", "Open Account, then Data, and choose Delete account. Your projects, files and captions are removed."],
  ];
  return (
    <div className="min-h-screen">
      <div className="orb-field" />
      <PublicHeader />
      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-16 lg:grid-cols-[1.1fr_1fr] lg:pt-24">
          <div>
            <h1 className="text-display">Captions for your videos, ready to edit.</h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Upload a video or audio file. Capsy generates captions, you fix the text, style them and export SRT, VTT or TXT.
            </p>
            <p className="mt-3 text-sm text-accent-light">Languages: {languages}.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="hero" size="lg"><Link to="/sign-up" search={{ intent: "captions" }}>Get started</Link></Button>
              <Button asChild variant="outline" size="lg"><Link to="/sign-in">Sign in</Link></Button>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">Files are deleted automatically after {CONFIG.retentionDays} days.</p>
          </div>
          <HeroVisual />
        </section>

        <section id="captions" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-16">
          <h2 className="text-3xl font-semibold tracking-tight">Captions, start to finish</h2>
          <ol className="mt-10 grid gap-4 md:grid-cols-5">
            {steps.map(([t, d], i) => (
              <li key={t} className="glass p-5">
                <span className="tabular inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-sm text-accent-light">{i + 1}</span>
                <h3 className="mt-4 font-semibold">{t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{d}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-6 py-16 md:grid-cols-2">
          <div className="glass p-8">
            <h2 className="text-2xl font-semibold tracking-tight">Built for fixing, not just generating</h2>
            <ul className="mt-6 space-y-3 text-muted-foreground">
              {["Editable start and end times", "Find & replace across every caption", "An issues panel with one-click fixes", "Keyboard shortcuts for playback and editing", "Undo and redo", "Live style preview over your video"].map((x) => (
                <li key={x} className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{x}</li>
              ))}
            </ul>
          </div>
          <div className="glass p-8">
            <h2 className="text-2xl font-semibold tracking-tight">Export formats</h2>
            <ul className="mt-6 space-y-3">
              {[["SRT", "Works in Premiere, DaVinci Resolve, CapCut and YouTube"], ["VTT", "For web players"], ["TXT", "Plain transcript"]].map(([f, d]) => (
                <li key={f} className="glass-raised flex items-center justify-between px-4 py-3">
                  <span className="tabular font-medium">{f}</span><span className="text-sm text-muted-foreground">{d}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-16">
          <h2 className="text-3xl font-semibold tracking-tight">Everything in Capsy</h2>
          <div className="glass mt-8 divide-y">
            <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold">Captions</h3>
                <p className="text-sm text-muted-foreground">Generate timed captions, fix them fast and export them in the format your editor needs.</p>
              </div>
              <Button asChild><Link to="/sign-up" search={{ intent: "captions" }}>Get started</Link></Button>
            </div>
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-6 py-16">
          <h2 className="text-3xl font-semibold tracking-tight">Questions</h2>
          <Accordion type="single" collapsible className="glass mt-8 px-6">
            {faq.map(([q = "", a]) => (
              <AccordionItem key={q} value={q}>
                <AccordionTrigger>{q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="glass flex flex-col items-center p-12 text-center">
            <h2 className="text-3xl font-semibold tracking-tight">Create your account</h2>
            <p className="mt-2 text-muted-foreground">Give Capsy the annoying part.</p>
            <Button asChild variant="hero" size="lg" className="mt-6"><Link to="/sign-up" search={{ intent: "captions" }}>Get started</Link></Button>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
