"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useBlockNumber } from "wagmi";
import { behaviorProof, deploymentProof, flowEvents, hookFlowDeployment, hookFlowState } from "../../lib/contracts";
import { AppNav } from "../components/AppNav";
import { Providers } from "../providers";

const stateCards = [
  { label: "Applied fee", value: hookFlowState.appliedFeePips, note: "beforeSwap override" },
  { label: "Toxicity score", value: hookFlowState.toxicityScore, note: hookFlowState.flowBias },
  { label: "Cooldown", value: hookFlowState.cooldown, note: "LP defense ready" },
  { label: "Active preset", value: hookFlowState.preset, note: "bounded fee config" }
] as const;

const identityRows = [
  ["Hook", hookFlowDeployment.hook],
  ["Factory", hookFlowDeployment.factory],
  ["PoolManager", hookFlowDeployment.poolManager],
  ["Pool ID", hookFlowDeployment.poolId],
  ["Token 0 / USDT0", hookFlowDeployment.token0],
  ["Token 1 / WOKB", hookFlowDeployment.token1]
] as const;

function shortValue(value: string) {
  return value.length > 30 ? `${value.slice(0, 10)}...${value.slice(-8)}` : value;
}

function txUrl(tx: string, explorerBaseUrl: string = hookFlowDeployment.explorerBaseUrl) {
  return `${explorerBaseUrl}/tx/${tx}`;
}

function addressUrl(address: string) {
  return `${hookFlowDeployment.explorerBaseUrl}/address/${address}`;
}

function DashboardContent() {
  const [copied, setCopied] = useState<string | null>(null);
  const { data: blockNumber } = useBlockNumber({
    chainId: hookFlowDeployment.chainId,
    query: { refetchInterval: 12_000 }
  });

  const blockLabel = useMemo(() => {
    if (!blockNumber) return "connecting";
    return blockNumber.toLocaleString();
  }, [blockNumber]);

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
    } catch {
      setCopied("blocked");
    }
    window.setTimeout(() => setCopied(null), 1000);
  }

  return (
    <main className="min-h-screen bg-background text-on-background lg:grid lg:grid-cols-[250px_minmax(0,1fr)]">
      <AppNav active="dashboard" />
      <section className="px-4 py-5 md:px-8">
        <div className="mx-auto max-w-6xl">
          <header className="mb-5 flex flex-col gap-4 border-b border-outline-variant/60 pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-normal md:text-5xl">HookFlow Dashboard</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
                Judge-facing proof that the deployed Uniswap v4 hook adjusts fees for size, toxic flow, and defensive LP
                protection.
              </p>
            </div>

            <div className="w-full rounded-lg border border-outline-variant/60 bg-surface-container-low p-4 md:w-auto md:min-w-[260px]">
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="rounded border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                  Verified Hook
                </span>
                <span className="rounded border border-outline-variant/70 bg-background/50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                  X Layer Mainnet
                </span>
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">Live RPC</p>
              <p className="mt-1 font-mono-data text-lg font-semibold text-primary">Block {blockLabel}</p>
            </div>
          </header>

        <section className="mb-5 rounded-lg border border-primary/20 bg-primary/10 p-4">
          <p className="text-sm leading-6 text-on-background">
            <span className="font-semibold text-primary">LP protection thesis:</span> Riskier flow pays more. HookFlow
            keeps benign swaps near the base fee, then raises fees when trade size or one-sided flow increases pool risk.
            The USDT0/WOKB mainnet pool is live, and the behavior proof below shows real mainnet swaps triggering the
            hook path.
          </p>
        </section>

        <section className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stateCards.map((card) => (
            <article className="rounded-lg border border-outline-variant/60 bg-surface-container-low p-4" key={card.label}>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">{card.label}</p>
              <p className="mt-3 font-mono-data text-2xl font-extrabold text-primary">{card.value}</p>
              <p className="mt-2 text-xs text-on-surface-variant">{card.note}</p>
            </article>
          ))}
        </section>

        <section className="mb-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-lg border border-outline-variant/60 bg-surface-container-low p-4 md:p-5">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
              <div>
                <h2 className="font-display text-2xl font-semibold">Deployment Proof</h2>
                <p className="mt-1 text-sm text-on-surface-variant">Addresses judges can verify on OKLink.</p>
              </div>
              <Link
                className="shrink-0 rounded border border-primary/20 bg-primary/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-primary hover:bg-primary/15"
                href={hookFlowDeployment.oklinkHookUrl}
                target="_blank"
              >
                Hook
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {identityRows.map(([label, value]) => (
                <div key={label}>
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">{label}</p>
                  <div className="flex items-center justify-between gap-3 rounded border border-outline-variant/60 bg-background/70 px-3 py-2">
                    <code className="truncate font-mono-data text-xs text-on-background">{shortValue(value)}</code>
                    <div className="flex items-center gap-3">
                      {value.startsWith("0x") && value.length === 42 ? (
                        <Link className="text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant hover:text-primary" href={addressUrl(value)} target="_blank">
                          View
                        </Link>
                      ) : null}
                      <button
                        className="text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant hover:text-primary"
                        onClick={() => copy(value, label)}
                        type="button"
                      >
                        {copied === label ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-lg border border-outline-variant/60 bg-surface-container-low p-4 md:p-5">
            <h2 className="font-display text-2xl font-semibold">Mainnet Setup Transactions</h2>
            <p className="mt-1 text-sm text-on-surface-variant">Minimum X Layer mainnet completion trail.</p>

            <div className="mt-5 divide-y divide-outline-variant/50 rounded border border-outline-variant/60 bg-background/60">
              {deploymentProof.map((item) => (
                <Link
                  className="flex flex-col gap-1 px-3 py-3 text-sm hover:bg-primary/5 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                  href={txUrl(item.tx)}
                  key={item.tx}
                  target="_blank"
                >
                  <span className="font-medium">{item.label}</span>
                  <code className="font-mono-data text-xs text-primary">{shortValue(item.tx)}</code>
                </Link>
              ))}
            </div>
          </article>
        </section>

        <article className="overflow-hidden rounded-lg border border-outline-variant/60 bg-surface-container-low">
          <div className="border-b border-outline-variant/60 px-4 py-4 md:px-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="font-display text-2xl font-semibold">Behavior Proof</h2>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Real swaps that triggered the hook path: fee override, size premium, toxicity premium, and cooldown.
                </p>
              </div>
              <div className="rounded border border-outline-variant/60 bg-background/70 px-3 py-2 text-xs text-on-surface-variant">
                <span className="font-bold uppercase tracking-[0.12em] text-primary">{behaviorProof.chainName}</span>
                <span className="mx-2 text-outline">/</span>
                <code className="font-mono-data">{shortValue(behaviorProof.hook)}</code>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="bg-background/60 text-[11px] uppercase tracking-[0.14em] text-on-surface-variant">
                <tr>
                  <th className="px-5 py-3 font-bold">Skill</th>
                  <th className="px-5 py-3 font-bold">Trigger</th>
                  <th className="px-5 py-3 font-bold">Applied Fee</th>
                  <th className="px-5 py-3 font-bold">Bucket</th>
                  <th className="px-5 py-3 font-bold">Toxicity</th>
                  <th className="px-5 py-3 font-bold">Mode</th>
                  <th className="px-5 py-3 font-bold">Proof</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {flowEvents.map((event) => (
                  <tr className="hover:bg-primary/5" key={event.step}>
                    <td className="px-5 py-3 font-semibold">{event.step}</td>
                    <td className="px-5 py-3 text-on-surface-variant">{event.trigger}</td>
                    <td className="px-5 py-3 font-mono-data text-primary">{event.fee}</td>
                    <td className="px-5 py-3 text-on-surface-variant">{event.bucket}</td>
                    <td className="px-5 py-3 font-mono-data">{event.score}</td>
                    <td className="px-5 py-3">
                      <span className="rounded bg-primary/10 px-2 py-1 text-[11px] font-bold text-primary">{event.mode}</span>
                    </td>
                    <td className="px-5 py-3">
                      <Link className="text-xs font-bold uppercase tracking-[0.12em] text-primary hover:underline" href={txUrl(event.tx, behaviorProof.explorerBaseUrl)} target="_blank">
                        TX
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
        </div>
      </section>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Providers>
      <DashboardContent />
    </Providers>
  );
}
