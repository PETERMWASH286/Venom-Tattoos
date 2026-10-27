import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { VenomLockup, VenomMark } from "@/components/logo";
import { ADDRESS, hours, studioOpen } from "@/lib/studio";
import { cn } from "@/lib/cn";

const links = [
  { href: "/#work", label: "Work" },
  { href: "/#artists", label: "Artists" },
  { href: "/#menu", label: "Menu" },
  { href: "/#visit", label: "Visit" },
  { href: "/gallery", label: "Gallery" },
];

export function SiteHeader() {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [status, setStatus] = useState<ReturnType<typeof studioOpen> | null>(null);

  useEffect(() => {
    setOpen(false);
  }, [path]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setStatus(studioOpen(new Date()));
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 border-b transition-colors duration-200",
        scrolled || open ? "border-line bg-bg/90 backdrop-blur-md" : "border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:h-20 md:px-8">
        <Link to="/" className="text-fg" aria-label="Venom Tattoos home">
          <VenomLockup />
        </Link>
        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted transition-colors duration-200 hover:text-fg"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {status ? (
            <p className="hidden items-center gap-2 text-xs tracking-wide text-muted uppercase lg:flex">
              <span
                className={cn(
                  "size-1.5 rounded-full bg-primary",
                  status.open && "live-dot",
                )}
              />
              {status.label}
            </p>
          ) : null}
          <Link
            to="/book"
            className="tap hidden h-11 items-center rounded-full bg-primary px-5 text-sm font-medium text-ink md:inline-flex"
          >
            Book a chair
          </Link>
          <button
            type="button"
            className="tap inline-flex size-11 items-center justify-center rounded-full border border-line text-fg md:hidden"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            <span className="relative size-5">
              <Menu
                className={cn(
                  "absolute inset-0 size-5 transition-[opacity,transform,filter] duration-300",
                  open ? "scale-[0.25] opacity-0 blur-[4px]" : "scale-100 opacity-100 blur-none",
                )}
              />
              <X
                className={cn(
                  "absolute inset-0 size-5 transition-[opacity,transform,filter] duration-300",
                  open ? "scale-100 opacity-100 blur-none" : "scale-[0.25] opacity-0 blur-[4px]",
                )}
              />
            </span>
          </button>
        </div>
      </div>
      <div className={cn("nav-panel border-line md:hidden", open && "is-open border-t")}>
        <div>
          <nav className="flex flex-col gap-1 px-5 py-4" aria-label="Mobile" aria-hidden={!open}>
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="flex h-12 items-center text-lg"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/book"
              className="tap mt-2 flex h-12 items-center justify-center rounded-full bg-primary text-sm font-medium text-ink"
            >
              Book a chair
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-12 md:px-8">
        <div className="md:col-span-5">
          <VenomLockup markClassName="size-6" wordClassName="text-2xl" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            Appointments only, on Queen West. The deposit holds the drawing. The balance is paid in the room.
          </p>
        </div>
        <div className="md:col-span-3">
          <p className="text-xs tracking-widest text-muted uppercase">Studio</p>
          <p className="mt-3 text-sm leading-relaxed">{ADDRESS}</p>
          <Link to="/book" className="mt-3 inline-block text-sm text-primary">
            Book a sitting
          </Link>
        </div>
        <div className="md:col-span-4">
          <p className="text-xs tracking-widest text-muted uppercase">Hours</p>
          <ul className="mt-3 space-y-1 text-sm">
            {hours.map((row) => (
              <li key={row.label} className="flex justify-between gap-6">
                <span className="text-muted">{row.label}</span>
                <span>{row.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-line px-5 py-5 text-xs text-muted md:px-8">
        <span className="inline-flex items-center gap-2">
          <VenomMark className="size-4 text-primary" />
          Queen West, Toronto
        </span>
        <span>18+ with photo ID</span>
      </div>
    </footer>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="rule pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 bg-primary" id="scroll-rule" />
      <ScrollRule />
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}

function ScrollRule() {
  useEffect(() => {
    const node = document.getElementById("scroll-rule");
    if (!node) return;
    const onScroll = () => {
      const root = document.documentElement;
      const max = root.scrollHeight - root.clientHeight;
      const progress = max > 0 ? root.scrollTop / max : 0;
      node.style.transform = `scaleX(${progress})`;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return null;
}
