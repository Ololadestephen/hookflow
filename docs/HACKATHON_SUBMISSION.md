# HookFlow Hackathon Submission

## Project

HookFlow is a flow-aware Uniswap v4 hook on X Layer.

It turns a static AMM pool into an adaptive market that prices flow quality in real time: small benign trades stay cheap, larger trades pay more, repeated one-sided flow pays more, and toxic bursts trigger a temporary defensive fee mode for LPs.

## One-Liner

HookFlow helps LPs avoid being underpaid for risky flow.

## What Was Built

- A real Uniswap v4 hook using the `IHooks` interface.
- A dynamic-fee `beforeSwap` override path.
- An `afterSwap` flow-state update path.
- Size-aware trade premiums.
- Toxic-flow premiums.
- Defensive cooldown for LP protection.
- Pool presets for stable, volatile, launch, and long-tail pools.
- A verified X Layer mainnet hook contract.
- A USDT0/WOKB Uniswap v4 pool initialized on X Layer mainnet.
- Mainnet demo liquidity and real mainnet swaps that trigger each hook behavior.
- A public-safe self-serve hook deployment with `applySafePreset`.
- A verified liquidity router for LP deposits.
- A self-serve USDT0/WOKB pool initialized and funded through the router.
- A judge-facing dashboard showing deployment and behavior proof.

## Why It Matters

Static AMM fee tiers are blunt. A small retail swap and a large one-sided toxic flow can pay the same fee rate, which can leave LPs underpaid when their pool is taking more risk.

HookFlow makes the pool react to flow quality at swap time. It keeps normal flow near the base fee, then raises fees when trade size or short-term one-sided flow increases risk.

## Core Mechanism

On `beforeSwap`, HookFlow:

- reads the pool config and flow state,
- checks the trade size bucket,
- previews the current toxicity score,
- calculates the applied fee,
- emits `FlowAssessed`,
- returns a Uniswap v4 LP fee override.

On `afterSwap`, HookFlow:

- records directional volume,
- updates same-direction streak count,
- stores the latest toxicity score,
- activates defensive cooldown when toxicity crosses the defensive threshold.

## Scoring Edge

### Innovation

HookFlow is not just a dynamic fee hook. It is a composable pool-level flow intelligence system combining:

- size-aware pricing,
- toxic-flow scoring,
- defensive LP cooldown,
- bounded presets,
- transparent events for monitoring.

### Market Potential

HookFlow targets LPs, token teams, and liquidity managers running volatile, long-tail, or launch pools. These pools need a way to keep normal trades affordable while charging more when flow becomes risky.

The product is moving toward a HookFlow console where LPs can fund live protected pools, while operator-approved custom pools can be configured with bounded presets and monitored through the app. The public deployment on X Layer mainnet proves that direction.

### Completion

HookFlow is deployed and triggered on X Layer mainnet. The hook behavior is not only described in tests; it is visible through real transactions and hook events.

HookFlow also has a second verified deployment where the live LP path is public, custom presets are operator-gated to prevent squatting, and liquidity is added through a verified router with spend bounds.

## X Layer Mainnet Proof

- Chain: X Layer Mainnet
- Chain ID: `196`
- Explorer: `https://www.oklink.com/xlayer`
- Official Uniswap v4 PoolManager: `0x360E68faCcca8cA495c1B759Fd9EEe466db9FB32`

### Contracts

- HookFlowHook: `0x826EBCEf75EB77103930282690C839B17AE7C0C0`
- HookFlowFactory: `0x7a04F5f91cF1F682d61fF1c44B7564d9C968E8b2`
- Hook source verification: verified on OKLink

### Pool

- Pair: USDT0 / WOKB
- Token0, USDT0: `0x779Ded0c9e1022225f8E0630b35a9b54bE713736`
- Token1, WOKB: `0xe538905cf8410324e03A5A23C1c177a474D59b2b`
- Pool ID: `0xbfd3acdc7dd950638cdf9d497dac2e536a169530e7c33375aed70e3693283db6`

### Setup Transactions

- Factory deploy: `0xfc3b20258a8b27899129027981947bb8901eeddb7ea831dca70b1dfe2b5a70d9`
- Hook deploy: `0xe4bda53db180cd49b0d29a124cde6b1d09dc18a6295d372d05a135dfac45a2a6`
- Hook config: `0x1201ff9c60e5b24e499cecf3133e934f40defce5f3232902cd02de1a16b3b921`
- Pool initialize: `0x906102ef942606e3b90004f476b0700a61d826c4ac2b1d428a8a58ec8cdc0ad6`
- Add demo liquidity: `0xd0a69260cf7d340c78e77d077a8fec0f6ed9b8473ccf264dcc1e2ae5a871d816`

### Behavior Transactions

| Behavior | Applied fee | Toxicity | Defensive | Transaction |
| --- | ---: | ---: | --- | --- |
| Size premium | `4000` | `10` | false | `0xe20a15e23ee05e3fae8998a19d620006f798fa82a98c20dfcae60d4426496ede` |
| Fixed fee override | `3000` | `54` | false | `0x71f080b7f04635034751c2ba370634e9bc84e7b81f0f86241b18f48f350bc949` |
| Toxicity premium | `5000` | `61` | false | `0x18af0003cf25200258c9222c53f8f6ad5db13995bff730ba8cdb472ac0e8546b` |
| Toxicity premium | `5000` | `68` | false | `0x8b224fcf0ff5319eaf1e3f0ca0f58d9613e83dda25ad48706cdfd9aa258a6051` |
| Toxicity premium | `5000` | `75` | false | `0x56cf0b61477d4fe657b4a474dc0650fc217370ca4325765d4cc4e15e459497a7` |
| Defensive trigger | `11000` | `82` | true | `0xc689bc3da8dba2d96ef1d55040dded8e393e83780edf091cb3e06b865475fab2` |
| Defensive cooldown | `11000` | `89` | true | `0x2ebed6d3b46fdd45a049910fbb61c86e88cc82ca17fd65d6167e655fc96665eb` |

## Public Self-Serve Proof

- Public HookFlowHook: `0xC18e6daa59708C1Be5567C350f176319Ee4580C0`
- Public factory: `0xf82337ba8E19b5a4A0E33434E2697af245D84BCe`
- HookFlowLiquidityRouter: `0x47a4bfA07471baBdC124cbf70020EBD6CcddBD9D`
- Self-serve pool ID: `0xb13a28deaf008674a2c239235c06028f103512e03503c09559daa13c6b0905a7`
- Public hook deploy: `0xcf5f0d8da7a53f07a01b4423dac6d2bf8cde0f6f1a81a53cec13734a4f5df1a2`
- Safe preset applied: `0xa31e0de9d13633d02ef8e65f59decba0ec5b053b7712d353a7ee1669ca6103da`
- Pool initialize: `0x10ab12186145ceaabed95b7fe59ed5b679c09ec959b4e94450cd6bf482fa4e3f`
- Add liquidity through verified router: `0x11d1b9f10d963514bc11d6271071caf6b3bc7956e33fd6412409aa6087900bc5`

## How To Use HookFlow

In the full product, an LP connects a wallet, enters token0/token1, chooses a preset, creates a HookFlow-protected Uniswap v4 pool, adds liquidity, and monitors the pool in the dashboard.

This MVP proves the hardest part first: the hook logic works onchain and can be triggered by real swaps on X Layer mainnet.

## Roadmap

- Phase 1: Onchain MVP, verified hook, mainnet pool, mainnet proof transactions.
- Phase 2: Functional pool-creation frontend with wallet transactions.
- Phase 3: LP dashboard with live event indexing, risk history, and preset recommendations.
- Phase 4: Flow intelligence layer across many X Layer pools.
- Phase 5: Advanced modules such as volatility-aware fees, liquidity-depth pricing, oracle deviation checks, and LP withdrawal protection.

## Submission Links

- Mainnet proof doc: `docs/MAINNET_DEPLOYMENT.md`
- Architecture doc: `docs/ARCHITECTURE.md`
- Strategy doc: `docs/PROJECT_STRATEGY.md`
- Dashboard route: `/dashboard`
- Pool creation route: `/create`
- Protect LP explainer route: `/protect`
