import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/site-chrome";
import { PassQr } from "@/components/pass-qr";
import { readPass } from "@/lib/confirm.functions";
import { previewPathPrefix } from "@/lib/preview-path-prefix";
import { ADDRESS, MAPS_URL, artistById, money, prettyDate, prettyTime, serviceById } from "@/lib/studio";

export const Route = createFileRoute("/pass/$token")({
  loader: ({ params }) => readPass({ data: params.token }),
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.ok
          ? `${loaderData.pass.code} — Venom Tattoos`
          : "Pass — Venom Tattoos",
      },
    ],
  }),
  component: PassPage,
});

function PassPage() {
  const data = Route.useLoaderData();
  const { token } = Route.useParams();
  const [url, setUrl] = useState("");

  useEffect(() => {
    const prefix = previewPathPrefix(window.location.hostname, window.location.pathname) ?? "";
    setUrl(`${window.location.origin}${prefix}/pass/${token}`);
  }, [token]);

  if (!data.ok) {
    return (
      <Shell>
        <main className="page-in mx-auto max-w-xl px-5 pt-32 pb-20">
          <p className="text-xs tracking-widest text-primary uppercase">Pass</p>
          <h1 className="mt-3 font-display text-5xl">This pass doesn’t open</h1>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            The link is torn, or it wasn’t issued by the studio. Book again and we’ll write a new one.
          </p>
          <Link
            to="/book"
            className="tap mt-8 inline-flex h-12 items-center rounded-full bg-primary px-6 text-sm font-medium text-ink"
          >
            Book a chair
          </Link>
        </main>
      </Shell>
    );
  }

  const pass = data.pass;
  const service = serviceById(pass.serviceId);
  const artist = artistById(pass.artistId);
  const method = pass.method === "paypal" ? "PayPal" : pass.method === "usdt" ? "USDT" : "Card";

  return (
    <Shell>
      <main className="page-in mx-auto grid max-w-5xl items-start gap-10 px-5 pt-28 pb-20 md:px-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="text-xs tracking-widest text-primary uppercase">Show this at the door</p>
          <h1 className="mt-3 font-display text-5xl tracking-tight md:text-7xl">{pass.code}</h1>
          <p className="mt-4 max-w-md font-display text-2xl text-muted italic">
            {pass.name.split(" ")[0]}, the chair is held.
          </p>
          <dl className="mt-8 space-y-3 border-y border-line py-5 text-sm">
            <Line label="Sitting" value={`${service.name} with ${artist.name}`} />
            <Line label="When" value={`${prettyDate(pass.date)} · ${prettyTime(pass.time)}`} />
            <Line label="Placement" value={pass.placement} />
            <Line label="Deposit" value={`${money(pass.deposit)} · ${method}`} />
            <Line label="Idea" value={pass.idea} />
            <Line label="Phone" value={pass.phone} />
          </dl>
          <p className="mt-6 text-sm leading-relaxed text-muted">
            {pass.live
              ? "The deposit is in and comes off the session."
              : "Preview hold — no funds moved. The code still marks the chair on this pass."}{" "}
            Arrive ten minutes early, fed, with photo ID. 18 and over.
          </p>
          <p className="mt-3 text-sm text-muted">
            {ADDRESS}.{" "}
            <a className="text-primary" href={MAPS_URL} target="_blank" rel="noreferrer">
              Map
            </a>
          </p>
          <Link to="/" className="mt-8 inline-flex text-sm text-primary">
            Back to the studio
          </Link>
        </div>
        <aside className="confirm-pass lg:col-span-5">
          <div className="pass-card">
            <p className="pass-kicker">Scan again from another phone</p>
            <PassQr value={url} />
            <p className="pass-card-note">Same booking. Same code. Nothing else to download.</p>
          </div>
        </aside>
      </main>
    </Shell>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="max-w-[16rem] text-right">{value}</dd>
    </div>
  );
}
