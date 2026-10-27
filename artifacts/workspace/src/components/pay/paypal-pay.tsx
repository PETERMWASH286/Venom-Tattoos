import { useState } from "react";
import { PayPalButtons, PayPalScriptProvider, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { money } from "@/lib/studio";
import { PAYPAL_CLIENT_ID } from "@/lib/payments";

export function PayPalPay({
  amount,
  onPaid,
}: {
  amount: number;
  onPaid: (ref: string, live: boolean) => void;
}) {
  const value = amount.toFixed(2);
  return (
    <PayPalScriptProvider
      options={{
        clientId: PAYPAL_CLIENT_ID,
        currency: "CAD",
        intent: "capture",
        components: "buttons",
      }}
    >
      <PayPalBody value={value} amount={amount} onPaid={onPaid} />
    </PayPalScriptProvider>
  );
}

function PayPalBody({
  value,
  amount,
  onPaid,
}: {
  value: string;
  amount: number;
  onPaid: (ref: string, live: boolean) => void;
}) {
  const [{ isPending, isRejected }] = usePayPalScriptReducer();
  const [error, setError] = useState("");

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted">
        PayPal opens in a secure window for {money(amount)} CAD. With the preview client the yellow button
        still loads; a merchant client ID completes a real capture.
      </p>
      {isPending ? <p className="text-sm text-muted">Loading PayPal…</p> : null}
      {isRejected ? (
        <p role="alert" className="text-sm">
          PayPal didn’t load. Record the hold and the studio will send a PayPal request.
        </p>
      ) : (
        <PayPalButtons
          style={{ layout: "vertical", color: "gold", shape: "rect", label: "paypal", height: 48 }}
          forceReRender={[value]}
          createOrder={(_data, actions) => {
            if (!actions.order) return Promise.reject(new Error("PayPal checkout is unavailable"));
            return actions.order.create({
              intent: "CAPTURE",
              purchase_units: [
                {
                  description: "Venom Tattoos booking deposit",
                  amount: { currency_code: "CAD", value },
                },
              ],
            });
          }}
          onApprove={async (data, actions) => {
            try {
              const details = await actions.order?.capture();
              onPaid(details?.id ?? data.orderID, true);
            } catch {
              onPaid(data.orderID, true);
            }
          }}
          onError={() => setError("PayPal couldn’t open a checkout from this preview.")}
          onCancel={() => setError("PayPal window closed before payment.")}
        />
      )}
      {error ? (
        <p role="alert" className="text-sm">
          {error}
        </p>
      ) : null}
      {isRejected || error ? (
        <button
          type="button"
          className="tap h-12 w-full rounded-full border border-line text-sm"
          onClick={() => onPaid(`paypal-hold-${value}`, false)}
        >
          Record PayPal hold
        </button>
      ) : null}
    </div>
  );
}
