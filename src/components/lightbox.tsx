import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";

export function Lightbox({
  src,
  alt,
  caption,
  artistId,
  artistName,
  onClose,
}: {
  src: string | null;
  alt: string;
  caption?: string;
  artistId?: string;
  artistName?: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!src) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div
      className="lightbox-in fixed inset-0 z-50 flex items-center justify-center bg-bg/95 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
    >
      <button
        type="button"
        className="tap absolute top-4 right-4 inline-flex size-11 items-center justify-center rounded-full border border-line bg-surface text-fg"
        aria-label="Close image"
        onClick={onClose}
      >
        <X className="size-5" />
      </button>
      <figure
        className="lightbox-card flex max-w-3xl flex-col items-center gap-4"
        onClick={(event) => event.stopPropagation()}
      >
        <img src={src} alt={alt} className="max-h-[78svh] w-auto max-w-full rounded-card object-contain" />
        <figcaption className="flex flex-col items-center gap-3 text-center">
          {caption ? <p className="text-sm text-muted">{caption}</p> : null}
          {artistId && artistName ? (
            <Link
              to="/book"
              search={{ artist: artistId }}
              className="tap inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-medium text-ink"
              onClick={onClose}
            >
              Book {artistName}
            </Link>
          ) : null}
        </figcaption>
      </figure>
    </div>
  );
}
