# HookFlow

HookFlow is an adaptive Uniswap v4 hook for LP protection on X Layer.

It turns a static-fee liquidity pool into a flow-aware pool: small benign trades stay close to the base fee, larger trades pay a size premium, repeated one-sided flow pays a toxicity premium, and toxic bursts can trigger a temporary defensive cooldown.

## Why HookFlow

AMM fee tiers are usually blunt. A small organic swap and a large one-sided trade can pay the same fee rate even though they create very different risk for LPs.

HookFlow uses Uniswap v4 hooks to price that risk at swap time. The goal is simple:

> Riskier flow should pay more, so LPs are not underpaid when the pool is taking more risk.

## Core Hook Logic

HookFlow combines three LP-protection skills:

- **Dynamic fee skill:** returns a Uniswap v4 `beforeSwap` fee override for each swap.
- **Size-aware trade skill:** adds a premium when a trade crosses configured size thresholds.
- **Toxic-flow protection skill:** tracks short-term directional flow, raises fees during one-sided bursts, and activates defensive cooldown when toxicity is high.

Fee model:

```text
effectiveFee = baseFee + sizePremium + toxicityPremium
effectiveFee = min(effectiveFee, maxFee)
```

## Live X Layer Mainnet Proof

Network:

- X Layer mainnet
- Chain ID: `196`

Main proof deployment:

- HookFlowHook: `0x826EBCEf75EB77103930282690C839B17AE7C0C0`
- PoolManager: `0x360E68faCcca8cA495c1B759Fd9EEe466db9FB32`
- Pool ID: `0xbfd3acdc7dd950638cdf9d497dac2e536a169530e7c33375aed70e3693283db6`
- Token0, USDT0: `0x779Ded0c9e1022225f8E0630b35a9b54bE713736`
- Token1, WOKB: `0xe538905cf8410324e03A5A23C1c177a474D59b2b`

Public LP deployment:

- Public HookFlowHook: `0xC18e6daa59708C1Be5567C350f176319Ee4580C0`
- HookFlowLiquidityRouter: `0x47a4bfA07471baBdC124cbf70020EBD6CcddBD9D`
- Public factory: `0xf82337ba8E19b5a4A0E33434E2697af245D84BCe`
- Self-serve pool ID: `0xb13a28deaf008674a2c239235c06028f103512e03503c09559daa13c6b0905a7`
- Add-liquidity proof tx: `0x11d1b9f10d963514bc11d6271071caf6b3bc7956e33fd6412409aa6087900bc5`

The proof hook, public hook, factory, and liquidity router are deployed and verifiable on X Layer mainnet. The live USDT0/WOKB pool demonstrates real hook-triggered behavior.

## Behavior Proof

Observed mainnet swap progression:

| Step | Applied fee pips | Size bucket | Toxic score | Defensive mode |
| --- | ---: | ---: | ---: | --- |
| Size-aware swap | `4000` | `1` | `10` | `false` |
| Small baseline swap | `3000` | `0` | `54` | `false` |
| Same-direction swap 1 | `5000` | `0` | `61` | `false` |
| Same-direction swap 2 | `5000` | `0` | `68` | `false` |
| Same-direction swap 3 | `5000` | `0` | `75` | `false` |
| Defensive trigger swap | `11000` | `0` | `82` | `true` |
| Defensive cooldown swap | `11000` | `0` | `89` | `true` |

Full deployment details are in [docs/MAINNET_DEPLOYMENT.md](docs/MAINNET_DEPLOYMENT.md).

## Frontend

The Next.js frontend is in [frontend](frontend).

Routes:

- `/`: landing page
- `/dashboard`: deployed proof, live RPC block, setup transactions, behavior transactions
- `/create`: default USDT0/WOKB LP flow and custom-pair preparation flow
- `/protect`: LP-facing explanation of how HookFlow protection works

Create page behavior:

- default pair shows `USDT0 / WOKB` without requiring contract-address input
- custom pair mode exposes token contract-address fields
- presets map to real hook values: stable `0`, volatile `1`, launch `2`, long-tail `3`
- token approvals use the verified liquidity router
- add-liquidity calls the router with max token spend and deadline guards
- raw wallet and viem errors are converted into user-friendly messages

## Architecture

Core contracts:

- [src/HookFlowHook.sol](src/HookFlowHook.sol): Uniswap v4 hook entrypoint, pool config, flow state, events
- [src/HookFlowLiquidityRouter.sol](src/HookFlowLiquidityRouter.sol): LP liquidity helper with max-spend and deadline checks
- [src/libraries/HookFlowFeeLogic.sol](src/libraries/HookFlowFeeLogic.sol): size buckets, toxicity scoring, fee quote, cooldown logic
- [src/libraries/HookFlowPresetLib.sol](src/libraries/HookFlowPresetLib.sol): stable, volatile, launch, and long-tail presets
- [src/types/HookFlowTypes.sol](src/types/HookFlowTypes.sol): config, state, preset, and quote types

Hook lifecycle:

```text
beforeSwap
  -> load PoolConfig and PoolFlowState
  -> preview size bucket and toxicity score
  -> calculate adaptive fee
  -> emit FlowAssessed
  -> return LPFeeLibrary.OVERRIDE_FEE_FLAG | fee

afterSwap
  -> update flow state from executed swap delta
  -> update directional volume
  -> update same-direction streak
  -> update last toxicity score
  -> set defensive cooldown if threshold is crossed
```

Detailed architecture is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Security Notes

HookFlow includes several hardening choices made during the hackathon:

- flow state records executed swap deltas instead of trusting requested swap size
- public preset application is operator-gated to reduce pool-squatting and preset front-running risk
- liquidity router checks ERC20 transfer return values
- liquidity router enforces max token spend and deadline checks
- frontend CSP is strict in production while allowing the Next.js dev runtime locally

## Presets

HookFlow includes four bounded presets:

- **Stable Pair:** lower fees and softer toxic-flow response for correlated assets
- **Volatile Pair:** balanced protection for active token pairs
- **Launch Pool:** aggressive early defense for new assets and uncertain liquidity
- **Long-Tail Pool:** stronger protection for thin liquidity and volatile markets

## Hackathon Requirement Checklist

| Requirement | Status | Evidence |
| --- | --- | --- |
| Built around Uniswap v4 hooks | Complete | `HookFlowHook` implements `beforeSwap` and `afterSwap` hook behavior. |
| Deployed on X Layer | Complete | Hook, pool, factory, and router are deployed on X Layer mainnet. |
| At least one v4 pool deployed | Complete | USDT0/WOKB v4 pools are initialized on X Layer mainnet. |
| Verifiable contract address | Complete | Main proof hook and public hook are verified on OKLink. |
| Hook behavior triggered by real transactions | Complete | Mainnet swaps triggered fee override, size premium, toxicity premium, and defensive cooldown. |
| Substantial new hook logic | Complete | Dynamic fee coordination, size-aware premium, toxic-flow scoring, cooldown, and bounded presets. |
| Social presence | Complete | Dedicated project X account and project posts created. |
| Submission package | Ready | Repo, frontend, deployed addresses, proof txs, and demo script are prepared. |

## Local Development

Install frontend dependencies:

```sh
cd frontend
npm install
```

Run the frontend:

```sh
npm run dev
```

Build the frontend:

```sh
npm run build
```

Run Solidity tests:

```sh
forge test --offline
```

## Vercel Deployment

Recommended Vercel settings:

- Root Directory: `frontend`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: default

No frontend environment variables are required for the current deployment.

Do not add deployment secrets such as `PRIVATE_KEY` or `OKLINK_API_KEY` to Vercel. Those are only for local Foundry deployment and verification scripts.

## Known MVP Limits

- The current add-liquidity flow still uses Uniswap v4 tick and liquidity internals under the hood.
- The UI hides technical range values by default, but a production version should calculate liquidity from token amounts and human-readable min/max prices.
- Custom-pair preset application is operator-gated to avoid pool squatting. The live USDT0/WOKB LP flow remains open.

## Roadmap

- Calculate liquidity from user-entered token amounts and price ranges.
- Add indexed event views for live fee, toxicity, cooldown, and pool-risk monitoring.
- Add deeper custom-token validation for self-serve pair creation.
- Add more invariant and fuzz tests around edge-case swaps, custom tokens, and liquidity operations.
- Expand the dashboard into a full HookFlow LP console.
