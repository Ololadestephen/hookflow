# HookFlow Architecture

HookFlow is built as one Uniswap v4 hook contract with small supporting libraries.

The architecture goal is simple:

> Keep the hook behavior explainable, auditable, and demonstrable onchain.

## Components

### `HookFlowHook.sol`

The main v4 hook contract.

Responsibilities:

- implements `IHooks`,
- stores pool-level config,
- stores pool-level flow state,
- gates hook callbacks to the configured PoolManager,
- returns fee overrides from `beforeSwap`,
- updates rolling flow state in `afterSwap`,
- applies named presets,
- validates custom config,
- emits events for proof and analytics.

### `HookFlowFeeLogic.sol`

Pure fee and flow logic.

Responsibilities:

- classify trade size,
- preview toxicity score,
- compute toxicity premium,
- clamp final fee,
- apply the v4 override fee flag,
- derive next flow state after a swap.

### `HookFlowPresetLib.sol`

Named production presets.

Presets:

- `StablePair`
- `VolatilePair`
- `LaunchPool`
- `LongTailPool`

The presets make HookFlow easier to understand as a product. Instead of asking every pool creator to tune raw numbers, HookFlow can start from a market-specific risk profile.

### `HookFlowTypes.sol`

Shared types.

Important structs:

```solidity
struct PoolConfig {
    bool enabled;
    uint24 baseFeePips;
    uint24 maxFeePips;
    uint24 mediumSizePremiumPips;
    uint24 largeSizePremiumPips;
    uint24 elevatedToxicPremiumPips;
    uint24 defensiveToxicPremiumPips;
    uint128 mediumTradeSize;
    uint128 largeTradeSize;
    uint32 toxicScoreElevated;
    uint32 toxicScoreDefensive;
    uint32 cooldownSeconds;
    uint32 windowSeconds;
}
```

```solidity
struct PoolFlowState {
    uint64 windowStart;
    uint64 defensiveUntil;
    uint128 buyVolume;
    uint128 sellVolume;
    uint32 sameDirectionCount;
    bool lastZeroForOne;
    uint32 lastToxicScore;
}
```

## Hook Lifecycle

### `beforeSwap`

`beforeSwap` is the pricing path.

Flow:

```text
PoolManager calls beforeSwap
  -> HookFlow loads PoolConfig
  -> HookFlow loads PoolFlowState
  -> HookFlow calculates size bucket
  -> HookFlow previews toxicity score
  -> HookFlow calculates effective fee
  -> HookFlow emits FlowAssessed
  -> HookFlow returns OVERRIDE_FEE_FLAG | fee
```

This is where the dynamic fee override happens.

The hook returns:

```solidity
(
    IHooks.beforeSwap.selector,
    BeforeSwapDeltaLibrary.ZERO_DELTA,
    LPFeeLibrary.OVERRIDE_FEE_FLAG | appliedFee
)
```

The pool must be a v4 dynamic-fee pool for the override to apply.

### `afterSwap`

`afterSwap` is the accounting path.

Flow:

```text
PoolManager calls afterSwap
  -> HookFlow calculates absolute trade amount
  -> HookFlow updates buy/sell volume
  -> HookFlow updates same-direction count
  -> HookFlow stores last toxicity score
  -> HookFlow sets defensiveUntil if threshold is crossed
```

Splitting logic this way keeps the fee decision and state update easy to reason about:

- `beforeSwap` decides the price of the current swap,
- `afterSwap` records the swap for future decisions.

## Fee Calculation

HookFlow calculates:

```text
effectiveFee = baseFee + sizePremium + toxicityPremium
effectiveFee = min(effectiveFee, maxFee)
```

Fee units are Uniswap v4 pips:

- `1_000_000` pips = 100%
- `10_000` pips = 1%
- `3_000` pips = 0.30%

## Size Premium

The size module uses two thresholds:

- `mediumTradeSize`
- `largeTradeSize`

Classification:

```text
amount >= largeTradeSize  -> Large bucket
amount >= mediumTradeSize -> Medium bucket
otherwise                 -> Small bucket
```

Small trades pay no size premium. Medium and large trades add configured premiums.

## Toxicity Score

The toxicity score is intentionally lightweight for the MVP.

Inputs:

- rolling buy volume,
- rolling sell volume,
- same-direction streak,
- current trade direction,
- current trade size.

The score is based on:

- imbalance between buy and sell volume,
- repeated same-direction swaps,
- a baseline score.

The output is capped at `100`.

Thresholds:

```text
toxicScore < elevated threshold   -> normal
toxicScore >= elevated threshold  -> elevated premium
toxicScore >= defensive threshold -> defensive premium and cooldown
```

## Defensive Cooldown

When toxic flow crosses the defensive threshold, HookFlow sets:

```solidity
defensiveUntil = block.timestamp + cooldownSeconds;
```

During cooldown, the hook applies the defensive toxic premium even if the next trade reverses direction.

After cooldown expires, pricing falls back to the current flow score.

## Config Validation

Custom configs are bounded to avoid unsafe or nonsensical pool settings.

Validation checks include:

- `baseFeePips <= maxFeePips`,
- `maxFeePips <= MAX_CONFIGURED_FEE_PIPS`,
- size premiums are bounded,
- toxic premiums are bounded,
- medium premium does not exceed large premium,
- elevated toxicity premium does not exceed defensive premium,
- `largeTradeSize > mediumTradeSize`,
- toxicity thresholds are ordered and capped at `100`,
- cooldown cannot exceed one hour,
- rolling window must be between one minute and one day.

These bounds make the hook more credible for real pool pilots.

## Presets

HookFlow has four named presets.

Stable pair:

- low base fee,
- low max fee,
- softer toxicity response.

Volatile pair:

- standard AMM-style base fee,
- stronger toxicity premium,
- moderate cooldown.

Launch pool:

- more defensive defaults,
- lower size thresholds,
- higher max fee.

Long-tail pool:

- strongest protection,
- higher base fee,
- high defensive premium.

## Events

### `FlowAssessed`

```solidity
event FlowAssessed(
    PoolId indexed poolId,
    uint24 appliedFeePips,
    uint8 sizeBucket,
    uint32 toxicScore,
    bool defensiveMode
);
```

This event is the main analytics and demo primitive. It proves what fee was applied and why.

### `PoolConfigured`

Emitted when a custom config is set.

### `PoolPresetApplied`

Emitted when a named preset is applied.

## Security Model

The hook keeps the MVP intentionally narrow.

Controls:

- only owner can configure pools,
- only configured PoolManager can call hook paths,
- no external keeper dependency,
- no oracle dependency,
- no per-user reputation or identity logic,
- no token custody in the hook.

Main limitation:

The current toxicity model is heuristic. It is explainable and demonstrable, but it is not a full market microstructure model.

## Deployment Model

Uniswap v4 hook permissions are encoded in the hook address bits.

HookFlow needs:

- `BEFORE_SWAP_FLAG`
- `AFTER_SWAP_FLAG`

The deployment scripts use CREATE2 salt mining so the deployed hook address has the required permission bits.

Scripts:

- `DeployHookFlow.s.sol`: deploys/configures a hook and pool key.
- `DemoHookFlow.s.sol`: deploys a full testnet demo stack with mock tokens, liquidity, and swaps.

## Why This Architecture Works For The Hackathon

HookFlow is small enough to audit quickly, but complete enough to show real hook behavior.

It optimizes for the judging requirements:

- innovation: flow-aware fee segmentation,
- market potential: better LP compensation during risky flow,
- completion: deployed hook, deployed pool, verified address, real swaps.

