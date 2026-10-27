import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Check } from "lucide-react";
import { Shell } from "@/components/site-chrome";
import { Lightbox } from "@/components/lightbox";
import { VenomHeroMark } from "@/components/logo";
import {
  ADDRESS,
  MAPS_URL,
  artists,
  dayNames,
  hours,
  money,
  pieces,
  services,
  studioOpen,
  ticker,
} from "@/lib/studio";
import { cn } from "@/lib/cn";

const faqs = [
  {
    q: "Do you take walk-ins?",
    a: "No. Every sitting is drawn before you arrive, so the chair is booked, not browsed.",
  },
  {
    q: "What does the deposit cover?",
    a: "It holds the drawing time and comes off the session total. Move the date once with 48 hours’ notice. A no-show keeps the deposit.",
  },
  {
    q: "Who can get tattooed?",
    a: "18 and over, with photo ID. We don’t tattoo faces, hands, or necks on a first visit.",
  },
  {
    q: "Touch-ups?",
    a: "One complimentary pass within 90 days if you followed the aftercare.",
  },
];

const steps = [
  ["01", "Pick the sitting", "Artist, length, and a day they’re actually in the room."],
  ["02", "Pay the deposit", "Card, PayPal, or USDT. The amount is the hold, not the whole piece."],
  ["03", "We draw first", "Reference is read before the stencil. Balance is paid on the day."],
];

function useReveal() {
  useEffect(() => {
    const nodes = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.16 },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);
}

export function HomePage() {
  useReveal();
  const [shot, setShot] = useState<(typeof pieces)[number] | null>(null);
  const [openFaq, setOpenFaq] = useState(0);
  const [status, setStatus] = useState<ReturnType<typeof studioOpen> | null>(null);

  useEffect(() => {
    setStatus(studioOpen(new Date()));
  }, []);

  return (
    <Shell>
      <main className="page-in">
        <section className="hero">
          <div className="hero-copy">
            <p className="hero-kicker rise-in">
              <span className={cn("hero-dot", status?.open && "live-dot")} />
              Queen West, Toronto
              {status ? <span className="hero-status">{status.label}</span> : null}
            </p>
            <h1 className="hero-title rise-in d1">Venom</h1>
            <span className="hero-rule rise-in d2" aria-hidden="true" />
            <p className="hero-line rise-in d2">
              A private venom —
              <span>drawn before it ever touches skin.</span>
            </p>
            <p className="hero-body rise-in d3">
              Blackwork, fine line, and creatures that have to look alive. Three artists, one chair, no walk-ins at{" "}
              {ADDRESS}. The deposit holds the drawing, not a waitlist.
            </p>
            <div className="hero-actions rise-in d4">
              <Link to="/book" className="tap inline-flex h-12 items-center rounded-full bg-primary px-6 text-sm font-medium text-ink">
                Book a chair
              </Link>
              <a href="#work" className="tap inline-flex h-12 items-center rounded-full border border-line px-6 text-sm">
                See the work
              </a>
            </div>
            <ul className="hero-facts rise-in d5">
              <li>
                <strong>03</strong>
                Artists in the room
              </li>
              <li>
                <strong>$50</strong>
                Holds a consult
              </li>
              <li>
                <strong>48h</strong>
                To move a date
              </li>
            </ul>
          </div>
          <figure className="hero-figure rise-in d3">
            <VenomHeroMark className="hero-mark photo-float" />
            <div className="hero-shot">
              <span className="hero-frame" aria-hidden="true" />
              <div className="shot hero-photo">
                <img
                  src="/studio/hero.jpg"
                  alt="A tattoo artist working on a forearm in a dark studio"
                  width={1792}
                  height={1008}
                  className="ken"
                />
              </div>
            </div>
            <figcaption>
              <span>The room, after hours</span>
              <span>Pencil first. Needle second.</span>
            </figcaption>
          </figure>
        </section>

        <div className="ticker overflow-hidden border-y border-line">
          <div className="ticker-track">
            {[...ticker, ...ticker].map((item, index) => (
              <span
                key={`${item}-${index}`}
                className="flex items-center gap-6 px-4 py-4 text-xs tracking-widest text-muted uppercase"
              >
                {item}
                <span className="text-primary" aria-hidden="true">
                  +
                </span>
              </span>
            ))}
          </div>
        </div>

        <section id="work" className="scroll-mt-24 mx-auto max-w-6xl px-5 py-20 md:px-8">
          <div className="reveal flex items-end justify-between gap-6">
            <div>
              <p className="text-xs tracking-widest text-muted uppercase">01 — Recent skin</p>
              <h2 className="mt-2 font-display text-4xl md:text-6xl">The work</h2>
            </div>
            <Link to="/gallery" className="inline-flex items-center gap-1 text-sm text-primary">
              Gallery <ArrowUpRight className="size-4" />
            </Link>
          </div>
          <div className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
            {pieces.map((piece, index) => {
              const artist = artists.find((item) => item.id === piece.artistId);
              return (
                <button
                  key={piece.src}
                  type="button"
                  className="tap shot w-64 shrink-0 snap-start text-left sm:w-72"
                  style={{ animationDelay: `${index * 70}ms` }}
                  onClick={() => setShot(piece)}
                >
                  <img
                    src={piece.src}
                    alt={`${piece.title}, a ${piece.style.toLowerCase()} tattoo on a ${piece.placement.toLowerCase()}`}
                    width={1200}
                    height={1600}
                    className="frame-portrait w-full rounded-card object-cover"
                  />
                  <p className="mt-3 text-sm">{piece.title}</p>
                  <p className="text-xs text-muted">
                    {piece.style} · {artist?.name}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <section id="artists" className="scroll-mt-24 border-t border-line">
          <div className="mx-auto max-w-6xl px-5 py-20 md:px-8">
            <div className="reveal">
              <p className="text-xs tracking-widest text-muted uppercase">02 — The hands</p>
              <h2 className="mt-2 font-display text-4xl md:text-6xl">Three artists</h2>
            </div>
            <div className="mt-10 grid gap-10 md:grid-cols-3">
              {artists.map((artist, index) => (
                <article key={artist.id} className="reveal" style={{ animationDelay: `${index * 90}ms` }}>
                  <div className="shot overflow-hidden rounded-card">
                    <img
                      src={artist.image}
                      alt={`Portrait of ${artist.name}`}
                      width={1200}
                      height={1600}
                      className="frame-portrait w-full object-cover object-top"
                    />
                  </div>
                  <h3 className="mt-4 font-display text-3xl">{artist.name}</h3>
                  <p className="text-sm text-primary">{artist.role}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{artist.bio}</p>
                  <p className="mt-3 text-xs tracking-widest text-muted uppercase">{dayNames(artist.days)}</p>
                  <Link
                    to="/book"
                    search={{ artist: artist.id }}
                    className="mt-4 inline-flex items-center gap-1 text-sm text-fg"
                  >
                    Book {artist.name.split(" ")[0]} <ArrowUpRight className="size-4 text-primary" />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="menu" className="scroll-mt-24 border-t border-line">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-12 md:px-8">
            <div className="reveal md:col-span-4">
              <p className="text-xs tracking-widest text-muted uppercase">03 — The menu</p>
              <h2 className="mt-2 font-display text-4xl md:text-6xl">Sessions</h2>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                Prices start where the drawing starts. The number in lime is the deposit that holds the chair.
              </p>
              <Link
                to="/book"
                className="tap mt-6 inline-flex h-12 items-center rounded-full bg-primary px-6 text-sm font-medium text-ink"
              >
                Pay a deposit
              </Link>
            </div>
            <ul className="md:col-span-8">
              {services.map((service) => (
                <li key={service.id} className="reveal border-b border-line">
                  <Link
                    to="/book"
                    search={{ service: service.id }}
                    className="group grid gap-2 py-6 sm:grid-cols-12 sm:items-baseline"
                  >
                    <div className="sm:col-span-7">
                      <h3 className="font-display text-2xl transition-colors duration-200 group-hover:text-primary">
                        {service.name}
                      </h3>
                      <p className="mt-1 text-sm text-muted">{service.blurb}</p>
                    </div>
                    <p className="text-sm text-muted sm:col-span-2">{service.session}</p>
                    <p className="text-sm sm:col-span-3 sm:text-right">
                      <span className="text-muted">
                        {service.from === 0 ? "Credit to the piece" : `From ${money(service.from)}`}
                      </span>
                      <span className="mt-1 block text-primary">Deposit {money(service.deposit)}</span>
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-t border-line">
          <div className="mx-auto grid max-w-6xl gap-4 px-5 py-20 md:grid-cols-3 md:px-8">
            {steps.map(([index, title, copy], i) => (
              <article
                key={index}
                className="reveal rounded-card border border-line bg-surface p-6"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <p className="font-display text-3xl text-primary">{index}</p>
                <h3 className="mt-6 font-display text-2xl">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="visit" className="scroll-mt-24 border-t border-line">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 md:grid-cols-2 md:px-8">
            <div className="shot reveal overflow-hidden rounded-card">
              <img
                src="/studio/interior.jpg"
                alt="The Venom studio chair, lamp, and tray between clients"
                width={1600}
                height={1200}
                className="frame-room w-full object-cover"
              />
            </div>
            <div className="reveal">
              <p className="text-xs tracking-widest text-muted uppercase">04 — The room</p>
              <h2 className="mt-2 font-display text-4xl md:text-5xl">232a Queen St W</h2>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                Queen West, a short walk from Osgoode. Arrive ten minutes early, fed, with photo ID. The door is marked Venom.
              </p>
              <a
                href={MAPS_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1 text-sm text-primary"
              >
                Open in Maps <ArrowUpRight className="size-4" />
              </a>
              <ul className="mt-8 border-t border-line">
                {hours.map((row) => (
                  <li key={row.label} className="flex items-center justify-between border-b border-line py-3 text-sm">
                    <span className="text-muted">{row.label}</span>
                    <span>{row.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="border-t border-line">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-2 md:px-8">
            <div className="reveal">
              <p className="text-xs tracking-widest text-muted uppercase">Aftercare</p>
              <h2 className="mt-2 font-display text-4xl">Keep it boring</h2>
              <ol className="mt-6 space-y-4">
                {[
                  "Leave the wrap on for the hours your artist writes down. Not longer.",
                  "Wash with unscented soap, pat dry, a thin film of ointment. Twice a day.",
                  "No pools, sun, or gym sweat for two weeks. Don’t pick.",
                ].map((line, index) => (
                  <li key={line} className="flex gap-4 text-sm leading-relaxed text-muted">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-ink">
                      <Check className="size-3.5" />
                    </span>
                    <span>
                      <span className="text-fg">0{index + 1}. </span>
                      {line}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="reveal">
              <p className="text-xs tracking-widest text-muted uppercase">Questions</p>
              <div className="mt-4 border-t border-line">
                {faqs.map((item, index) => {
                  const open = openFaq === index;
                  return (
                    <div key={item.q} className="border-b border-line">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-4 py-4 text-left text-base"
                        aria-expanded={open}
                        onClick={() => setOpenFaq(open ? -1 : index)}
                      >
                        {item.q}
                        <span className="text-primary" aria-hidden="true">
                          {open ? "–" : "+"}
                        </span>
                      </button>
                      <div className={cn("faq-panel", open && "is-open")}>
                        <div>
                          <p className="pb-4 text-sm leading-relaxed text-muted">{item.a}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Lightbox
        src={shot?.src ?? null}
        alt={shot ? `${shot.title} tattoo` : ""}
        caption={shot ? `${shot.title} · ${shot.style}` : undefined}
        artistId={shot?.artistId}
        artistName={shot ? artists.find((item) => item.id === shot.artistId)?.name : undefined}
        onClose={() => setShot(null)}
      />
    </Shell>
  );
}
