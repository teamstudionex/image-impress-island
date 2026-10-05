import { Link } from "@tanstack/react-router";
import { CONFIG } from "@/lib/config";
import { useSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";

export function Wordmark({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("inline-flex items-center gap-2 text-lg font-bold tracking-tight", className)} aria-label="Capsy home">
      <svg viewBox="0 0 64 64" className="h-7 w-7" aria-hidden>
        <rect width="64" height="64" rx="16" className="fill-primary/15" />
        <rect x="12" y="34" width="40" height="7" rx="3.5" className="fill-primary" />
        <rect x="18" y="45" width="28" height="7" rx="3.5" className="fill-accent-light" />
        <path d="M40 14a12 12 0 1 0 0 14" className="stroke-foreground" strokeWidth="5" fill="none" strokeLinecap="round" />
      </svg>
      capsy
    </Link>
  );
}

export function PublicHeader() {
  const { session } = useSession();
  return (
    <header className="sticky top-0 z-40 px-4 pt-4">
      <nav className="glass mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full px-4 sm:px-6">
        <Wordmark />
        <div className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="/#captions" className="hover:text-foreground">Captions</a>
          <a href="/#features" className="hover:text-foreground">Features</a>
          <a href="/#faq" className="hover:text-foreground">FAQ</a>
        </div>
        <div className="flex items-center gap-2">
          {session ? (
            <Link to="/app" className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground">
              Open dashboard
            </Link>
          ) : (
            <>
              <Link to="/sign-in" className="inline-flex h-9 items-center rounded-full px-4 text-sm hover:bg-secondary">Sign in</Link>
              <Link to="/sign-up" search={{ intent: "captions" }} className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground">
                Get started
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="mx-auto mt-24 flex max-w-6xl flex-col items-center justify-between gap-4 border-t px-6 py-10 text-sm text-muted-foreground sm:flex-row">
      <Wordmark className="text-foreground" />
      <div className="flex gap-6">
        <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
        <Link to="/terms" className="hover:text-foreground">Terms</Link>
        <a href={`mailto:${CONFIG.supportEmail}`} className="hover:text-foreground">Contact</a>
      </div>
      <p>© {new Date().getFullYear()} {CONFIG.companyName}</p>
    </footer>
  );
}

export function AuthShell({ title, children, footer }: { title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="orb-field" />
      <Wordmark className="mb-8" />
      <main className="glass w-full max-w-md p-8">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <div className="mt-6">{children}</div>
      </main>
      {footer && <div className="mt-6 text-sm text-muted-foreground">{footer}</div>}
    </div>
  );
}
