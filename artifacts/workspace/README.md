# Venom Tattoos — Checkout & payments

Queen West tattoo studio booking site. Guests hold a chair with a deposit paid by **card (Stripe)**, **PayPal**, or **USDT** (Polygon / Arbitrum). After payment the app issues a signed pass, shows a QR, and emails the guest when a mail provider is configured.

Bookings are **not** stored in Postgres. The signed pass token is the record.

---

## Production checklist

| Step | What | Status when unset |
| --- | --- | --- |
| 1 | Stripe publishable + secret keys | Card fields work; only a PaymentMethod is created (no charge) |
| 2 | PayPal Client ID | Buttons load with `"test"`; no real capture |
| 3 | WalletConnect Project ID | Default demo ID works in preview; use your own for production |
| 4 | Studio USDT treasury (`0x…`) | Wallet signs a message only; no tokens move |
| 5 | `TICKET_SECRET` | Falls back to a built-in string (change this in production) |
| 6 | Mail (Resend / SendGrid / Postmark) + `BOOKING_FROM_EMAIL` | Confirmation page still works; email may fail and user gets the pass link on-screen |

---

## Where to get API keys / credentials

### 1. Stripe (card deposits)

1. Sign in at [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Toggle **Test mode** (top right) while developing
3. **Developers → API keys**
   - **Publishable key** → `pk_test_…` or `pk_live_…`
   - **Secret key** → `sk_test_…` or `sk_live_…` (Reveal once; never commit)
4. Optional: **Developers → Webhooks** if you later add server confirmation; this app does not require webhooks for the deposit flow (PaymentIntent is confirmed client-side)

**Test cards (Test mode only)**  
- Success: `4242 4242 4242 4242`, any future expiry, any CVC  
- Decline: `4000 0000 0000 0002`  
- 3D Secure: `4000 0025 0000 3155`

### 2. PayPal

1. Sign in at [https://developer.paypal.com](https://developer.paypal.com)
2. **Apps & Credentials** → create a REST app (or use the default Sandbox app)
3. Copy the **Client ID** (Sandbox for testing, Live for production)
4. Ensure the app has **Accept payments** enabled

Sandbox buyers: create test accounts under **Sandbox → Accounts**.

### 3. WalletConnect (RainbowKit / USDT)

1. Sign in at [https://cloud.walletconnect.com](https://cloud.walletconnect.com)
2. Create a project → copy the **Project ID**
3. Restrict origins to your production domain when you go live

### 4. USDT treasury address

Use a wallet you control on **Polygon** and/or **Arbitrum** that can receive USDT:

| Network | Chain ID | USDT contract (already in code) |
| --- | --- | --- |
| Polygon | 137 | `0xc2132D05D31c914a87C6611C10748AEb04B58e8F` |
| Arbitrum | 42161 | `0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9` |

Studio quote: **1 USDT = 1.38 CAD** (`STUDIO_RATE_CAD_PER_USDT` in `src/lib/studio.ts`). Not a live market rate.

### 5. Booking confirmation email (pick one)

| Provider | Sign up | Credential |
| --- | --- | --- |
| [Resend](https://resend.com) | Dashboard → API Keys | `RESEND_API_KEY` |
| [SendGrid](https://sendgrid.com) | Settings → API Keys | `SENDGRID_API_KEY` |
| [Postmark](https://postmarkapp.com) | Servers → API Tokens | `POSTMARK_SERVER_TOKEN` |

Also set **`BOOKING_FROM_EMAIL`** to a verified sender, e.g. `Venom Tattoos <bookings@yourdomain.com>`.  
Resend can use `onboarding@resend.dev` for quick tests if `BOOKING_FROM_EMAIL` is omitted.

### 6. Pass signing secret

Generate a long random string (e.g. `openssl rand -hex 32`) and set **`TICKET_SECRET`**. Used to HMAC-sign booking passes. Changing it invalidates existing QR codes.

---

## Which file / env holds each credential

| Variable | Client or server | Where it is read | Notes |
| --- | --- | --- | --- |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Client (Vite) | `src/lib/payments.ts` | Safe to expose |
| `STRIPE_SECRET_KEY` | **Server only** | `src/lib/stripe-deposit.ts` | **Never** prefix with `VITE_` |
| `VITE_PAYPAL_CLIENT_ID` | Client | `src/lib/payments.ts` | Default `"test"` |
| `VITE_WALLETCONNECT_PROJECT_ID` | Client | `src/lib/payments.ts` | |
| `VITE_STUDIO_USDT_WALLET` | Client | `src/lib/payments.ts` | `0x` + 40 hex chars |
| `TICKET_SECRET` | Server | `src/lib/confirm-mail.server.ts` | Pass HMAC |
| `BOOKING_FROM_EMAIL` | Server | `src/lib/confirm-mail.server.ts` | From address |
| `RESEND_API_KEY` | Server | same | Preferred mail path |
| `SENDGRID_API_KEY` | Server | same | Needs `BOOKING_FROM_EMAIL` |
| `POSTMARK_SERVER_TOKEN` | Server | same | Needs `BOOKING_FROM_EMAIL` |

### Local development

Create a file at the **project root** named `.env` or `.env.local` (Vite loads both). Example:

```bash
# Client (exposed to the browser)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_PAYPAL_CLIENT_ID=your-sandbox-client-id
VITE_WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id
VITE_STUDIO_USDT_WALLET=0xYourTreasuryAddressHere

# Server (never VITE_)
STRIPE_SECRET_KEY=sk_test_...
TICKET_SECRET=replace-with-long-random-string
BOOKING_FROM_EMAIL=Venom Tattoos <bookings@yourdomain.com>
RESEND_API_KEY=re_...
```

Alternatively, client-only flags can live in `.grok/app-env.json` (only `VITE_*` string keys). Real `process.env` always wins over that file. Secrets must **not** go in `app-env.json`.

### Production / deploy

Set the same variables in your host’s environment (Vercel, Cloudflare, Fly, Railway, etc.).  
Server secrets are injected at runtime; `VITE_*` values are baked in at **build** time for the client bundle.

Restart the dev server after changing any env var.

---

## How checkout works

```
Sitting → When → Checkout (details + pay)
                      │
                      ├─ Card  → beginCardDeposit (server) → PaymentIntent
                      │          → stripe.confirmCardPayment (client)
                      ├─ PayPal → PayPal Buttons createOrder / capture
                      └─ USDT  → RainbowKit connect → transfer or signMessage
                      │
                      ▼
                 onPaid(ref, live)
                      │
                 finish() → local booking + Confirmation UI
                      │
                 sendConfirmation → sign pass + email + QR
                      │
                 /pass/$token  (scannable on any phone)
```

Rules enforced in UI and on the server:

- Payment UI stays locked until name, email, ≥10-digit phone, placement, and idea (≥8 chars) are filled.
- Card amount is **always** `service.deposit` from `src/lib/studio.ts` (server never trusts a client-supplied amount).
- `live: true` only when money actually moved (or PayPal captured / USDT transferred). Preview holds pass `false`.
- Guest can go back to finished steps; cannot skip ahead.

Deposit amounts (edit only in `src/lib/studio.ts`):

| Service ID | Name | Deposit (CAD) |
| --- | --- | --- |
| `consult` | Consult & drawing | 50 |
| `small` | Small piece | 80 |
| `session` | Half day | 150 |
| `day` | Full day | 250 |

---

## How to test payments

### A. Automated unit tests

```bash
npm test
# or only payment-related:
node --experimental-strip-types --test src/lib/payments.test.ts
```

These cover deposit amounts, USDT conversion, address validation, and booking code format. They do **not** call Stripe/PayPal networks.

### B. Manual — Card (Stripe Test mode)

1. Set `VITE_STRIPE_PUBLISHABLE_KEY` + `STRIPE_SECRET_KEY` (both **test** keys from the same Stripe account).
2. `npm run dev` → open `/book`.
3. Complete Sitting → When → Checkout details.
4. Choose **Card**, enter `4242 4242 4242 4242`, future date, any CVC.
5. Pay → confirmation should show a live deposit (`live: true`).
6. In Stripe Dashboard → **Payments**, you should see the PaymentIntent in CAD for the service deposit.

Without `STRIPE_SECRET_KEY`, the same card still validates via Elements but only creates a PaymentMethod; confirmation marks it as a hold (`live: false`).

### C. Manual — PayPal Sandbox

1. Set `VITE_PAYPAL_CLIENT_ID` to your **Sandbox** Client ID.
2. Complete checkout, choose **PayPal**.
3. Log in with a Sandbox buyer account and approve.
4. Capture should succeed; `live: true`.

With the default `"test"` client ID the yellow button may still render; use **Record PayPal hold** if the SDK rejects.

### D. Manual — USDT

1. Set `VITE_WALLETCONNECT_PROJECT_ID` and optionally `VITE_STUDIO_USDT_WALLET`.
2. Choose **USDT**, connect a wallet on Polygon or Arbitrum.
3. **Without** treasury address: signs a message only → `live: false`.
4. **With** treasury + wallet that holds USDT (and gas): real ERC-20 transfer → `live: true`. Use a small deposit service (`consult` = 50 CAD ≈ 36.23 USDT) on a test wallet.

### E. Pass & email

After any successful hold:

- Confirmation page issues a signed token and shows a QR.
- Open `/pass/<token>` on another device — should render the booking.
- With Resend/SendGrid/Postmark configured, the guest receives an email with the QR (or a link).

---

## Key source files

| Path | Role |
| --- | --- |
| `src/lib/studio.ts` | Services, deposits, artists, `money()`, `cadToUsdt()` |
| `src/lib/payments.ts` | Public payment config (`VITE_*` only) |
| `src/lib/stripe-deposit.ts` | Server `beginCardDeposit` — creates PaymentIntent |
| `src/lib/bookings.ts` | Zustand draft + completed bookings |
| `src/lib/confirm.functions.ts` | `sendConfirmation` / `readPass` server fns |
| `src/lib/confirm-mail.server.ts` | Pass signing + email providers |
| `src/components/book-page.tsx` | Three-step UI + `finish` / Confirmation |
| `src/components/pay-slot.tsx` | Lazy loads Stripe / PayPal / crypto |
| `src/components/pay/stripe-pay.tsx` | Card Element + confirm |
| `src/components/pay/paypal-pay.tsx` | PayPal buttons |
| `src/components/pay/crypto-pay.tsx` | RainbowKit + USDT transfer |
| `src/components/pay/wagmi-config.ts` | WalletConnect chains |
| `src/routes/pass.$token.tsx` | Scannable pass page |

---

## Security notes

- Never put `STRIPE_SECRET_KEY`, `TICKET_SECRET`, or mail API keys in `VITE_*` variables or client bundles.
- Never log secrets.
- Card amounts are computed only on the server from the service catalog.
- Pass tokens are HMAC-signed; keep `TICKET_SECRET` stable and private.
- Rotate Stripe/PayPal keys if they leak; invalidate old pass secrets only if you accept breaking existing QRs.

---

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| “Stripe couldn’t start the deposit” | Missing/wrong `STRIPE_SECRET_KEY`, or publishable + secret from different accounts/modes |
| PayPal button missing / rejected | Invalid Client ID or domain not allowed on the PayPal app |
| Wallet won’t connect | Wrong WalletConnect Project ID or blocked origin |
| USDT button only “Sign authorization” | `VITE_STUDIO_USDT_WALLET` empty or invalid |
| Email never arrives | No mail key, unverified `BOOKING_FROM_EMAIL`, or spam folder |
| Pass page “invalid” | Token truncated, or `TICKET_SECRET` changed after issue |

When in doubt, check the browser network tab for the `beginCardDeposit` server function response and the server logs for Stripe/mail errors.
