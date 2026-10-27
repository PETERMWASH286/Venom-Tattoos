import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { arbitrum, polygon } from "wagmi/chains";
import { WALLETCONNECT_PROJECT_ID } from "@/lib/payments";

export const wagmiConfig = getDefaultConfig({
  appName: "Venom Tattoos",
  projectId: WALLETCONNECT_PROJECT_ID,
  chains: [polygon, arbitrum],
  ssr: true,
});
