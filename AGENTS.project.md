# Venom Tattoos — project notes

Queen West tattoo studio site. Keep this identity: near-black ground, acid lime `#d6ff4a`, cream type, Fraunces display + Outfit body. Do not introduce a second accent hue, a purple theme, or a generic sans-only redesign.

Auth is **off**. Bookings are **not** in Postgres. Do not import `authMiddleware`, `requireUserId`, or `@/lib/db` for this app. Do not add login routes.

## Map

| Path | Role |
| --- | --- |
| `src/routes/index.tsx` | Home route. UI lives in `src/components/home-page.tsx`. |
| `src/routes/gallery.tsx` | Filterable wall. UI in `src/components/gallery-page.tsx`. |
| `src/routes/book.tsx` | Search params `artist` and `service` (ids from `src/lib/studio.ts`). UI in `src/components/book-page.tsx`. |
| `src/routes/pass.$token.tsx` | Signed booking pass. The QR on the confirmation and in the email opens this page. |
| `src/routes/__root.tsx` | Document shell. Keep `AuthProvider`, `PreviewHostBridge`, the favicon link, and the font stylesheet. No `og:*` or `twitter:card` tags here. |
| `src/router.tsx` | Named `getRouter()` with `previewPathRewrite()` and `AppErrorComponent`. |
| `src/components/logo.tsx` | The mark: a cut V, a needle, one drop. Header, footer, and hero all use this. If you redraw it, redraw `public/favicon.svg` to match. |
| `src/components/site-chrome.tsx` | Header, footer, scroll progress, `Shell`. |
| `src/components/book-page.tsx` | Three-step checkout: Sitting → When → Checkout. Draft persists in zustand. |
| `src/components/pay-slot.tsx` | Lazy-loads Stripe, PayPal, or the wallet. Do not static-import `crypto-pay` into a route — wagmi must stay client-only. |
| `src/components/pay/stripe-pay.tsx` | Card Element. Calls `beginCardDeposit`. |
| `src/components/pay/paypal-pay.tsx` | PayPal JS buttons, currency CAD. |
| `src/components/pay/crypto-pay.tsx` | RainbowKit + wagmi. USDT on Polygon (137) or Arbitrum (42161). |
| `src/components/pay/wagmi-config.ts` | WalletConnect config. One module-level config. |
| `src/lib/studio.ts` | Address, artists, services, pieces, hours, money, dates, slots. Deposit amounts are the source of truth for charges. |
| `src/lib/bookings.ts` | Zustand persist key `venom-bookings`, `skipHydration: true`. Root rehydrates in `ClientBoot`. |
| `src/lib/payments.ts` | Public payment config. Only `VITE_` variables. |
| `src/lib/stripe-deposit.ts` | Server function. Reads `STRIPE_SECRET_KEY` inside the handler only. Charges `service.deposit` in CAD cents — never a client-supplied amount. |
| `src/styles.css` | Tokens and motion. Reduced motion kills the keyframes. Buttons already set `cursor: pointer`. |
| `public/studio/` | Hero, interior, artists, tattoo photographs. Do not replace with placeholders. |
| `README.md` | How a human turns on live payments. |

## Checkout rules

- Steps are 0 sitting, 1 artist + date + time, 2 details + pay.
- Payment UI stays non-interactive until name, email, 10-digit phone, placement, and an idea of at least 8 characters are present.
- `onPaid(ref, live)` — `live: true` only when money or a PayPal capture or an on-chain USDT transfer actually happened. Preview holds pass `false`.
- After a hold, `sendConfirmation` signs a pass and emails it to the guest. The message includes a scannable QR (inline image when a mail provider is configured, otherwise an attached PNG). The code opens `/pass/$token` on any phone. Bookings stay out of Postgres — the pass token is the record.
- Allowed deposits are whatever `services` lists. Update the menu and the charge together by editing `src/lib/studio.ts` only.
- Guest can jump back to a finished step. They cannot skip ahead.
- `?artist=` preselects that artist and opens the When step after the booking store rehydrates. `?service=` preselects the sitting.

## Payments

See `README.md` for the variables. Short version:

- `VITE_STRIPE_PUBLISHABLE_KEY` + server `STRIPE_SECRET_KEY` (same Stripe account) → real card charge via PaymentIntent.
- Secret missing → `createPaymentMethod` only, confirmation says no funds moved.
- `VITE_PAYPAL_CLIENT_ID` defaults to `test` (preview buttons). A merchant id captures.
- `VITE_STUDIO_USDT_WALLET` empty → wallet signs a message. Set an `0x` address → ERC-20 transfer of the studio USDT quote (`STUDIO_RATE_CAD_PER_USDT`).

Never log the secret. Never prefix it with `VITE_`.

## Motion

Classes in `src/styles.css`: `rise-in`, `reveal` + `is-in` (IntersectionObserver in the home page), `step-in`, `page-in`, `pop`, `logo-stroke`, `logo-drop`, `ticker-track`, `ken`, `shot`, `live-dot`, `faq-panel`, `nav-panel`, `check-pop`, `tap` (scale 0.96 on press). Prefer CSS transitions for toggles. Do not add a motion library for one effect.

## Brand files

`src/lib/og/site.json` and `public/og.jpg` are the share card. Leave the Grok PWA injector and `public/__grok/` alone.

## Dev

`sh /workspace/startup.sh` runs `npm run dev` on port 8080. Do not start Vite directly.
