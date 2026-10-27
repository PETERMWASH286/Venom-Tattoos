import { Component, useEffect, useState, type ReactNode } from "react";
import type { PayMethod } from "@/lib/bookings";

type Paid = (ref: string, live: boolean) => void;

class PayBoundary extends Component<{ children: ReactNode; resetKey: string }, { error: boolean }> {
  state = { error: false };

  static getDerivedStateFromError() {
    return { error: true };
  }

  componentDidUpdate(prev: { resetKey: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: false });
    }
  }

  render() {
    if (this.state.error) {
      return <p className="text-sm">This payment option hit a snag. Try another method.</p>;
    }
    return this.props.children;
  }
}

function Loading({ label }: { label: string }) {
  return (
    <div className="space-y-3" aria-live="polite">
      <div className="skeleton h-14 w-full rounded-card" />
      <div className="skeleton h-12 w-full rounded-full" />
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}

function LazyStripe(props: {
  serviceId: string;
  amount: number;
  name: string;
  email: string;
  note: string;
  onPaid: Paid;
}) {
  const [Comp, setComp] = useState<typeof import("@/components/pay/stripe-pay").StripePay | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    import("@/components/pay/stripe-pay")
      .then((mod) => {
        if (live) setComp(() => mod.StripePay);
      })
      .catch(() => {
        if (live) setFailed(true);
      });
    return () => {
      live = false;
    };
  }, []);

  if (failed) return <p className="text-sm">Card checkout failed to load. Refresh and try again.</p>;
  if (!Comp) return <Loading label="Loading secure card fields…" />;
  return <Comp {...props} />;
}

function LazyPayPal(props: { amount: number; onPaid: Paid }) {
  const [Comp, setComp] = useState<typeof import("@/components/pay/paypal-pay").PayPalPay | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    import("@/components/pay/paypal-pay")
      .then((mod) => {
        if (live) setComp(() => mod.PayPalPay);
      })
      .catch(() => {
        if (live) setFailed(true);
      });
    return () => {
      live = false;
    };
  }, []);

  if (failed) return <p className="text-sm">PayPal failed to load.</p>;
  if (!Comp) return <Loading label="Loading PayPal…" />;
  return <Comp {...props} />;
}

function loadCrypto() {
  if (import.meta.env.SSR) return Promise.resolve(null);
  return import("@/components/pay/crypto-pay");
}

function LazyCrypto(props: { amount: number; note: string; onPaid: Paid }) {
  const [Comp, setComp] = useState<typeof import("@/components/pay/crypto-pay").CryptoPay | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    loadCrypto()
      .then((mod) => {
        if (live && mod) setComp(() => mod.CryptoPay);
      })
      .catch(() => {
        if (live) setFailed(true);
      });
    return () => {
      live = false;
    };
  }, []);

  if (failed) return <p className="text-sm">Wallet checkout failed to load.</p>;
  if (!Comp) return <Loading label="Loading wallet…" />;
  return <Comp {...props} />;
}

export function PaySlot({
  method,
  serviceId,
  amount,
  name,
  email,
  note,
  onPaid,
}: {
  method: PayMethod;
  serviceId: string;
  amount: number;
  name: string;
  email: string;
  note: string;
  onPaid: Paid;
}) {
  return (
    <PayBoundary resetKey={method}>
      <div className="step-in min-h-40">
        {method === "card" ? (
          <LazyStripe serviceId={serviceId} amount={amount} name={name} email={email} note={note} onPaid={onPaid} />
        ) : null}
        {method === "paypal" ? <LazyPayPal amount={amount} onPaid={onPaid} /> : null}
        {method === "usdt" ? <LazyCrypto amount={amount} note={note} onPaid={onPaid} /> : null}
      </div>
    </PayBoundary>
  );
}
