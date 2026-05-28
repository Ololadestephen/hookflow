import { encodeAbiParameters, isAddress, keccak256, type Address, type Hex } from "viem";
import { hookFlowDeployment, hookFlowSelfServeDeployment } from "./contracts";

export const DYNAMIC_FEE_FLAG = 8_388_608;
export const DEFAULT_TICK_SPACING = 60;
export const DEFAULT_SQRT_PRICE_X96 = BigInt("8421858656182034097679017132552161");

export const hookFlowPoolManagerAbi = [
  {
    type: "function",
    name: "initialize",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "key",
        type: "tuple",
        components: [
          { name: "currency0", type: "address" },
          { name: "currency1", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "tickSpacing", type: "int24" },
          { name: "hooks", type: "address" }
        ]
      },
      { name: "sqrtPriceX96", type: "uint160" }
    ],
    outputs: [{ name: "tick", type: "int24" }]
  }
] as const;

export const hookFlowHookAbi = [
  {
    type: "function",
    name: "applySafePreset",
    stateMutability: "nonpayable",
    inputs: [
      { name: "poolId", type: "bytes32" },
      { name: "preset", type: "uint8" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "applyPreset",
    stateMutability: "nonpayable",
    inputs: [
      { name: "poolId", type: "bytes32" },
      { name: "preset", type: "uint8" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "owner",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }]
  }
] as const;

export const erc20ApprovalAbi = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ name: "", type: "bool" }]
  }
] as const;

export const erc20MetadataAbi = [
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }]
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }]
  }
] as const;

export const hookFlowLiquidityRouterAbi = [
  {
    type: "function",
    name: "modifyLiquidity",
    stateMutability: "payable",
    inputs: [
      {
        name: "key",
        type: "tuple",
        components: [
          { name: "currency0", type: "address" },
          { name: "currency1", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "tickSpacing", type: "int24" },
          { name: "hooks", type: "address" }
        ]
      },
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "tickLower", type: "int24" },
          { name: "tickUpper", type: "int24" },
          { name: "liquidityDelta", type: "int256" },
          { name: "salt", type: "bytes32" }
        ]
      },
      { name: "amount0Max", type: "uint256" },
      { name: "amount1Max", type: "uint256" },
      { name: "deadline", type: "uint256" },
      { name: "hookData", type: "bytes" }
    ],
    outputs: [{ name: "delta", type: "int256" }]
  }
] as const;

export const presetOptions = [
  { label: "Stable Pair", value: 0, description: "Lower fees and softer toxicity response for correlated assets." },
  { label: "Volatile Pair", value: 1, description: "Balanced protection for active assets like USDT0/WOKB." },
  { label: "Launch Pool", value: 2, description: "Aggressive defense for new or uncertain liquidity." },
  { label: "Long Tail Pool", value: 3, description: "Higher protection for thin and volatile markets." }
] as const;

export const verifiedHookDefaults = {
  token0: hookFlowSelfServeDeployment.token0 as Address,
  token1: hookFlowSelfServeDeployment.token1 as Address,
  hook: hookFlowSelfServeDeployment.hook as Address,
  poolManager: hookFlowSelfServeDeployment.poolManager as Address,
  liquidityRouter: hookFlowSelfServeDeployment.liquidityRouter as Address,
  poolId: hookFlowSelfServeDeployment.poolId as Hex,
  sqrtPriceX96: DEFAULT_SQRT_PRICE_X96,
  tickSpacing: DEFAULT_TICK_SPACING
} as const;

export function sortTokenAddresses(first: string, second: string) {
  if (!isAddress(first) || !isAddress(second)) return null;
  const a = first as Address;
  const b = second as Address;
  return BigInt(a) < BigInt(b) ? { token0: a, token1: b } : { token0: b, token1: a };
}

export function poolKeyFor(token0: Address, token1: Address, tickSpacing = DEFAULT_TICK_SPACING) {
  return {
    currency0: token0,
    currency1: token1,
    fee: DYNAMIC_FEE_FLAG,
    tickSpacing,
    hooks: verifiedHookDefaults.hook
  } as const;
}

export function poolIdFor(token0: Address, token1: Address, tickSpacing = DEFAULT_TICK_SPACING) {
  return keccak256(
    encodeAbiParameters(
      [
        { name: "currency0", type: "address" },
        { name: "currency1", type: "address" },
        { name: "fee", type: "uint24" },
        { name: "tickSpacing", type: "int24" },
        { name: "hooks", type: "address" }
      ],
      [token0, token1, DYNAMIC_FEE_FLAG, tickSpacing, verifiedHookDefaults.hook]
    )
  );
}

export function txUrl(hash: string) {
  return `${hookFlowDeployment.explorerBaseUrl}/tx/${hash}`;
}
