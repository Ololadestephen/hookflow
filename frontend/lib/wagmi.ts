import { http, createConfig } from "wagmi";
import { defineChain } from "viem";
import { injected } from "wagmi/connectors";

export const botChain = defineChain({
  id: 677,
  name: "BOT Chain Mainnet",
  nativeCurrency: {
    decimals: 18,
    name: "BOT",
    symbol: "BOT"
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.botchain.ai"]
    }
  },
  blockExplorers: {
    default: {
      name: "BOT Chain Explorer",
      url: "https://scan.botchain.ai"
    }
  }
});

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
  chains: [botChain],
  connectors: [injected()],
  transports: {
    [botChain.id]: http()
  },
  ssr: true
});
