# HookFlow

HookFlow is a flow-aware Uniswap v4 hook on X Layer.

It turns a static AMM pool into an adaptive market that prices flow quality in real time: small benign trades stay cheap, larger trades pay more, repeated one-sided flow pays more, and toxic bursts trigger a temporary defensive fee mode.

## Why It Matters

Static fee tiers are blunt. In a normal AMM pool, a small retail swap and a large one-sided toxic flow can pay the same fee rate. That can leave LPs underpaid when the pool is taking more risk.

HookFlow uses the Uniswap v4 hook mechanism to adjust fees at swap time, giving LPs better compensation during risky flow while preserving the normal swap UX for traders.

The core claim is intentionally narrow:

> HookFlow helps LPs avoid being underpaid for risky flow.

## What The Hook Does

HookFlow combines three skills into one hook:

- Dynamic fee coordination: computes the final per-swap LP fee and returns a v4 fee override.
- Size-aware trade pricing: adds a premium when a trade crosses configured size thresholds.
- LP protection: tracks short-term one-sided flow, raises a toxicity premium, and activates defensive cooldown when toxicity is high.

The fee model is:

```text
effectiveFee = baseFee + sizePremium + toxicityPremium
effectiveFee = min(effectiveFee, maxFee)
```

## Current Status

Implemented:

- real Uniswap v4 `IHooks` interface,
- `beforeSwap` dynamic fee override,
- `afterSwap` flow-state update,
- size premium,
- toxicity premium,
- defensive cooldown,
- `FlowAssessed` event,
- named pool presets,
- production-oriented config bounds,
- CREATE2 hook-address mining for v4 permission bits,
- X Layer mainnet deployment,
- USDT0/WOKB v4 pool initialization,
- mainnet demo liquidity,
- real mainnet swaps that trigger different hook outcomes,
- public self-serve hook deployment,
- verified liquidity router for LP deposits,
- self-serve USDT0/WOKB pool initialization and add-liquidity proof,
- Next.js frontend with landing page, dashboard, LP protection explainer, and create-pool flow,
- wallet connection for X Layer mainnet,
- default USDT0/WOKB pool path,
- custom-pair path for entering token contract addresses,
- safe preset selection wired to `applySafePreset`,
- approval and liquidity transaction buttons,
- friendly transaction error messages.

Verification:

```sh
forge test --offline
```

Current suite: `12` tests passing.

Frontend verification:

```sh
cd frontend
npm run build
```

The frontend build passes.

## Hackathon Requirement Checklist

| Requirement | Status | Evidence |
| --- | --- | --- |
| Built around Uniswap v4 hooks | Complete | `HookFlowHook` implements v4 hook behavior through `beforeSwap` and `afterSwap`. |
| Deployed on X Layer | Complete | Hook, pool, factory, and router are deployed on X Layer mainnet. |
| At least one v4 pool deployed | Complete | USDT0/WOKB v4 pools are initialized on X Layer mainnet. |
| Verifiable contract address | Complete | Main proof hook and public self-serve hook are verified on OKLink. |
| Hook behavior triggerable by real transactions | Complete | Mainnet swaps triggered fee override, size premium, toxicity premium, and defensive cooldown. |
| Substantial new hook logic | Complete | Dynamic fee coordination, size-aware premium, toxic-flow scoring, defensive cooldown, and bounded presets. |
| Social presence | External task | Create and post from a dedicated X account before submission. |
| Google Form submission | External task | Submit before the hackathon deadline. |

## Live X Layer Mainnet Proof

Network:

- X Layer mainnet
- Chain ID: `196`

Contracts:

- HookFlowHook: `0x826EBCEf75EB77103930282690C839B17AE7C0C0`
- PoolManager: `0x360E68faCcca8cA495c1B759Fd9EEe466db9FB32`
- Pool ID: `0xbfd3acdc7dd950638cdf9d497dac2e536a169530e7c33375aed70e3693283db6`
- Token0, USDT0: `0x779Ded0c9e1022225f8E0630b35a9b54bE713736`
- Token1, WOKB: `0xe538905cf8410324e03A5A23C1c177a474D59b2b`

The mainnet hook and pool are deployed on the official X Layer Uniswap v4 PoolManager. The HookFlowHook source is verified on OKLink.

## Public Self-Serve Deployment

HookFlow also has a public-safe deployment for LP onboarding:

- Public HookFlowHook: `0xC18e6daa59708C1Be5567C350f176319Ee4580C0`
- HookFlowLiquidityRouter: `0x47a4bfA07471baBdC124cbf70020EBD6CcddBD9D`
- Public factory: `0xf82337ba8E19b5a4A0E33434E2697af245D84BCe`
- Self-serve pool ID: `0xb13a28deaf008674a2c239235c06028f103512e03503c09559daa13c6b0905a7`
- Add-liquidity proof: `0x11d1b9f10d963514bc11d6271071caf6b3bc7956e33fd6412409aa6087900bc5`

The public deployment keeps LP onboarding onchain, but `applySafePreset` is now restricted to the hook owner to prevent pool squatting and preset front-running. The public LP flow remains open for the live USDT0/WOKB pool, while custom-pair preset application is operator-gated.

## Frontend Console

The frontend lives in:

- [frontend](/Users/apple/Documents/Hookflow/frontend:1)

Routes:

- `/`: landing page focused on self-protecting Uniswap v4 pools.
- `/create`: create/fund flow for LPs.
- `/dashboard`: proof dashboard with deployed addresses, live RPC block, setup transactions, and behavior transactions.
- `/protect`: user-facing explanation of how LP protection works.

Create page behavior:

- Default pair shows `USDT0 / WOKB` without requiring users to paste contract addresses.
- Custom pair mode exposes token contract address inputs.
- Presets map to real hook values: stable `0`, volatile `1`, launch `2`, long-tail `3`.
- `Apply Safe Preset` calls `applySafePreset(poolId, preset)` for operator-approved custom pools.
- `Initialize Pool` initializes the selected v4 pool through the official PoolManager.
- Token approvals use the verified liquidity router.
- `Add Liquidity` calls the verified router's `modifyLiquidity` path with max token spend and deadline guards.
- Raw viem errors are converted into user-friendly transaction messages.
- Post-swap flow state now records executed swap deltas instead of the raw requested swap size.

Known MVP limitation:

- The current add-liquidity flow still uses Uniswap v4 internal tick and liquidity values. The UI hides these behind "Show technical values", but the next production step is to calculate liquidity from human inputs like token amounts and min/max price. If a wallet has a tiny balance, a liquidity transaction can revert with `ERC20: transfer amount exceeds balance`; the UI now explains that as a balance issue instead of dumping raw calldata.

Observed swap progression:

| Step | Applied fee pips | Size bucket | Toxic score | Defensive mode |
| --- | ---: | ---: | ---: | --- |
| Size-aware swap | `4000` | `1` | `10` | `false` |
| Small baseline swap | `3000` | `0` | `54` | `false` |
| Same-direction swap 1 | `5000` | `0` | `61` | `false` |
| Same-direction swap 2 | `5000` | `0` | `68` | `false` |
| Same-direction swap 3 | `5000` | `0` | `75` | `false` |
| Defensive trigger swap | `11000` | `0` | `82` | `true` |
| Defensive cooldown swap | `11000` | `0` | `89` | `true` |

Full proof is in [docs/MAINNET_DEPLOYMENT.md](/Users/apple/Documents/Hookflow/docs/MAINNET_DEPLOYMENT.md:1).

## Architecture

Core contracts:

- [HookFlowHook.sol](/Users/apple/Documents/Hookflow/src/HookFlowHook.sol:1): Uniswap v4 hook entrypoint, pool config, flow state, events.
- [HookFlowFeeLogic.sol](/Users/apple/Documents/Hookflow/src/libraries/HookFlowFeeLogic.sol:1): size buckets, toxicity scoring, fee quote, cooldown logic.
- [HookFlowPresetLib.sol](/Users/apple/Documents/Hookflow/src/libraries/HookFlowPresetLib.sol:1): stable, volatile, launch, and long-tail pool presets.
- [HookFlowTypes.sol](/Users/apple/Documents/Hookflow/src/types/HookFlowTypes.sol:1): config, state, preset, and quote types.

Hook lifecycle:

```text
beforeSwap
  -> load PoolConfig and PoolFlowState
  -> preview size bucket and toxicity score
  -> calculate fee
  -> emit FlowAssessed
  -> return LPFeeLibrary.OVERRIDE_FEE_FLAG | fee

afterSwap
  -> update directional volume
  -> update same-direction streak
  -> update last toxicity score
  -> set defensive cooldown if threshold is crossed
```

Detailed architecture is in [docs/ARCHITECTURE.md](/Users/apple/Documents/Hookflow/docs/ARCHITECTURE.md:1).

## Why HookFlow Is Different

Most AMM pools price all flow the same inside one fee tier. HookFlow segments flow inside the pool.

It asks:

- Is this trade small or large?
- Is recent flow balanced or one-sided?
- Should LPs be compensated more right now?
- Should the pool temporarily defend itself?

That makes HookFlow more than a dynamic fee demo. It is a pool-level risk control layer.

## Who Uses It

LPs use HookFlow to earn more when flow is riskier.

Token teams use HookFlow for launch pools, volatile pools, and long-tail assets that may face bursty flow.

Market makers use HookFlow because the rules are transparent: fee parameters, thresholds, cooldowns, and flow events are inspectable.

Traders keep the standard swap experience. The principle is simple: benign small flow should not subsidize toxic large flow.

## Pool Presets

HookFlow includes four presets:

- Stable pair: lower fees and softer defensive behavior.
- Volatile pair: stronger toxicity premium and higher max fee.
- Launch pool: aggressive defense for early liquidity.
- Long-tail pool: high protection for thin and volatile markets.

Pool owners can also set custom bounded configs.

## Roadmap

Phase 1: Onchain MVP

- v4 hook
- dynamic fee override
- size premium
- toxicity premium
- defensive cooldown
- onchain proof

Phase 2: Public self-serve MVP

- public safe presets
- verified liquidity router
- default USDT0/WOKB pool flow
- custom token pair flow
- wallet transaction UI
- dashboard proof trail

Phase 3: Production hardening

- stricter config bounds
- stronger invariant and fuzz tests
- automatic liquidity sizing from token amounts
- human price range inputs instead of raw ticks
- indexed hook events for live pool monitoring
- clearer failure handling for low balances and missing approvals

Phase 4: HookFlow Console

- create HookFlow pools
- select presets
- monitor current fee
- monitor toxicity score
- inspect defensive mode and flow history

Phase 5: Flow intelligence layer

- pool health feed
- toxicity leaderboard
- risk reports
- configuration recommendations

## Docs

- [Project strategy](/Users/apple/Documents/Hookflow/docs/PROJECT_STRATEGY.md:1)
- [Hackathon submission](/Users/apple/Documents/Hookflow/docs/HACKATHON_SUBMISSION.md:1)
- [Submission core](/Users/apple/Documents/Hookflow/docs/SUBMISSION_CORE.md:1)
- [Architecture](/Users/apple/Documents/Hookflow/docs/ARCHITECTURE.md:1)
- [Deployment](/Users/apple/Documents/Hookflow/docs/DEPLOYMENT.md:1)
- [Mainnet proof](/Users/apple/Documents/Hookflow/docs/MAINNET_DEPLOYMENT.md:1)
- [Functional frontend MVP](/Users/apple/Documents/Hookflow/docs/FUNCTIONAL_FRONTEND_MVP.md:1)
