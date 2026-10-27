/// Studio payment config. Live keys are optional Vite env vars.
/// Card fields render through Stripe Elements when a publishable key is set.
/// PayPal uses the official React SDK (`test` renders buttons without a merchant).
/// USDT uses RainbowKit + wagmi. A treasury address turns on a real ERC-20 transfer.

const viteEnv =
  (typeof import.meta !== "undefined" &&
    (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env) ||
  {};

export const STRIPE_PUBLISHABLE_KEY =
  viteEnv.VITE_STRIPE_PUBLISHABLE_KEY?.trim() || "pk_test_TYooMQauvdEDq54NiTphI7jx";

export const PAYPAL_CLIENT_ID = viteEnv.VITE_PAYPAL_CLIENT_ID?.trim() || "test";

export const WALLETCONNECT_PROJECT_ID =
  viteEnv.VITE_WALLETCONNECT_PROJECT_ID?.trim() || "21fef48091f12692cad574a6f7753643";

export const STUDIO_USDT_WALLET = viteEnv.VITE_STUDIO_USDT_WALLET?.trim() ?? "";

export const USDT_BY_CHAIN: Record<number, `0x${string}`> = {
  137: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
  42161: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
};

export function isAddress(value: string): value is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}
