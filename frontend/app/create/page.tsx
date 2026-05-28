"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { encodePacked, isAddress, keccak256, parseUnits, zeroHash, type Address, type Hex } from "viem";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContracts,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract
} from "wagmi";
import {
  DEFAULT_SQRT_PRICE_X96,
  erc20ApprovalAbi,
  erc20MetadataAbi,
  hookFlowHookAbi,
  hookFlowLiquidityRouterAbi,
  hookFlowPoolManagerAbi,
  poolIdFor,
  poolKeyFor,
  presetOptions,
  sortTokenAddresses,
  txUrl,
  verifiedHookDefaults
} from "../../lib/createPool";
import { xLayer } from "../../lib/wagmi";
import { AppNav } from "../components/AppNav";
import { Providers } from "../providers";

function shortValue(value: string) {
  return value.length > 30 ? `${value.slice(0, 10)}...${value.slice(-8)}` : value;
}

function tokenMetadata(result: unknown) {
  return typeof result === "string" || typeof result === "number" ? String(result) : "unknown";
}

function knownSymbol(address: string) {
  if (address.toLowerCase() === verifiedHookDefaults.token0.toLowerCase()) return "USDT0";
  if (address.toLowerCase() === verifiedHookDefaults.token1.toLowerCase()) return "WOKB";
  return null;
}

function knownDecimals(address: string) {
  if (address.toLowerCase() === verifiedHookDefaults.token0.toLowerCase()) return 6;
  if (address.toLowerCase() === verifiedHookDefaults.token1.toLowerCase()) return 18;
  return null;
}

function decimalsFromMetadata(value: string) {
  const decimals = Number(value);
  return Number.isInteger(decimals) && decimals >= 0 ? decimals : 18;
}

function parsePositiveBigInt(value: string) {
  try {
    const parsed = BigInt(value || "0");
    return parsed > BigInt(0) ? parsed : BigInt(0);
  } catch {
    return BigInt(0);
  }
}

function parseOptionalUnits(value: string, decimals: number) {
  try {
    if (!value.trim()) return null;
    return parseUnits(value, decimals);
  } catch {
    return null;
  }
}

function friendlyTransactionError(error: Error) {
  const message = error.message.toLowerCase();

  if (message.includes("user rejected") || message.includes("user denied") || message.includes("rejected the request")) {
    return "Transaction cancelled. No changes were made.";
  }

  if (message.includes("insufficient funds")) {
    return "Not enough funds for this transaction. Check your token balance and OKB for gas.";
  }

  if (message.includes("transfer amount exceeds balance") || message.includes("amount0exceeded") || message.includes("amount1exceeded")) {
    return "Not enough token balance for this liquidity position. Lower the deposit amount or add more tokens.";
  }

  if (message.includes("allowance")) {
    return "Token approval is missing or too low. Approve the token amount first, then try again.";
  }

  if (message.includes("wrong network") || message.includes("chain") || message.includes("unsupported")) {
    return "Wrong network. Switch your wallet to X Layer mainnet and try again.";
  }

  if (message.includes("already configured") || message.includes("poolalreadyconfigured")) {
    return "This pool already has a HookFlow preset. You can continue with initialization or liquidity.";
  }

  if (message.includes("execution reverted") || message.includes("reverted")) {
    return "The contract rejected the transaction. Check the selected pair, preset, approvals, and position range.";
  }

  return "Something went wrong while sending the transaction. Please check your wallet and try again.";
}

function CreateProtectedPoolContent() {
  const [pairMode, setPairMode] = useState<"default" | "custom">("default");
  const [tokenA, setTokenA] = useState<string>(verifiedHookDefaults.token0);
  const [tokenB, setTokenB] = useState<string>(verifiedHookDefaults.token1);
  const [tokenAAmount, setTokenAAmount] = useState("1");
  const [tokenBAmount, setTokenBAmount] = useState("0.016");
  const [tickLower, setTickLower] = useState("231480");
  const [tickUpper, setTickUpper] = useState("240000");
  const [liquidityDelta, setLiquidityDelta] = useState("212907858906");
  const [preset, setPreset] = useState<(typeof presetOptions)[number]["value"]>(1);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const { address, chainId, isConnected } = useAccount();
  const { connectors, connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { data: hash, error, isPending, writeContract } = useWriteContract();
  const { data: hookOwner } = useReadContract({
    address: verifiedHookDefaults.hook,
    abi: hookFlowHookAbi,
    functionName: "owner",
    chainId: xLayer.id
  });

  const sortedTokens = useMemo(() => sortTokenAddresses(tokenA, tokenB), [tokenA, tokenB]);
  const poolId = useMemo(() => {
    if (!sortedTokens) return null;
    return poolIdFor(sortedTokens.token0, sortedTokens.token1);
  }, [sortedTokens]);
  const poolKey = useMemo(() => {
    if (!sortedTokens) return null;
    return poolKeyFor(sortedTokens.token0, sortedTokens.token1);
  }, [sortedTokens]);
  const lpSalt = useMemo(() => {
    return address ? keccak256(encodePacked(["address"], [address])) : zeroHash;
  }, [address]);

  const isLiveProofPool = poolId?.toLowerCase() === verifiedHookDefaults.poolId.toLowerCase();
  const wrongNetwork = isConnected && chainId !== xLayer.id;
  const tokenContracts =
    sortedTokens && isAddress(sortedTokens.token0) && isAddress(sortedTokens.token1)
      ? ([
          { address: sortedTokens.token0, abi: erc20MetadataAbi, functionName: "symbol", chainId: xLayer.id },
          { address: sortedTokens.token0, abi: erc20MetadataAbi, functionName: "decimals", chainId: xLayer.id },
          { address: sortedTokens.token1, abi: erc20MetadataAbi, functionName: "symbol", chainId: xLayer.id },
          { address: sortedTokens.token1, abi: erc20MetadataAbi, functionName: "decimals", chainId: xLayer.id }
        ] as const)
      : undefined;

  const { data: readResults } = useReadContracts({
    contracts: tokenContracts,
    query: { enabled: Boolean(tokenContracts) }
  });
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
    chainId: xLayer.id
  });

  const token0Symbol = tokenMetadata(readResults?.[0]?.result);
  const token0Decimals = tokenMetadata(readResults?.[1]?.result);
  const token1Symbol = tokenMetadata(readResults?.[2]?.result);
  const token1Decimals = tokenMetadata(readResults?.[3]?.result);
  const tokenASymbol =
    knownSymbol(tokenA) ??
    (sortedTokens && isAddress(tokenA) && tokenA.toLowerCase() === sortedTokens.token0.toLowerCase()
      ? token0Symbol
      : token1Symbol);
  const tokenBSymbol =
    knownSymbol(tokenB) ??
    (sortedTokens && isAddress(tokenB) && tokenB.toLowerCase() === sortedTokens.token0.toLowerCase()
      ? token0Symbol
      : token1Symbol);
  const displayToken0Symbol = sortedTokens ? knownSymbol(sortedTokens.token0) ?? token0Symbol : token0Symbol;
  const displayToken1Symbol = sortedTokens ? knownSymbol(sortedTokens.token1) ?? token1Symbol : token1Symbol;
  const tokenALabel = tokenASymbol === "unknown" ? "First token" : tokenASymbol;
  const tokenBLabel = tokenBSymbol === "unknown" ? "Second token" : tokenBSymbol;
  const tokenADecimals =
    knownDecimals(tokenA) ??
    (sortedTokens && isAddress(tokenA) && tokenA.toLowerCase() === sortedTokens.token0.toLowerCase()
      ? decimalsFromMetadata(token0Decimals)
      : decimalsFromMetadata(token1Decimals));
  const tokenBDecimals =
    knownDecimals(tokenB) ??
    (sortedTokens && isAddress(tokenB) && tokenB.toLowerCase() === sortedTokens.token0.toLowerCase()
      ? decimalsFromMetadata(token0Decimals)
      : decimalsFromMetadata(token1Decimals));
  const parsedTickLower = Number(tickLower);
  const parsedTickUpper = Number(tickUpper);
  const parsedLiquidityDelta = parsePositiveBigInt(liquidityDelta);
  const parsedTokenAAmount = parseOptionalUnits(tokenAAmount, tokenADecimals);
  const parsedTokenBAmount = parseOptionalUnits(tokenBAmount, tokenBDecimals);
  const hasValidLiquidityParams =
    Number.isInteger(parsedTickLower) &&
    Number.isInteger(parsedTickUpper) &&
    parsedTickLower < parsedTickUpper &&
    parsedLiquidityDelta > BigInt(0);
  const maxAmounts =
    sortedTokens && parsedTokenAAmount !== null && parsedTokenBAmount !== null
      ? tokenA.toLowerCase() === sortedTokens.token0.toLowerCase()
        ? { amount0Max: parsedTokenAAmount, amount1Max: parsedTokenBAmount }
        : { amount0Max: parsedTokenBAmount, amount1Max: parsedTokenAAmount }
      : null;
  const canConfigurePreset =
    typeof address === "string" && typeof hookOwner === "string" && address.toLowerCase() === hookOwner.toLowerCase();
  const customCreationLocked = pairMode === "custom" && !canConfigurePreset;

  function useDefaultPair() {
    setPairMode("default");
    setTokenA(verifiedHookDefaults.token0);
    setTokenB(verifiedHookDefaults.token1);
    setTokenAAmount("1");
    setTokenBAmount("0.016");
    setPreset(1);
  }

  function useCustomPair() {
    setPairMode("custom");
    if (tokenA.toLowerCase() === verifiedHookDefaults.token0.toLowerCase()) setTokenA("");
    if (tokenB.toLowerCase() === verifiedHookDefaults.token1.toLowerCase()) setTokenB("");
  }

  function configurePool() {
    if (!poolId) return;
    setLastAction("Configure HookFlow preset");
    writeContract({
      address: verifiedHookDefaults.hook,
      abi: hookFlowHookAbi,
      functionName: "applySafePreset",
      args: [poolId as Hex, preset],
      chainId: xLayer.id
    });
  }

  function initializePool() {
    if (!poolKey) return;
    setLastAction("Initialize v4 pool");
    writeContract({
      address: verifiedHookDefaults.poolManager,
      abi: hookFlowPoolManagerAbi,
      functionName: "initialize",
      args: [poolKey, DEFAULT_SQRT_PRICE_X96],
      chainId: xLayer.id
    });
  }

  function approveToken(token: string, amount: string, decimals: number, label: string) {
    if (!isAddress(token) || !amount) return;
    setLastAction(`Approve ${label}`);
    writeContract({
      address: token as Address,
      abi: erc20ApprovalAbi,
      functionName: "approve",
      args: [verifiedHookDefaults.liquidityRouter, parseUnits(amount, decimals)],
      chainId: xLayer.id
    });
  }

  function addLiquidity() {
    if (!poolKey || !hasValidLiquidityParams || !maxAmounts) return;
    setLastAction("Add liquidity");
    writeContract({
      address: verifiedHookDefaults.liquidityRouter,
      abi: hookFlowLiquidityRouterAbi,
      functionName: "modifyLiquidity",
      args: [
        poolKey,
        {
          tickLower: parsedTickLower,
          tickUpper: parsedTickUpper,
          liquidityDelta: parsedLiquidityDelta,
          salt: lpSalt
        },
        maxAmounts.amount0Max,
        maxAmounts.amount1Max,
        BigInt(Math.floor(Date.now() / 1000) + 20 * 60),
        "0x"
      ],
      chainId: xLayer.id
    });
  }

  return (
    <main className="min-h-screen bg-background text-on-background lg:grid lg:grid-cols-[250px_minmax(0,1fr)]">
      <AppNav active="create" />
      <section className="px-4 py-5 md:px-8 md:py-6">
        <div className="mx-auto max-w-6xl">
          <header className="mb-6 border-b border-outline-variant/60 pb-6">
            <div className="mb-5 flex flex-col gap-3 rounded-lg border border-outline-variant/60 bg-surface-container-low px-4 py-3 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-on-surface-variant">
                {address ? (
                  <>
                    <span className="font-mono-data text-primary">{shortValue(address)}</span>
                    <span className="mx-2 text-outline">/</span>
                    {wrongNetwork ? "Wrong network" : "X Layer Mainnet"}
                  </>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2 md:gap-3">
                {wrongNetwork ? (
                  <button
                    className="rounded bg-primary px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-on-primary disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isSwitching}
                    onClick={() => switchChain({ chainId: xLayer.id })}
                    type="button"
                  >
                    {isSwitching ? "Switching" : "Switch to X Layer"}
                  </button>
                ) : null}

                {isConnected ? (
                  <button
                    className="rounded border border-outline-variant/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-on-surface-variant hover:text-primary"
                    onClick={() => disconnect()}
                    type="button"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    className="rounded bg-primary px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-on-primary disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!connectors[0] || isConnecting}
                    onClick={() => connectors[0] && connect({ connector: connectors[0] })}
                    type="button"
                  >
                    {isConnecting ? "Connecting" : "Connect Wallet"}
                  </button>
                )}
              </div>
            </div>
          <p className="mb-3 inline-flex rounded border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
            Self-Serve LP MVP
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-normal md:text-5xl">Create a HookFlow pool</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-on-surface-variant">
            Add liquidity to the live USDT0/WOKB protected pool, or prepare a custom token pair for an operator-approved
            HookFlow pool.
          </p>
        </header>

        <section className="mb-5 grid gap-5 lg:grid-cols-[1fr_0.85fr]">
          <article className="rounded-lg border border-outline-variant/60 bg-surface-container-low p-4 md:p-5">
            <h2 className="font-display text-2xl font-semibold">Choose pool and amounts</h2>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              Start with the live USDT0/WOKB pool, or open a custom pair when you want to paste token contract addresses.
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <button
                className={`rounded border p-4 text-left transition ${
                  pairMode === "default"
                    ? "border-primary bg-primary/10"
                    : "border-outline-variant/60 bg-background/60 hover:border-primary/50"
                }`}
                onClick={useDefaultPair}
                type="button"
              >
                <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                  Default pair
                </span>
                <span className="mt-2 block font-semibold text-primary">USDT0 / WOKB</span>
                <span className="mt-2 block text-sm leading-6 text-on-surface-variant">
                  Ready-to-use protected pool on X Layer mainnet.
                </span>
              </button>

              <button
                className={`rounded border p-4 text-left transition ${
                  pairMode === "custom"
                    ? "border-primary bg-primary/10"
                    : "border-outline-variant/60 bg-background/60 hover:border-primary/50"
                }`}
                onClick={useCustomPair}
                type="button"
              >
                <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                  Custom pair
                </span>
                <span className="mt-2 block font-semibold text-primary">Paste token contracts</span>
                <span className="mt-2 block text-sm leading-6 text-on-surface-variant">
                  Prepare another token pair for a protected HookFlow pool.
                </span>
              </button>
            </div>

            {pairMode === "default" ? (
              <div className="mt-5 rounded border border-primary/20 bg-primary/10 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Selected pair</p>
                    <p className="mt-2 text-lg font-semibold">USDT0 / WOKB</p>
                  </div>
                  <span className="w-fit rounded border border-primary/20 bg-background/50 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                    Live pool
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-5 grid gap-4 rounded border border-outline-variant/60 bg-background/50 p-4">
                <h3 className="font-display text-xl font-semibold">Custom pair</h3>
                <p className="text-sm leading-6 text-on-surface-variant">
                  Custom pair preset application is restricted to the hook operator to prevent pool squatting and
                  front-running.
                </p>
                <label className="block">
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                    First token contract address
                  </span>
                  <input
                    className="mt-2 w-full rounded border border-outline-variant/60 bg-background/70 px-3 py-3 font-mono-data text-sm text-on-background outline-none transition focus:border-primary"
                    onChange={(event) => setTokenA(event.target.value)}
                    placeholder="0x..."
                    value={tokenA}
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                    Second token contract address
                  </span>
                  <input
                    className="mt-2 w-full rounded border border-outline-variant/60 bg-background/70 px-3 py-3 font-mono-data text-sm text-on-background outline-none transition focus:border-primary"
                    onChange={(event) => setTokenB(event.target.value)}
                    placeholder="0x..."
                    value={tokenB}
                  />
                </label>
              </div>
            )}

            <div className="mt-5 grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                    {tokenALabel} amount
                  </span>
                  <input
                    className="mt-2 w-full rounded border border-outline-variant/60 bg-background/70 px-3 py-3 font-mono-data text-sm text-on-background outline-none transition focus:border-primary"
                    inputMode="decimal"
                    onChange={(event) => setTokenAAmount(event.target.value)}
                    value={tokenAAmount}
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                    {tokenBLabel} amount
                  </span>
                  <input
                    className="mt-2 w-full rounded border border-outline-variant/60 bg-background/70 px-3 py-3 font-mono-data text-sm text-on-background outline-none transition focus:border-primary"
                    inputMode="decimal"
                    onChange={(event) => setTokenBAmount(event.target.value)}
                    value={tokenBAmount}
                  />
                </label>
              </div>
              <p className="rounded border border-primary/20 bg-primary/8 px-4 py-3 text-sm leading-6 text-on-surface-variant">
                Use at least about $1 of {tokenALabel} and $1 of {tokenBLabel} for the live pool.
              </p>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {presetOptions.map((option) => (
                <button
                  className={`rounded border p-4 text-left transition ${
                    preset === option.value
                      ? "border-primary bg-primary/10"
                      : "border-outline-variant/60 bg-background/60 hover:border-primary/50"
                  }`}
                  key={option.value}
                  onClick={() => setPreset(option.value)}
                  type="button"
                >
                  <span className="font-semibold text-primary">{option.label}</span>
                  <span className="mt-2 block text-sm leading-6 text-on-surface-variant">{option.description}</span>
                </button>
              ))}
            </div>
          </article>

          <aside className="rounded-lg border border-outline-variant/60 bg-surface-container-low p-4 md:p-5">
            <h2 className="font-display text-2xl font-semibold">Pool preview</h2>
            <div className="mt-5 space-y-3">
              <div className="rounded border border-outline-variant/60 bg-background/60 p-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">First pool token</p>
                <p className="mt-1 break-all font-mono-data text-xs">{sortedTokens?.token0 ?? "invalid token address"}</p>
                <p className="mt-1 text-xs text-primary">
                  {displayToken0Symbol} / {token0Decimals === "unknown" ? "6" : token0Decimals} decimals
                </p>
              </div>
              <div className="rounded border border-outline-variant/60 bg-background/60 p-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">Second pool token</p>
                <p className="mt-1 break-all font-mono-data text-xs">{sortedTokens?.token1 ?? "invalid token address"}</p>
                <p className="mt-1 text-xs text-primary">
                  {displayToken1Symbol} / {token1Decimals === "unknown" ? "18" : token1Decimals} decimals
                </p>
              </div>
              <div className="rounded border border-outline-variant/60 bg-background/60 p-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">Pool ID</p>
                <p className="mt-1 break-all font-mono-data text-xs">{poolId ?? "not available"}</p>
              </div>
              <p className="text-xs leading-5 text-on-surface-variant">
                HookFlow sorts tokens automatically for Uniswap v4, so you can paste the pair in either order.
              </p>
              {pairMode === "custom" ? (
                <p className="text-xs leading-5 text-on-surface-variant">
                  Custom tokens are unverified by default. Double-check token contracts before approving any asset.
                </p>
              ) : null}
            </div>
          </aside>
        </section>

        <section className="mb-5 rounded-lg border border-outline-variant/60 bg-surface-container-low p-4 md:p-5">
          <h2 className="font-display text-2xl font-semibold">Position range</h2>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            HookFlow uses a recommended range for the live USDT0/WOKB pool. Most LPs can leave this unchanged.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded border border-primary/20 bg-primary/10 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Range</p>
              <p className="mt-2 text-lg font-semibold">Default balanced range</p>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">Designed for the USDT0/WOKB proof pool.</p>
            </div>
            <div className="rounded border border-primary/20 bg-primary/10 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Liquidity size</p>
              <p className="mt-2 text-lg font-semibold">Auto-calculated demo size</p>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">Used by the router when adding the position.</p>
            </div>
          </div>
          <details className="mt-5 rounded border border-outline-variant/60 bg-background/50 p-4">
            <summary className="cursor-pointer text-xs font-bold uppercase tracking-[0.14em] text-primary">
              Show technical values
            </summary>
            <p className="mt-3 text-sm leading-6 text-on-surface-variant">
              These are Uniswap v4 internal values. Change them only if you already know the tick range and liquidity size
              you want.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                  Lower tick
                </span>
                <input
                  className="mt-2 w-full rounded border border-outline-variant/60 bg-background/70 px-3 py-3 font-mono-data text-sm text-on-background outline-none transition focus:border-primary"
                  inputMode="numeric"
                  onChange={(event) => setTickLower(event.target.value)}
                  value={tickLower}
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                  Upper tick
                </span>
                <input
                  className="mt-2 w-full rounded border border-outline-variant/60 bg-background/70 px-3 py-3 font-mono-data text-sm text-on-background outline-none transition focus:border-primary"
                  inputMode="numeric"
                  onChange={(event) => setTickUpper(event.target.value)}
                  value={tickUpper}
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                  Liquidity units
                </span>
                <input
                  className="mt-2 w-full rounded border border-outline-variant/60 bg-background/70 px-3 py-3 font-mono-data text-sm text-on-background outline-none transition focus:border-primary"
                  inputMode="numeric"
                  onChange={(event) => setLiquidityDelta(event.target.value)}
                  value={liquidityDelta}
                />
              </label>
            </div>
          </details>
        </section>

        <section className="rounded-lg border border-outline-variant/60 bg-surface-container-low p-4 md:p-5">
          <h2 className="font-display text-2xl font-semibold">Transaction Path</h2>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            For a new pair, apply a safe preset and initialize the pool first. For the live USDT0/WOKB pool, skip
            directly to token approvals and add liquidity.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <button
              className="rounded bg-primary px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-on-primary disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!isConnected || wrongNetwork || !poolId || isPending || isLiveProofPool || !canConfigurePreset}
              onClick={configurePool}
              type="button"
            >
              Apply Safe Preset
            </button>
            <button
              className="rounded border border-primary/30 px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-primary disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!isConnected || wrongNetwork || !poolKey || isPending || isLiveProofPool || customCreationLocked}
              onClick={initializePool}
              type="button"
            >
              Initialize Pool
            </button>
            <button
              className="rounded border border-primary/30 px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-primary disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!isConnected || wrongNetwork || !isAddress(tokenA) || !tokenAAmount || isPending}
              onClick={() => approveToken(tokenA, tokenAAmount, tokenADecimals, tokenALabel)}
              type="button"
            >
              Approve {tokenALabel}
            </button>
            <button
              className="rounded border border-primary/30 px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-primary disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!isConnected || wrongNetwork || !isAddress(tokenB) || !tokenBAmount || isPending}
              onClick={() => approveToken(tokenB, tokenBAmount, tokenBDecimals, tokenBLabel)}
              type="button"
            >
              Approve {tokenBLabel}
            </button>
            <button
              className="rounded bg-primary px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-on-primary disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!isConnected || wrongNetwork || !poolKey || !hasValidLiquidityParams || !maxAmounts || isPending}
              onClick={addLiquidity}
              type="button"
            >
              Add Liquidity
            </button>
          </div>

          <div className="mt-5 rounded border border-outline-variant/60 bg-background/60 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">Status</p>
            <p className="mt-2 text-sm text-on-surface-variant">
              {!isConnected
                ? "Connect a wallet to start."
                : wrongNetwork
                  ? "Switch to X Layer mainnet."
                  : customCreationLocked
                    ? "Custom pair preset application is restricted to the hook operator. The default USDT0/WOKB LP path is still open."
                  : isLiveProofPool
                    ? "Live pool selected. Approve both tokens, add liquidity, then monitor the dashboard."
                    : "New pool selected. Apply a safe preset, initialize the pool, approve tokens, then add liquidity."}
            </p>
            <p className="mt-2 text-xs leading-5 text-on-surface-variant">
              Approvals let the router use the amounts you entered. Add liquidity creates the protected v4 position.
            </p>
            {lastAction ? <p className="mt-2 text-sm text-primary">Last action: {lastAction}</p> : null}
            {hash ? (
              <p className="mt-2 text-sm">
                <Link className="font-mono-data text-primary hover:underline" href={txUrl(hash)} target="_blank">
                  {shortValue(hash)}
                </Link>
                <span className="ml-2 text-on-surface-variant">
                  {isConfirming ? "confirming" : isConfirmed ? "confirmed" : "submitted"}
                </span>
              </p>
            ) : null}
            {error ? <p className="mt-2 text-sm text-error">{friendlyTransactionError(error)}</p> : null}
          </div>
        </section>
        </div>
      </section>
    </main>
  );
}

export default function CreateProtectedPoolPage() {
  return (
    <Providers>
      <CreateProtectedPoolContent />
    </Providers>
  );
}
