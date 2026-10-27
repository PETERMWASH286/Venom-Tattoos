import { useMemo, useState } from "react";
import { Shell } from "@/components/site-chrome";
import { Lightbox } from "@/components/lightbox";
import { artists, pieces } from "@/lib/studio";
import { cn } from "@/lib/cn";

const filters = ["All", ...Array.from(new Set(pieces.map((piece) => piece.style)))];

export function GalleryPage() {
  const [filter, setFilter] = useState("All");
  const [shot, setShot] = useState<(typeof pieces)[number] | null>(null);
  const visible = useMemo(
    () => (filter === "All" ? pieces : pieces.filter((piece) => piece.style === filter)),
    [filter],
  );

  return (
    <Shell>
      <main className="page-in mx-auto max-w-6xl px-5 pt-28 pb-20 md:px-8 md:pt-32">
        <p className="rise-in text-xs tracking-widest text-primary uppercase">Gallery</p>
        <h1 className="rise-in d1 mt-3 font-display text-5xl md:text-7xl">Recent skin</h1>
        <p className="rise-in d2 mt-4 max-w-xl text-sm leading-relaxed text-muted">
          Healed work from the room. Tap a piece, then book the artist who made it — the checkout opens on their calendar.
        </p>
        <div className="rise-in d3 mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Filter by style">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={filter === item}
              className={cn(
                "tap h-11 rounded-full border px-4 text-sm transition-colors duration-200",
                filter === item ? "border-primary bg-primary text-ink" : "border-line text-fg",
              )}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((piece) => {
            const artist = artists.find((item) => item.id === piece.artistId);
            return (
              <button
                key={piece.src}
                type="button"
                className="tap shot step-in text-left"
                onClick={() => setShot(piece)}
              >
                <img
                  src={piece.src}
                  alt={`${piece.title}, ${piece.style.toLowerCase()} on the ${piece.placement.toLowerCase()}`}
                  width={1200}
                  height={1600}
                  className="frame-portrait w-full rounded-card object-cover"
                />
                <p className="mt-3 text-sm">{piece.title}</p>
                <p className="text-xs text-muted">
                  {piece.style} · {piece.placement} · {artist?.name}
                </p>
              </button>
            );
          })}
        </div>
      </main>
      <Lightbox
        src={shot?.src ?? null}
        alt={shot ? shot.title : ""}
        caption={shot ? `${shot.title} · ${shot.placement}` : undefined}
        artistId={shot?.artistId}
        artistName={shot ? artists.find((item) => item.id === shot.artistId)?.name : undefined}
        onClose={() => setShot(null)}
      />
    </Shell>
  );
}
