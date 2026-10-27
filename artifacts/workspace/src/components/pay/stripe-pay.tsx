import { useState } from "react";
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { money } from "@/lib/studio";
import { STRIPE_PUBLISHABLE_KEY } from "@/lib/payments";
import { beginCardDeposit } from "@/lib/stripe-deposit";

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

const appearance = {
  theme: "night" as const,
  variables: {
    colorPrimary: "#d6ff4a",
    colorBackground: "#141412",
    colorText: "#f3efe6",
    colorDanger: "#f3efe6",
    fontFamily: "Outfit, ui-sans-serif, system-ui, sans-serif",
    borderRadius: "12px",
  },
};

const cardStyle = {
  hidePostalCode: true,
  disableLink: true,
  style: {
    base: {
      color: "#f3efe6",
      fontFamily: "Outfit, ui-sans-serif, system-ui, sans-serif",
      fontSize: "16px",
      "::placeholder": { color: "#a39e93" },
    },
    invalid: { color: "#f3efe6" },
  },
};

export function StripePay({
  serviceId,
  amount,
  name,
  email,
  note,
  onPaid,
}: {
  serviceId: string;
  amount: number;
  name: string;
  email: string;
  note: string;
  onPaid: (ref: string, live: boolean) => void;
}) {
  return (
    <Elements stripe={stripePromise} options={{ appearance }}>
      <CardForm serviceId={serviceId} amount={amount} name={name} email={email} note={note} onPaid={onPaid} />
    </Elements>
  );
}

function CardForm({
  serviceId,
  amount,
  name,
  email,
  note,
  onPaid,
}: {
  serviceId: string;
  amount: number;
  name: string;
  email: string;
  note: string;
  onPaid: (ref: string, live: boolean) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function pay() {
    setError("");
    if (!stripe || !elements) {
      setError("Stripe is still loading.");
      return;
    }
    const card = elements.getElement(CardElement);
    if (!card) {
      setError("Card field isn’t ready.");
      return;
    }
    setBusy(true);
    try {
      const intent = await beginCardDeposit({
        data: {
          serviceId,
          email,
          name,
          note,
          idempotencyKey: crypto.randomUUID(),
        },
      });
      if (intent.mode === "live") {
        const result = await stripe.confirmCardPayment(intent.clientSecret, {
          payment_method: { card, billing_details: { name, email } },
        });
        if (result.error || !result.paymentIntent) {
          setError(result.error?.message ?? "Card was declined.");
          return;
        }
        const status = result.paymentIntent.status;
        if (status !== "succeeded" && status !== "processing" && status !== "requires_capture") {
          setError("The deposit didn’t complete. Try the card again.");
          return;
        }
        onPaid(result.paymentIntent.id, true);
        return;
      }
      const result = await stripe.createPaymentMethod({
        type: "card",
        card,
        billing_details: { name, email },
      });
      if (result.error || !result.paymentMethod) {
        setError(result.error?.message ?? "Card was declined.");
        return;
      }
      onPaid(result.paymentMethod.id, false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Card checkout failed.";
      setError(message.length > 180 ? "Card checkout failed." : message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted">
        Card data stays in Stripe. Test card 4242 4242 4242 4242, any future date, any CVC. A connected secret key turns this button into a real {money(amount)} CAD charge.
      </p>
      <div className="rounded-card border border-line bg-surface px-4 py-4">
        <CardElement
          options={cardStyle}
          onChange={(event) => {
            setComplete(event.complete);
            setError(event.error?.message ?? "");
          }}
        />
      </div>
      {error ? (
        <p role="alert" className="text-sm text-fg">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        className="tap h-12 w-full rounded-full bg-primary text-sm font-medium text-ink disabled:opacity-40"
        disabled={!stripe || !complete || busy}
        onClick={() => void pay()}
      >
        {busy ? "Authorizing…" : `Pay ${money(amount)} deposit`}
      </button>
    </div>
  );
}
