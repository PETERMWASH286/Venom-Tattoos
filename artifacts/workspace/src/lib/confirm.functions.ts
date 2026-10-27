import { createServerFn } from "@tanstack/react-start";
import { artists, services } from "@/lib/studio";
import type { IssuedPass, PassMethod } from "@/lib/pass";

export type ConfirmationInput = IssuedPass & { origin: string };

const methods = new Set<PassMethod>(["card", "paypal", "usdt"]);

function safeBase(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (url.username || url.password || url.search || url.hash) return null;
  const path = url.pathname.replace(/\/+$/, "");
  if (path.includes("..")) return null;
  if (path && !/^\/hds-[a-z0-9]+-\d+-[a-z0-9]+$/i.test(path)) return null;
  return `${url.origin}${path}`;
}

function validateBooking(input: unknown): ConfirmationInput {
  if (!input || typeof input !== "object") throw new Error("Invalid booking.");
  const raw = input as Record<string, unknown>;
  const service = services.find((item) => item.id === String(raw.serviceId ?? ""));
  if (!service) throw new Error("Unknown sitting.");
  const artistId = String(raw.artistId ?? "");
  if (!artists.some((item) => item.id === artistId)) throw new Error("Unknown artist.");
  const email = String(raw.email ?? "").trim().toLowerCase().slice(0, 120);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Email is required.");
  const name = String(raw.name ?? "").trim().slice(0, 80);
  if (name.length < 2) throw new Error("Name is required.");
  const phone = String(raw.phone ?? "").trim().slice(0, 24);
  if (phone.replace(/\D/g, "").length < 10) throw new Error("Phone is required.");
  const date = String(raw.date ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Date is required.");
  const time = String(raw.time ?? "");
  if (!/^\d{2}:\d{2}$/.test(time)) throw new Error("Time is required.");
  const placement = String(raw.placement ?? "").trim().slice(0, 40);
  if (placement.length < 2) throw new Error("Placement is required.");
  const idea = String(raw.idea ?? "").trim().slice(0, 180);
  if (idea.length < 8) throw new Error("The idea needs a sentence.");
  const code = String(raw.code ?? "");
  if (!/^VNM-[A-Z0-9]{4}$/.test(code)) throw new Error("Bad code.");
  const method = String(raw.method ?? "") as PassMethod;
  if (!methods.has(method)) throw new Error("Bad payment.");
  const origin = safeBase(String(raw.origin ?? ""));
  if (!origin) throw new Error("Bad origin.");
  return {
    serviceId: service.id,
    artistId,
    email,
    name,
    phone,
    date,
    time,
    placement,
    idea,
    code,
    method,
    live: raw.live === true,
    deposit: service.deposit,
    origin,
  };
}

export const sendConfirmation = createServerFn({ method: "POST" })
  .validator(validateBooking)
  .handler(async ({ data }) => {
    const { issueAndSend } = await import("./confirm-mail.server");
    return issueAndSend(data);
  });

export const readPass = createServerFn({ method: "GET" })
  .validator((token: unknown) => (typeof token === "string" ? token.slice(0, 4000) : ""))
  .handler(async ({ data }) => {
    if (data.length < 16 || !data.includes("~")) return { ok: false as const };
    const { openPass } = await import("./confirm-mail.server");
    const pass = openPass(data);
    if (!pass) return { ok: false as const };
    return { ok: true as const, pass };
  });
