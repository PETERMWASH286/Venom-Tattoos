import { cn } from "@/lib/cn";

/**
 * Venom mark: a cut V, a needle, and one falling drop.
 * The gap between the point and the drop is the whole idea.
 */
export function VenomMark({
  className,
  title,
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg viewBox="0 0 64 64" className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <path
        fill="currentColor"
        d="M8 6h11.2L32 34.6 44.8 6H56L35.2 46h-6.4L8 6z"
      />
      <path fill="currentColor" d="M29.2 50h5.6v7.2h-5.6z" />
      <circle cx="32" cy="60.4" r="2.5" fill="currentColor" />
    </svg>
  );
}

export function VenomLockup({
  className,
  markClassName,
  wordClassName,
}: {
  className?: string;
  markClassName?: string;
  wordClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 text-fg", className)}>
      <VenomMark className={cn("size-7 text-primary", markClassName)} />
      <span className={cn("font-display text-xl leading-none tracking-tight", wordClassName)}>Venom</span>
    </span>
  );
}

/** Large hero mark. Strokes draw once; the drop lands after. */
export function VenomHeroMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={cn("text-primary", className)} aria-hidden="true">
      <path
        className="logo-stroke"
        d="M18 16 L60 78 L102 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinejoin="miter"
        strokeLinecap="square"
      />
      <path
        className="logo-stroke logo-stroke-late"
        d="M60 84 V104"
        fill="none"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="square"
      />
      <circle className="logo-drop" cx="60" cy="112" r="4.5" fill="currentColor" />
    </svg>
  );
}
