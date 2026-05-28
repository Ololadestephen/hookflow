# HookFlow Submission Core

## Project Name

HookFlow

## Short Description

HookFlow is a flow-aware Uniswap v4 hook on X Layer that dynamically adjusts swap fees based on trade size and short-term toxic flow, helping LPs earn more when their pool is taking more risk while keeping normal small trades cheap.

## One-Sentence Pitch

HookFlow turns a static AMM pool into an adaptive market that prices flow quality in real time.

## Problem

Static fee tiers are too blunt.

In a normal pool, a small normal user and a large one-sided toxic flow can pay the same fee rate. That is bad for LPs because they are often underpaid when the pool is exposed to higher risk.

The result:

- LPs are less willing to provide liquidity to volatile or long-tail assets,
- token launch pools can be fragile,
- normal users may subsidize more harmful flow,
- pool operators have little control without migrating fee tiers or deploying new pools.

## Solution

HookFlow uses Uniswap v4 hooks to adjust the pool fee at swap time.

The hook applies three layers:

- baseline dynamic fee,
- size-aware premium,
- toxic-flow premium with defensive cooldown.

This means:

- small benign trades stay cheap,
- larger trades pay more,
- repeated same-direction flow raises the toxicity score,
- highly toxic flow activates a temporary defensive fee mode.

## Core Hook Behavior

The hook is attached to a dynamic-fee Uniswap v4 pool.

On `beforeSwap`:

- compute the current size bucket,
- preview the toxicity score,
- calculate the applied fee,
- return the fee override to the v4 PoolManager,
- emit `FlowAssessed`.

On `afterSwap`:

- update directional volume,
- update same-direction streak count,
- update toxicity score,
- activate defensive cooldown if threshold is crossed.

## Why This Is Innovative

HookFlow is not just a dynamic fee hook. It is a pool-level flow segmentation system.

Most AMM pools price all flow the same inside one fee tier. HookFlow changes that by making the pool react to the type of flow it is receiving.

The innovation is the composition:

- size-aware trade pricing,
- rolling toxic-flow detection,
- LP defensive cooldown,
- all enforced at the Uniswap v4 hook layer.

This creates a market that behaves more like a professional trading venue while still preserving the normal Uniswap swap experience.

## Why It Fits X Layer

HookFlow benefits from low-cost, high-throughput execution.

The hook updates state and emits flow events as swaps happen. That kind of adaptive market structure makes more sense on X Layer because frequent state updates and experimentation are cheaper.

HookFlow is a practical example of why X Layer plus Uniswap v4 hooks is powerful:

> The pool itself becomes programmable trading infrastructure.

## Users

### LPs

LPs use HookFlow because it helps them earn higher fees when flow is riskier.

The hook does not claim to eliminate impermanent loss. The sharper claim is:

> HookFlow helps LPs avoid being underpaid for risky flow.

### Token Teams

Token teams use HookFlow for launch pools, volatile pools, and long-tail assets where liquidity can face bursty or manipulative flow.

They get a single pool that can stay cheap during normal conditions and become defensive during stressed conditions.

### Market Makers

Market makers use HookFlow because its rules are transparent.

They can inspect:

- base fee,
- size thresholds,
- toxicity thresholds,
- cooldown duration,
- emitted flow events.

### Traders

Traders keep the normal swap UX.

The product principle is:

> Benign small flow should not subsidize toxic large flow.

## Current MVP Status

Implemented:

- real Uniswap v4 `IHooks` interface,
- dynamic fee override in `beforeSwap`,
- flow state update in `afterSwap`,
- size premium,
- toxicity premium,
- defensive cooldown,
- named pool presets,
- production-oriented config bounds,
- `FlowAssessed` event,
- Foundry tests,
- X Layer mainnet deployment,
- USDT0/WOKB v4 pool initialization,
- mainnet demo liquidity,
- verified HookFlow hook contract,
- real mainnet swaps that trigger different hook outcomes.

Live X Layer mainnet proof is documented in `docs/MAINNET_DEPLOYMENT.md`.

## Main Contract Addresses

Network:

- X Layer mainnet
- Chain ID: `196`

Contracts:

- HookFlowHook: `0x826EBCEf75EB77103930282690C839B17AE7C0C0`
- PoolManager: `0x360E68faCcca8cA495c1B759Fd9EEe466db9FB32`
- Pool ID: `0xbfd3acdc7dd950638cdf9d497dac2e536a169530e7c33375aed70e3693283db6`
- Token0, USDT0: `0x779Ded0c9e1022225f8E0630b35a9b54bE713736`
- Token1, WOKB: `0xe538905cf8410324e03A5A23C1c177a474D59b2b`

## Onchain Behavior Proof

Observed hook event progression:

| Step | Applied fee pips | Size bucket | Toxic score | Defensive mode |
| --- | ---: | ---: | ---: | --- |
| Size-aware swap | `4000` | `1` | `10` | `false` |
| Small baseline swap | `3000` | `0` | `54` | `false` |
| Same-direction swap 1 | `5000` | `0` | `61` | `false` |
| Same-direction swap 2 | `5000` | `0` | `68` | `false` |
| Same-direction swap 3 | `5000` | `0` | `75` | `false` |
| Defensive trigger swap | `11000` | `0` | `82` | `true` |
| Defensive cooldown swap | `11000` | `0` | `89` | `true` |

## Roadmap

### Phase 1: MVP

Prove the mechanism works onchain.

Status: complete.

### Phase 2: Production Hook

Make HookFlow safer for real pool pilots:

- stricter admin controls,
- parameter bounds,
- pool presets,
- expanded tests,
- stronger event indexing.

Status: partially complete. The hook now includes stable-pair, volatile-pair, launch-pool, and long-tail-pool presets, plus stronger validation and tests for invalid config, fee clamping, cooldown expiry, and PoolManager-only access.

### Phase 3: HookFlow Console

Build a UI for pool creators and LPs:

- create a HookFlow pool,
- choose pool preset,
- monitor current fee,
- see toxicity score,
- see defensive mode,
- review pool flow history.

### Phase 4: Flow Intelligence Layer

Aggregate HookFlow data across pools:

- public pool health feed,
- toxicity leaderboard,
- pool risk reports,
- configuration recommendations.

### Phase 5: Advanced Modules

Add new modules:

- volatility-aware fee premium,
- liquidity-depth-aware pricing,
- oracle-assisted price deviation checks,
- correlated-flow detection across pools,
- LP withdrawal protection windows.

## Why HookFlow Can Become More Than A Hackathon Project

HookFlow has a clear path from hook to product.

The hook is the primitive. The console and analytics layer are the product. The long-term market is token teams, LPs, and liquidity managers who want safer programmable pools on X Layer.

## Strongest Judging Line

HookFlow gives Uniswap v4 pools a simple but powerful new ability:

> Charge the right price for the right flow at the exact moment the swap happens.
