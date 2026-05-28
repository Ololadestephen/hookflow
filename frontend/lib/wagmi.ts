import { http, createConfig } from "wagmi";
import { defineChain } from "viem";
import { injected } from "wagmi/connectors";

export const xLayer = defineChain({
  id: 196,
  name: "X Layer",
  nativeCurrency: {
    decimals: 18,
    name: "OKB",
    symbol: "OKB"
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.xlayer.tech"]
    }
  },
  blockExplorers: {
    default: {
      name: "OKLink",
      url: "https://www.oklink.com/xlayer"
    }
  }
});

export const wagmiConfig = createConfig({
  chains: [xLayer],
  connectors: [injected()],
  transports: {
    [xLayer.id]: http()
  },
  ssr: true
});
