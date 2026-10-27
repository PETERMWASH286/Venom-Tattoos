import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectButton, RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { parseUnits } from "viem";
import { useAccount, useSignMessage, useSwitchChain, useWriteContract, WagmiProvider } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { arbitrum, polygon } from "wagmi/chains";
import "@rainbow-me/rainbowkit/styles.css";
import { cadToUsdt, money } from "@/lib/studio";
import { isAddress, STUDIO_USDT_WALLET, USDT_BY_CHAIN } from "@/lib/payments";
import { wagmiConfig } from "@/components/pay/wagmi-config";

const queryClient = new QueryClient();

const erc20TransferAbi = [
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

const chains = [
  { id: polygon.id, label: "Polygon" },
  { id: arbitrum.id, label: "Arbitrum" },
] as const;

export function CryptoPay({
  amount,
  note,
  onPaid,
}: {
  amount: number;
  note: string;
  onPaid: (ref: string, live: boolean) => void;
}) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          modalSize="compact"
          theme={darkTheme({
            accentColor: "#d6ff4a",
            accentColorForeground: "#14160a",
            borderRadius: "medium",
            fontStack: "system",
          })}
        >
          <CryptoBody amount={amount} note={note} onPaid={onPaid} />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

function CryptoBody({
  amount,
  note,
  onPaid,
}: {
  amount: number;
  note: string;
  onPaid: (ref: string, live: boolean) => void;
}) {
  const usdt = cadToUsdt(amount);
  const { address, isConnected, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { signMessageAsync } = useSignMessage();
  const { writeContractAsync } = useWriteContract();
  const [network, setNetwork] = useState<(typeof chains)[number]["id"]>(polygon.id);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const treasuryReady = isAddress(STUDIO_USDT_WALLET);
  const networkLabel = chains.find((chain) => chain.id === network)?.label ?? "Polygon";

  async function pay() {
    setError("");
    if (!isConnected || !address) {
      setError("Connect a wallet first.");
      return;
    }
    setBusy(true);
    try {
      if (chainId !== network) {
        await switchChainAsync({ chainId: network });
      }
      if (isAddress(STUDIO_USDT_WALLET)) {
        const hash = await writeContractAsync({
          address: USDT_BY_CHAIN[network],
          abi: erc20TransferAbi,
          functionName: "transfer",
          args: [STUDIO_USDT_WALLET, parseUnits(usdt, 6)],
          chainId: network,
        });
        await waitForTransactionReceipt(wagmiConfig, { hash });
        onPaid(hash, true);
        return;
      }
      const signature = await signMessageAsync({
        message: [
          "Venom Tattoos",
          "Booking deposit authorization",
          `Amount: ${money(amount)} (${usdt} USDT studio quote)`,
          `Network: ${networkLabel}`,
          note,
          "This signature does not move tokens.",
        ].join("\n"),
      });
      onPaid(signature, false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Wallet request was cancelled.";
      setError(message.length > 180 ? "Wallet request was cancelled." : message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted">
        Connect with RainbowKit. USDT on {networkLabel} is quoted at {usdt} USDT for {money(amount)}{" "}
        (studio rate, 1 USDT = 1.38 CAD, not a live market). Gas stays on the L2.
        {treasuryReady
          ? " Confirming sends USDT to the studio treasury."
          : " The treasury address isn’t published in this preview, so your wallet signs an authorization and no tokens move."}
      </p>
      <div className="flex flex-wrap gap-2">
        {chains.map((chain) => (
          <button
            key={chain.id}
            type="button"
            className={`tap h-11 rounded-full border px-4 text-sm ${network === chain.id ? "border-primary bg-primary text-ink" : "border-line"}`}
            onClick={() => setNetwork(chain.id)}
          >
            {chain.label}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between gap-3 rounded-card border border-line bg-surface px-4 py-3">
        <div>
          <p className="text-xs text-muted">Deposit</p>
          <p className="font-display text-2xl">{usdt} USDT</p>
        </div>
        <ConnectButton />
      </div>
      {error ? (
        <p role="alert" className="text-sm">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        className="tap h-12 w-full rounded-full bg-primary text-sm font-medium text-ink disabled:opacity-40"
        disabled={!isConnected || busy}
        onClick={() => void pay()}
      >
        {busy ? "Waiting for wallet…" : treasuryReady ? `Send ${usdt} USDT` : "Sign deposit authorization"}
      </button>
    </div>
  );
}
