import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Shell } from "@/components/site-chrome";
import { PaySlot } from "@/components/pay-slot";
import { PassQr } from "@/components/pass-qr";
import { makeCode, useBookings, type Booking, type PayMethod } from "@/lib/bookings";
import { sendConfirmation } from "@/lib/confirm.functions";
import { previewPathPrefix } from "@/lib/preview-path-prefix";
import {
  ADDRESS,
  MAPS_URL,
  artistById,
  artists,
  dateBits,
  dayNames,
  money,
  prettyDate,
  prettyTime,
  serviceById,
  services,
  slotsFor,
  upcomingDates,
} from "@/lib/studio";
import { cn } from "@/lib/cn";

const steps = ["Sitting", "When", "Checkout"] as const;

const placements = ["Forearm", "Ribs", "Back", "Ankle", "Collarbone", "Thigh"];

const fieldClass =
  "h-12 w-full rounded-2xl border border-line bg-surface px-4 text-base text-fg outline-none transition-colors duration-200 placeholder:text-muted focus:border-primary";

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

type Draft = ReturnType<typeof useBookings.getState>["draft"];

function checks(draft: Draft) {
  return [
    {
      ok: draft.name.trim().length >= 2 && validEmail(draft.email.trim()) && draft.phone.replace(/\D/g, "").length >= 10,
      label: "Name, email, and a phone we can text",
    },
    { ok: draft.placement.trim().length >= 2, label: "Where it sits on the body" },
    { ok: draft.idea.trim().length >= 8, label: "A sentence the artist can draw from" },
  ];
}

export function BookPage({
  initialArtist,
  initialService,
}: {
  initialArtist?: string;
  initialService?: string;
}) {
  const draft = useBookings((state) => state.draft);
  const bookings = useBookings((state) => state.bookings);
  const setDraft = useBookings((state) => state.setDraft);
  const resetDraft = useBookings((state) => state.resetDraft);
  const addBooking = useBookings((state) => state.addBooking);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [method, setMethod] = useState<PayMethod>("card");
  const [done, setDone] = useState<Booking | null>(null);
  const [ready, setReady] = useState(false);
  const applied = useRef(false);

  const service = serviceById(draft.serviceId);
  const artist = artistById(draft.artistId);
  const dates = useMemo(() => upcomingDates(draft.artistId), [draft.artistId]);
  const checklist = checks(draft);
  const readyToPay = checklist.every((item) => item.ok);

  useEffect(() => {
    const persist = useBookings.persist;
    if (!persist?.hasHydrated) {
      setReady(true);
      return;
    }
    if (persist.hasHydrated()) {
      setReady(true);
      return;
    }
    return persist.onFinishHydration(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready || applied.current) return;
    applied.current = true;
    if (initialArtist && artists.some((item) => item.id === initialArtist)) {
      const nextDates = upcomingDates(initialArtist);
      setDraft({
        artistId: initialArtist,
        date: nextDates.includes(useBookings.getState().draft.date) ? useBookings.getState().draft.date : "",
        time: "",
      });
      setStep(1);
    }
    if (initialService && services.some((item) => item.id === initialService)) {
      setDraft({ serviceId: initialService });
    }
  }, [ready, initialArtist, initialService, setDraft]);

  function chooseArtist(id: string) {
    const nextDates = upcomingDates(id);
    setDraft({
      artistId: id,
      date: nextDates.includes(draft.date) ? draft.date : "",
      time: "",
    });
  }

  function next() {
    setError("");
    if (step === 1 && (!draft.date || !draft.time)) {
      setError("Pick a day and a time.");
      return;
    }
    setStep((value) => Math.min(2, value + 1));
  }

  function finish(ref: string, live: boolean) {
    const booking: Booking = {
      ...draft,
      name: draft.name.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      placement: draft.placement.trim(),
      idea: draft.idea.trim(),
      id: crypto.randomUUID(),
      code: makeCode(),
      deposit: service.deposit,
      method,
      paymentRef: ref,
      live,
      createdAt: new Date().toISOString(),
    };
    addBooking(booking);
    setDone(booking);
    resetDraft();
  }

  return (
    <Shell>
      <main className="page-in mx-auto max-w-6xl px-5 pt-28 pb-32 md:px-8 md:pt-32 md:pb-20">
        {done ? (
          <Confirmation booking={done} onAnother={() => { setDone(null); setStep(0); }} />
        ) : (
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <p className="text-xs tracking-widest text-primary uppercase">Booking</p>
              <h1 className="mt-3 font-display text-5xl md:text-6xl">Hold a chair</h1>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
                Three short steps. The deposit is taken on the last one — nothing is charged before that.
              </p>

              <ol className="mt-8 grid grid-cols-3 gap-3" aria-label="Progress">
                {steps.map((label, index) => {
                  const current = index === step;
                  const complete = index < step;
                  return (
                    <li key={label}>
                      <button
                        type="button"
                        className="w-full text-left"
                        disabled={index > step}
                        aria-current={current ? "step" : undefined}
                        onClick={() => {
                          if (index < step) {
                            setError("");
                            setStep(index);
                          }
                        }}
                      >
                        <span className="mb-2 block h-1 overflow-hidden rounded-full bg-line">
                          <span
                            className={cn(
                              "block h-full rounded-full bg-primary transition-transform duration-300",
                              complete || current ? "translate-x-0" : "-translate-x-full",
                            )}
                          />
                        </span>
                        <span className="flex items-center gap-2">
                          <span
                            className={cn(
                              "flex size-6 items-center justify-center rounded-full border text-xs transition-colors duration-200",
                              complete || current ? "border-primary bg-primary text-ink" : "border-line text-muted",
                            )}
                          >
                            {complete ? <Check className="size-3.5 check-pop" /> : index + 1}
                          </span>
                          <span className={cn("text-xs", current ? "text-fg" : "text-muted")}>{label}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>

              <div key={step} className="step-in mt-8">
                {step === 0 ? (
                  <div className="grid gap-3">
                    {services.map((item) => {
                      const selected = draft.serviceId === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setDraft({ serviceId: item.id })}
                          className={cn(
                            "tap rounded-card border p-4 text-left transition-colors duration-200",
                            selected ? "border-primary bg-surface" : "border-line hover:border-muted",
                          )}
                        >
                          <span className="flex items-baseline justify-between gap-4">
                            <span className="font-display text-2xl">{item.name}</span>
                            <span className="text-sm text-primary">{money(item.deposit)}</span>
                          </span>
                          <span className="mt-1 block text-sm text-muted">
                            {item.blurb} · {item.session}
                            {item.from > 0 ? ` · from ${money(item.from)}` : ""}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                {step === 1 ? (
                  <div className="space-y-6">
                    <div className="grid gap-3">
                      {artists.map((item) => {
                        const selected = draft.artistId === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => chooseArtist(item.id)}
                            className={cn(
                              "tap flex items-center gap-4 rounded-card border p-3 text-left transition-colors duration-200",
                              selected ? "border-primary bg-surface" : "border-line hover:border-muted",
                            )}
                          >
                            <img src={item.image} alt="" className="size-14 rounded-2xl object-cover" />
                            <span className="min-w-0">
                              <span className="block text-sm">{item.name}</span>
                              <span className="block text-xs text-muted">
                                {item.role} · {dayNames(item.days)}
                              </span>
                            </span>
                            <span
                              className={cn(
                                "ml-auto flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors duration-200",
                                selected ? "border-primary bg-primary text-ink" : "border-line",
                              )}
                              aria-hidden="true"
                            >
                              {selected ? <Check className="size-3.5 check-pop" /> : null}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <div>
                      <p className="text-xs tracking-widest text-muted uppercase">Day · {artist.name.split(" ")[0]}</p>
                      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                        {dates.map((iso) => {
                          const bits = dateBits(iso);
                          const selected = draft.date === iso;
                          return (
                            <button
                              key={iso}
                              type="button"
                              onClick={() => setDraft({ date: iso, time: "" })}
                              className={cn(
                                "tap flex h-20 w-16 shrink-0 flex-col items-center justify-center rounded-2xl border text-xs transition-colors duration-200",
                                selected ? "border-primary bg-primary text-ink" : "border-line",
                              )}
                            >
                              <span className={selected ? "text-ink/70" : "text-muted"}>{bits.week}</span>
                              <span className="font-display text-2xl leading-none">{bits.day}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "transition-[opacity,transform] duration-300",
                        draft.date ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0",
                      )}
                    >
                      <p className="text-xs tracking-widest text-muted uppercase">Time</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(draft.date ? slotsFor(draft.date) : []).map((time) => (
                          <button
                            key={time}
                            type="button"
                            onClick={() => setDraft({ time })}
                            className={cn(
                              "tap h-12 rounded-full border px-5 text-sm transition-colors duration-200",
                              draft.time === time ? "border-primary bg-primary text-ink" : "border-line",
                            )}
                          >
                            {prettyTime(time)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}

                {step === 2 ? (
                  <div className="grid gap-8">
                    <div className="grid gap-4">
                      <label className="block text-sm">
                        Name
                        <input
                          className={`${fieldClass} mt-2`}
                          value={draft.name}
                          autoComplete="name"
                          onChange={(event) => setDraft({ name: event.target.value })}
                        />
                      </label>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block text-sm">
                          Email
                          <input
                            className={`${fieldClass} mt-2`}
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            value={draft.email}
                            onChange={(event) => setDraft({ email: event.target.value })}
                          />
                        </label>
                        <label className="block text-sm">
                          Phone
                          <input
                            className={`${fieldClass} mt-2`}
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                            placeholder="416 555 0134"
                            value={draft.phone}
                            onChange={(event) => setDraft({ phone: event.target.value })}
                          />
                        </label>
                      </div>
                      <div>
                        <p className="text-sm">Placement</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {placements.map((place) => (
                            <button
                              key={place}
                              type="button"
                              className={cn(
                                "tap h-10 rounded-full border px-3 text-xs transition-colors duration-200",
                                draft.placement.toLowerCase().includes(place.toLowerCase())
                                  ? "border-primary bg-primary text-ink"
                                  : "border-line",
                              )}
                              onClick={() => setDraft({ placement: place })}
                            >
                              {place}
                            </button>
                          ))}
                        </div>
                        <input
                          className={`${fieldClass} mt-2`}
                          placeholder="Or type it — left forearm, outer"
                          value={draft.placement}
                          onChange={(event) => setDraft({ placement: event.target.value })}
                        />
                      </div>
                      <label className="block text-sm">
                        <span className="flex items-baseline justify-between gap-3">
                          The idea
                          <span className="text-xs text-muted">
                            {draft.idea.trim().length >= 8 ? "Ready" : "A few words is enough"}
                          </span>
                        </span>
                        <textarea
                          className="mt-2 min-h-28 w-full rounded-2xl border border-line bg-surface px-4 py-3 text-base text-fg outline-none transition-colors duration-200 placeholder:text-muted focus:border-primary"
                          placeholder="A blackwork serpent, no color, about the length of a hand."
                          value={draft.idea}
                          onChange={(event) => setDraft({ idea: event.target.value })}
                        />
                      </label>
                    </div>

                    <ul className="grid gap-2">
                      {checklist.map((item) => (
                        <li key={item.label} className="flex items-center gap-3 text-sm">
                          <span
                            className={cn(
                              "flex size-5 items-center justify-center rounded-full border transition-colors duration-200",
                              item.ok ? "border-primary bg-primary text-ink" : "border-line",
                            )}
                          >
                            {item.ok ? <Check className="size-3 check-pop" /> : null}
                          </span>
                          <span className={item.ok ? "text-fg" : "text-muted"}>{item.label}</span>
                        </li>
                      ))}
                    </ul>

                    <div
                      className={cn(
                        "rounded-card border border-line bg-bg p-4 transition-[opacity,transform] duration-300",
                        readyToPay ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-1 opacity-40",
                      )}
                      aria-hidden={!readyToPay}
                    >
                      <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="Payment method">
                        {(
                          [
                            ["card", "Card"],
                            ["paypal", "PayPal"],
                            ["usdt", "USDT"],
                          ] as const
                        ).map(([id, label]) => (
                          <button
                            key={id}
                            type="button"
                            role="tab"
                            aria-selected={method === id}
                            className={cn(
                              "tap h-11 rounded-full border text-sm transition-colors duration-200",
                              method === id ? "border-primary bg-primary text-ink" : "border-line",
                            )}
                            onClick={() => setMethod(id)}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <div className="mt-5">
                        <PaySlot
                          method={method}
                          serviceId={service.id}
                          amount={service.deposit}
                          name={draft.name}
                          email={draft.email}
                          note={`${draft.name} · ${draft.date ? prettyDate(draft.date) : ""} ${draft.time ? prettyTime(draft.time) : ""} · ${artist.name}`}
                          onPaid={finish}
                        />
                      </div>
                    </div>
                    {readyToPay ? null : (
                      <p className="text-xs text-muted">Finish the checklist and the payment fields unlock.</p>
                    )}
                  </div>
                ) : null}
              </div>

              {error ? (
                <p role="alert" className="mt-4 text-sm">
                  {error}
                </p>
              ) : null}

              {step < 2 ? (
                <div className="mt-8 hidden gap-3 md:flex">
                  {step > 0 ? (
                    <button
                      type="button"
                      className="tap h-12 rounded-full border border-line px-5 text-sm"
                      onClick={() => {
                        setError("");
                        setStep((value) => value - 1);
                      }}
                    >
                      Back
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="tap h-12 flex-1 rounded-full bg-primary text-sm font-medium text-ink"
                    onClick={next}
                  >
                    Continue
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="tap mt-6 hidden h-12 rounded-full border border-line px-5 text-sm md:inline-flex md:items-center"
                  onClick={() => setStep(1)}
                >
                  Edit time
                </button>
              )}
            </div>

            <Summary
              className="hidden lg:block"
              serviceName={service.name}
              deposit={service.deposit}
              artistName={artist.name}
              when={draft.date && draft.time ? `${prettyDate(draft.date)} · ${prettyTime(draft.time)}` : "Choose a time"}
              placement={draft.placement || "—"}
              bookings={bookings}
            />
          </div>
        )}
      </main>

      {!done && step < 2 ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 px-5 py-3 backdrop-blur md:hidden">
          <div className="flex items-center gap-3">
            <div className="min-w-0">
              <p className="text-xs text-muted">Deposit</p>
              <p key={service.deposit} className="pop font-display text-2xl leading-none">
                {money(service.deposit)}
              </p>
            </div>
            {step > 0 ? (
              <button
                type="button"
                className="tap h-12 rounded-full border border-line px-4 text-sm"
                onClick={() => {
                  setError("");
                  setStep((value) => value - 1);
                }}
              >
                Back
              </button>
            ) : null}
            <button type="button" className="tap h-12 flex-1 rounded-full bg-primary text-sm font-medium text-ink" onClick={next}>
              Continue
            </button>
          </div>
          {error ? (
            <p role="alert" className="mt-2 text-xs">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </Shell>
  );
}

function Summary({
  className,
  serviceName,
  deposit,
  artistName,
  when,
  placement,
  bookings,
}: {
  className?: string;
  serviceName: string;
  deposit: number;
  artistName: string;
  when: string;
  placement: string;
  bookings: Booking[];
}) {
  return (
    <aside className={cn("h-fit rounded-card border border-line bg-surface p-6 lg:sticky lg:top-28 lg:col-span-5", className)}>
      <p className="text-xs tracking-widest text-muted uppercase">Deposit</p>
      <p key={deposit} className="pop mt-2 font-display text-6xl">
        {money(deposit)}
      </p>
      <p className="mt-1 text-sm text-muted">Applied to the session. Balance due in the room.</p>
      <dl className="mt-6 space-y-3 border-t border-line pt-5 text-sm">
        <Row label="Sitting" value={serviceName} />
        <Row label="Artist" value={artistName} />
        <Row label="When" value={when} />
        <Row label="Where" value={placement} />
      </dl>
      <p className="mt-6 text-xs leading-relaxed text-muted">
        48 hours to move the date once. After that the deposit stays with the studio. {ADDRESS}.
      </p>
      <p className="mt-4 text-xs tracking-widest text-muted uppercase">Card · PayPal · USDT</p>
      {bookings.length > 0 ? (
        <div className="mt-6 border-t border-line pt-5">
          <p className="text-xs tracking-widest text-muted uppercase">On this device</p>
          <ul className="mt-3 space-y-2">
            {bookings.slice(0, 3).map((booking) => (
              <li key={booking.id} className="text-sm">
                {booking.passToken ? (
                  <Link to="/pass/$token" params={{ token: booking.passToken }} className="text-primary">
                    {booking.code}
                  </Link>
                ) : (
                  <span className="text-primary">{booking.code}</span>
                )}
                <span className="text-muted"> · {serviceById(booking.serviceId).name}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </aside>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}

const mailed = new Set<string>();

function siteBase() {
  const prefix = previewPathPrefix(window.location.hostname, window.location.pathname) ?? "";
  return `${window.location.origin}${prefix}`;
}

function Confirmation({ booking, onAnother }: { booking: Booking; onAnother: () => void }) {
  const attachPass = useBookings((state) => state.attachPass);
  const service = serviceById(booking.serviceId);
  const artist = artistById(booking.artistId);
  const methodLabel = booking.method === "card" ? "Card" : booking.method === "paypal" ? "PayPal" : "USDT";
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [mail, setMail] = useState<"sending" | "sent" | "link" | "failed">("sending");

  async function issue() {
    setMail("sending");
    try {
      const result = await sendConfirmation({
        data: {
          serviceId: booking.serviceId,
          artistId: booking.artistId,
          date: booking.date,
          time: booking.time,
          name: booking.name,
          email: booking.email,
          phone: booking.phone,
          placement: booking.placement,
          idea: booking.idea,
          code: booking.code,
          method: booking.method,
          live: booking.live,
          deposit: booking.deposit,
          origin: siteBase(),
        },
      });
      setUrl(result.url);
      setToken(result.token);
      attachPass(booking.id, result.token);
      setMail(result.emailSent ? (result.emailHasQr ? "sent" : "link") : "failed");
    } catch {
      setMail("failed");
    }
  }

  useEffect(() => {
    if (mailed.has(booking.id)) return;
    mailed.add(booking.id);
    void issue();
    // One letter per hold. Retry is explicit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking.id]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url || booking.code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const mailCopy =
    mail === "sending"
      ? `Writing the confirmation for ${booking.email}…`
      : mail === "sent"
        ? `Sent to ${booking.email}. The letter carries this same QR — scan it to open the booking.`
        : mail === "link"
          ? `Sent to ${booking.email} with the pass link. The scannable code is on this card.`
          : `The pass is ready here. The letter to ${booking.email} didn’t leave — try again.`;

  return (
    <div className="confirm-grid step-in">
      <div>
        <svg viewBox="0 0 48 48" className="size-14 text-primary" aria-hidden="true">
          <circle className="draw-circle" cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path className="draw-check" d="M15 24.5l6 6 12-13" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <p className="mt-6 text-xs tracking-widest text-primary uppercase">Chair held</p>
        <h1 className="mt-2 font-display text-5xl md:text-6xl">{booking.code}</h1>
        <p className="mt-3 max-w-md font-display text-2xl text-muted italic">
          {booking.name.split(" ")[0]}, the drawing starts now.
        </p>
        <button type="button" className="tap mt-3 text-sm text-primary" onClick={() => void copy()}>
          {copied ? "Copied" : url ? "Copy pass link" : "Copy code"}
        </button>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          {booking.live
            ? `${methodLabel} took the deposit. Show the code — or the scan — at the door.`
            : `${methodLabel} saved a preview hold. No funds moved. The pass still opens the booking.`}{" "}
          Arrive ten minutes early with photo ID.
        </p>
        <dl className="mt-8 space-y-3 border-y border-line py-5 text-sm">
          <Row label="Sitting" value={`${service.name} with ${artist.name}`} />
          <Row label="When" value={`${prettyDate(booking.date)} · ${prettyTime(booking.time)}`} />
          <Row label="Placement" value={booking.placement} />
          <Row label="Deposit" value={`${money(booking.deposit)} · ${methodLabel}`} />
        </dl>
        <ul className="mt-6 space-y-2 text-sm text-muted">
          <li>Bring photo ID. 18 and over.</li>
          <li>Eat first. The chair is not a lunch break.</li>
          <li>
            {ADDRESS}.{" "}
            <a className="text-primary" href={MAPS_URL} target="_blank" rel="noreferrer">
              Map
            </a>
          </li>
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" className="tap h-12 rounded-full bg-primary px-6 text-sm font-medium text-ink" onClick={onAnother}>
            Book another
          </button>
          <Link to="/" className="tap inline-flex h-12 items-center rounded-full border border-line px-6 text-sm">
            Back to the studio
          </Link>
        </div>
      </div>
      <aside className="confirm-pass">
        <div className="pass-card">
          <p className="pass-kicker">Scan for the booking</p>
          {url ? <PassQr value={url} /> : <div className="pass-qr skeleton" aria-hidden="true" />}
          <p className="pass-card-note">Point a phone camera at the code. It opens the chair, the time, and the door.</p>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted" aria-live="polite">
          {mailCopy}
        </p>
        {mail === "failed" ? (
          <button type="button" className="tap mt-3 text-sm text-primary" onClick={() => void issue()}>
            Send the letter again
          </button>
        ) : null}
        {token ? (
          <Link to="/pass/$token" params={{ token }} className="mt-3 inline-flex text-sm text-primary">
            Open the pass
          </Link>
        ) : null}
      </aside>
    </div>
  );
}
