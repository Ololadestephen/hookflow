import { AppNav } from "../components/AppNav";

const steps = [
  {
    title: "Choose a protected pool",
    body: "Use a pool that was created with the HookFlow hook from the start. The live MVP pool is USDT0/WOKB on X Layer mainnet."
  },
  {
    title: "Review protection",
    body: "Check the active preset and current pool risk before adding liquidity. The MVP uses the volatile-pair preset for USDT0/WOKB."
  },
  {
    title: "Add liquidity",
    body: "Deposit liquidity into the HookFlow-protected pool. Risky flow pays higher adaptive fees into the pool instead of staying underpriced."
  },
  {
    title: "Monitor flow",
    body: "Use the dashboard to verify fee overrides, toxicity score, cooldown status, and onchain transactions."
  },
  {
    title: "Create new markets later",
    body: "When you want a new market, use the create page to pick token addresses, choose a safe preset, and initialize a protected pool."
  }
] as const;

const presets = [
  ["Stable Pair", "Low base fee and softer toxic-flow response for correlated assets."],
  ["Volatile Pair", "Balanced protection for active token pairs with regular directional moves."],
  ["Launch Pool", "Aggressive early defense for new assets, launches, and uncertain liquidity."],
  ["Long-Tail Pool", "Higher protection for thin liquidity where large swaps can hit LPs harder."]
] as const;

const protections = [
  "Small benign trades stay near the base fee.",
  "Medium and large trades pay a size premium.",
  "Repeated one-sided swaps raise the toxic-flow premium.",
  "Defensive cooldown keeps protection active after toxic bursts."
] as const;

export default function ProtectPage() {
  return (
    <main className="min-h-screen bg-background text-on-background lg:grid lg:grid-cols-[250px_minmax(0,1fr)]">
      <AppNav active="protect" />
      <section className="px-4 py-5 md:px-8 md:py-6">
        <div className="mx-auto max-w-6xl">
          <header className="mb-6 border-b border-outline-variant/60 pb-6">
            <p className="mb-3 inline-flex rounded border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
              LP Protection Flow
            </p>
            <h1 className="font-display text-3xl font-semibold tracking-normal md:text-5xl">Use HookFlow to safeguard LPs</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-on-surface-variant">
              HookFlow is for LPs who want a Uniswap v4 pool that adapts to trade risk. It does not remove LP risk, but it
              helps LPs avoid undercharging large, one-sided, or toxic flow. LPs can use the live protected pool today or
              create a new protected pool from the self-serve flow.
            </p>
          </header>

        <section className="mb-5 grid gap-5 lg:grid-cols-[1fr_0.85fr]">
          <article className="rounded-lg border border-outline-variant/60 bg-surface-container-low p-4 md:p-5">
            <h2 className="font-display text-2xl font-semibold">How a normal LP uses it</h2>
            <div className="mt-5 grid gap-3">
              {steps.map((step, index) => (
                <div className="grid gap-3 rounded border border-outline-variant/60 bg-background/60 p-4 sm:grid-cols-[44px_1fr]" key={step.title}>
                  <div className="grid h-10 w-10 place-items-center rounded bg-primary/10 font-mono text-sm font-bold text-primary">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-on-background">{step.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-on-surface-variant">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <aside className="space-y-5">
            <article className="rounded-lg border border-primary/20 bg-primary/10 p-4 md:p-5">
              <h2 className="font-display text-2xl font-semibold">What it protects</h2>
              <div className="mt-4 space-y-3">
                {protections.map((item) => (
                  <div className="flex gap-3 text-sm leading-6" key={item}>
                    <span className="material-symbols-outlined mt-0.5 text-base text-primary">check_circle</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-lg border border-outline-variant/60 bg-surface-container-low p-4 md:p-5">
              <h2 className="font-display text-2xl font-semibold">Important limit</h2>
              <p className="mt-3 text-sm leading-6 text-on-surface-variant">
                HookFlow can only protect liquidity in a pool created with the HookFlow hook. It cannot be attached later
                to an existing non-HookFlow pool.
              </p>
            </article>
          </aside>
        </section>

        <section className="mb-5 rounded-lg border border-outline-variant/60 bg-surface-container-low p-4 md:p-5">
          <h2 className="font-display text-2xl font-semibold">Protection presets</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {presets.map(([name, detail]) => (
              <article className="rounded border border-outline-variant/60 bg-background/60 p-4" key={name}>
                <h3 className="font-semibold text-primary">{name}</h3>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">{detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-outline-variant/60 bg-surface-container-low p-4 md:p-5">
          <h2 className="font-display text-2xl font-semibold">User-facing product flow</h2>
          <p className="mt-3 text-sm leading-6 text-on-surface-variant">
            LP connects a wallet, chooses a pair, picks a preset, creates a protected Uniswap v4 pool, adds liquidity,
            and monitors pool behavior in the dashboard. This MVP proves that loop on X Layer with a verified live hook
            and a live proof pool.
          </p>
        </section>
        </div>
      </section>
    </main>
  );
}
