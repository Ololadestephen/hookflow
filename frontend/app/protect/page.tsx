import { AppNav } from "../components/AppNav";
import Link from "next/link";

const steps = [
  {
    title: "1. Create & Fund Vault",
    body: "Owner deploys a native-BOT treasury vault with initial funding and customized security policy parameters on BOT Chain Mainnet."
  },
  {
    title: "2. Set Spending Policy",
    body: "Define single payout ceilings, aggregate daily spending limits (UTC calendar day), burst rate windows, and cooldown durations."
  },
  {
    title: "3. Allowlist Operators & Recipients",
    body: "Approve authorized operator wallets and allowlisted recipient addresses. Payouts to unapproved addresses are blocked on-chain."
  },
  {
    title: "4. Guarded Payout Execution",
    body: "Approved operators execute bounded native BOT payouts. Transactions are checked against single limits and shared daily caps."
  },
  {
    title: "5. Automated Burst Cooldown",
    body: "When consecutive payouts reach the burst threshold count, the vault automatically triggers an immutable cooldown period."
  }
] as const;

const protections = [
  "Strict single payout ceiling prevents unauthorized large drains.",
  "Shared daily spending limit is aggregated across all operators.",
  "UTC day boundaries ensure deterministic allowance resets without rolling window drift.",
  "Burst rate monitoring activates automated cooldown defense.",
  "Recipient allowlist ensures funds only flow to verified destinations.",
  "Isolated on-chain accounting guarantees independent multi-vault security.",
  "Emergency circuit breaker allows the owner to immediately freeze payouts."
] as const;

const policyTiers = [
  ["Conservative Guard", "Tight per-payout ceiling, strict daily limit, short burst threshold (2 payouts), and extended cooldown (1 hour)."],
  ["Standard Operations", "Balanced payout limits, moderate daily allowance, 3-payout burst window, and 10-minute automated cooldown."],
  ["High-Throughput Agent", "Elevated daily capacity with 5-payout burst allowance designed for continuous automated operational bots."],
  ["Emergency Mode", "Immediate owner pause capability halting all delegated disbursements while preserving owner withdrawals."]
] as const;

export default function ProtectPage() {
  return (
    <main className="min-h-screen bg-background text-on-background lg:grid lg:grid-cols-[250px_minmax(0,1fr)]">
      <AppNav active="protect" />
      <section className="px-4 py-5 md:px-8 md:py-6">
        <div className="mx-auto max-w-6xl">
          <header className="mb-6 border-b border-outline-variant/60 pb-6">
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                BOT Chain Mainnet Guard
              </span>
              <span className="font-mono-data text-xs text-on-surface-variant">Chain ID: 677</span>
            </div>
            <h1 className="font-display text-3xl font-semibold tracking-normal md:text-5xl">
              Treasury Payout Protection Architecture
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-on-surface-variant">
              HookFlow provides deterministic on-chain flow control for native BOT treasuries on BOT Chain Mainnet.
              Designed for autonomous agents, protocol DAOs, and team operations, it enforces granular spending limits,
              shared operator allowances, and automated burst cooldowns without central relayer dependencies.
            </p>
          </header>

          <section className="mb-6 grid gap-5 lg:grid-cols-[1fr_0.85fr]">
            <article className="rounded-xl border border-white/5 bg-surface-container-low p-5 shadow-panel">
              <h2 className="font-display text-2xl font-semibold text-white">How Protection Works</h2>
              <div className="mt-5 space-y-3">
                {steps.map((step) => (
                  <div
                    className="rounded-lg border border-white/5 bg-surface-container p-4"
                    key={step.title}
                  >
                    <h3 className="font-semibold text-primary">{step.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-on-surface-variant">{step.body}</p>
                  </div>
                ))}
              </div>
            </article>

            <aside className="space-y-5">
              <article className="rounded-xl border border-primary/20 bg-primary/10 p-5">
                <h2 className="font-display text-2xl font-semibold text-white">Guaranteed Invariants</h2>
                <div className="mt-4 space-y-3">
                  {protections.map((item) => (
                    <div className="flex gap-2.5 text-xs leading-5 text-on-background" key={item}>
                      <span className="text-primary font-bold">✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-xl border border-white/5 bg-surface-container-low p-5 shadow-panel">
                <h2 className="font-display text-xl font-semibold text-white">Launch Treasury Vault</h2>
                <p className="mt-2 text-xs leading-5 text-on-surface-variant">
                  Ready to deploy a protected native BOT treasury on BOT Chain Mainnet?
                </p>
                <Link
                  href="/treasury"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-label-md text-xs font-bold text-on-primary hover:shadow-glow transition-all"
                >
                  Open Treasury Guard ↗
                </Link>
              </article>
            </aside>
          </section>

          <section className="mb-6 rounded-xl border border-white/5 bg-surface-container-low p-5 shadow-panel">
            <h2 className="font-display text-2xl font-semibold text-white">Operational Policy Profiles</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {policyTiers.map(([name, detail]) => (
                <article className="rounded-lg border border-white/5 bg-surface-container p-4" key={name}>
                  <h3 className="font-semibold text-primary text-sm">{name}</h3>
                  <p className="mt-2 text-xs leading-5 text-on-surface-variant">{detail}</p>
                </article>
              ))}
            </div>
          </section>

          <footer className="border-t border-outline-variant/60 pt-6 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-on-surface-variant">
              <span>HookFlow · Native BOT Treasury Guard on BOT Chain Mainnet (Chain ID 677)</span>
              <div className="flex gap-6">
                <a href="https://botchain.ai" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
                  BOT Chain Website ↗
                </a>
                <a href="https://scan.botchain.ai" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
                  BOT Chain Explorer ↗
                </a>
              </div>
            </div>
          </footer>
        </div>
      </section>
    </main>
  );
}
