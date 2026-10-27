import { createServerFn } from "@tanstack/react-start";
import { services } from "@/lib/studio";

type DepositInput = {
  serviceId: string;
  email: string;
  name: string;
  note: string;
  idempotencyKey: string;
};

export const beginCardDeposit = createServerFn({ method: "POST" })
  .validator((input: unknown): DepositInput => {
    if (!input || typeof input !== "object") throw new Error("Invalid deposit.");
    const raw = input as Record<string, unknown>;
    const serviceId = String(raw.serviceId ?? "");
    if (!services.some((item) => item.id === serviceId)) throw new Error("Unknown sitting.");
    const email = String(raw.email ?? "").trim().slice(0, 120);
    const name = String(raw.name ?? "").trim().slice(0, 80);
    const note = String(raw.note ?? "").trim().slice(0, 180);
    const idempotencyKey = String(raw.idempotencyKey ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(idempotencyKey)) throw new Error("Invalid request.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Email is required.");
    if (name.length < 2) throw new Error("Name is required.");
    return { serviceId, email, name, note, idempotencyKey };
  })
  .handler(async ({ data }) => {
    const secret = process.env.STRIPE_SECRET_KEY?.trim();
    const service = services.find((item) => item.id === data.serviceId);
    if (!service) throw new Error("Unknown sitting.");
    if (!secret) return { mode: "preview" as const };

    const params = new URLSearchParams();
    params.set("amount", String(service.deposit * 100));
    params.set("currency", "cad");
    params.set("payment_method_types[]", "card");
    params.set("description", `Venom Tattoos deposit — ${service.name}`);
    params.set("receipt_email", data.email);
    params.set("metadata[name]", data.name);
    params.set("metadata[note]", data.note);
    params.set("metadata[service]", service.id);

    const res = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Idempotency-Key": data.idempotencyKey,
      },
      body: params,
    });

    if (!res.ok) {
      console.error("stripe deposit failed", res.status);
      throw new Error("Stripe couldn’t start the deposit. Check the secret key and try again.");
    }

    const json = (await res.json()) as { client_secret?: string; id?: string };
    if (!json.client_secret || !json.id) {
      throw new Error("Stripe didn’t return a checkout.");
    }
    return { mode: "live" as const, clientSecret: json.client_secret, id: json.id };
  });
