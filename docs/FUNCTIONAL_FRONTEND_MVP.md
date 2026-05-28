# HookFlow Functional Frontend MVP

This is the next product phase after the submission proof package.

Goal: let an LP create and fund a HookFlow-protected Uniswap v4 pool from the app, while keeping the implementation small enough to finish under hackathon pressure.

## Recommended Scope

Build for X Layer mainnet first, because the current verified HookFlow deployment and proof trail are already mainnet.

The first functional version should support one path:

- connect wallet,
- validate X Layer network,
- enter token0/token1,
- choose a preset,
- create or configure a HookFlow pool,
- initialize the pool,
- approve tokens,
- add liquidity,
- show transaction status and OKLink links.

## Keep Out Of Scope For The First Version

- Multi-chain support.
- Arbitrary hook deployment from the UI.
- Advanced price-range UX.
- Position NFT management.
- Remove liquidity.
- Production-grade quoting.
- Automated token sorting with complex user warnings.
- Event indexing backend.

Those are valuable, but they can easily swallow the project.

## Required Frontend Pieces

### Wallet

- `wagmi` wallet connection.
- X Layer chain config.
- Wrong-network warning.
- Add/switch X Layer action.

### Token Inputs

- token0 address input,
- token1 address input,
- ERC20 metadata reads,
- decimals validation,
- address ordering check because v4 requires `currency0 < currency1`.

### Preset Selection

Use existing HookFlow presets:

- Stable Pair
- Volatile Pair
- Launch Pool
- Long Tail Pool

The UI should explain each preset in one sentence.

### Pool Setup Transactions

Minimum transaction path:

- apply preset or set pool config on the verified HookFlow hook,
- initialize the v4 pool if not initialized,
- approve token0/token1,
- add liquidity through a router or PositionManager path.

The hardest part is add liquidity, not wallet connection.

### Transaction UX

- pending state,
- success state,
- error state,
- copied addresses,
- OKLink transaction links,
- final pool summary card.

## Smart Contract / Integration Choices

### Lowest-Risk Hackathon Path

Use a small audited-style helper/router contract for the MVP flow, similar to the proof router, but cleaned up and named for product use.

Why:

- frontend calls stay simple,
- fewer calldata mistakes,
- transaction flow is easier to explain,
- we avoid implementing complex v4 unlock callbacks directly in frontend calldata.

Tradeoff:

- it is another contract to deploy and verify,
- it must be clearly labeled as a helper/router.

### More Production Path

Use the official Uniswap v4 PositionManager.

Why:

- more legitimate long term,
- aligns with standard LP position flows.

Tradeoff:

- more complex,
- easy to lose time on calldata/actions/planner details,
- harder to finish safely under time pressure.

## Recommended Build Order

1. Wallet connection and X Layer network guard.
2. Read-only pool creator form with token metadata validation.
3. Preset cards that map to HookFlow preset enum values.
4. Transaction status component with OKLink links.
5. One write transaction: apply preset/config to an existing pool ID.
6. Pool initialize transaction.
7. Token approvals.
8. Add-liquidity helper transaction.
9. Dashboard refresh from the created pool.

## Time Estimate

### Demo-Quality Functional MVP

Estimated time: 1 to 2 days.

This means the UI can actually submit transactions, but the supported path is narrow and heavily guided.

### Polished Product Prototype

Estimated time: 3 to 5 days.

This adds better validation, safer range selection, better state recovery, and clearer failure handling.

### Production-Ready LP Console

Estimated time: 2 to 4 weeks.

This needs a full event indexer, official PositionManager integration, better quoting, position management, and security review.

## Biggest Risks

- v4 pool key construction must match exactly.
- token order must be correct.
- sqrt price initialization must be correct.
- add liquidity through v4 is callback-based and easy to get wrong.
- users can approve or initialize wrong tokens if validation is weak.
- thin liquidity can make swaps behave strangely.

## Recommended Next Step

If time remains after submission packaging, build the functional MVP around a narrow guided flow:

> Create a HookFlow-protected USDT0/WOKB-style pool using the already verified hook and a small helper router.

This gives the strongest chance of finishing something real without destabilizing the current submission.

## Current Implementation

The app now includes a `/create` route for the narrow guided flow.

It supports:

- wallet connection,
- X Layer mainnet network guard,
- prefilled USDT0/WOKB token inputs,
- token sorting and pool ID derivation,
- ERC20 symbol and decimals reads,
- preset selection,
- verified hook and owner-gate display,
- owner-only `applyPreset` transaction path for custom pools,
- PoolManager `initialize` transaction path for custom pools,
- transaction status and OKLink links.

The prefilled USDT0/WOKB pair resolves to the already live HookFlow mainnet proof pool, so the page routes users to the dashboard instead of attempting to initialize a duplicate pool.
