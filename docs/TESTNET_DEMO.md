# HookFlow X Layer Testnet Demo

Deployment date: May 27, 2026

Network:

- X Layer testnet
- Chain ID: `1952`

## Hardened Phase 2 Demo Contracts

- PoolManager: `0x47a4bfA07471baBdC124cbf70020EBD6CcddBD9D`
- HookFlowHook: `0x921057FC269D3154e0521d9b2b85959154B440c0`
- Token0: `0xC253a9deF4660f931d2038b4421110e98ac4C370`
- Token1: `0xe3Bc08ACe19560009D2E511190E78fC8d6b73915`
- Modify-liquidity helper: `0x421B57eA0AB9aa3e9E0422244660Be9507d42C12`
- Swap helper: `0xA1cbb3F7cecEaD079EAFd5d9d096A7868A680E6A`
- Pool ID: `0xd67e585740e092ea91958d5969f5f01842cc0eda1ece1d7acc61b547f05996ba`

Verification:

- Hardened Phase 2 HookFlowHook is verified on OKLink for X Layer testnet.

## Key Transactions

- PoolManager deploy: `0xae39424198d268df101f564fb29eb06a7116ec3a294cb8710fd7b48c70bbf131`
- Hook deploy through factory: `0xc57213cd7c7522f2e7f7e63ce6a9710a6d24258daf8d04cd2a04a0c5d2cf223f`
- Hook config: `0xae9088ee0f137c79a05692630be48203683e73884ed2b716bed1fc50f113eb85`
- Pool initialize: `0xb1ac0caadfe80d398bbe28d8275366ec1215cc4539e43f4fbd2d4d367e095f3b`
- Add liquidity: `0x691f896f0343640a03e2a563889a1e2dd113484b6eea9a528dd4c1babafb71ee`

## Swap Proof

The demo sends seven same-direction swaps through the v4 PoolManager. Each swap triggers `FlowAssessed`.

Event fields:

```solidity
FlowAssessed(
    PoolId indexed poolId,
    uint24 appliedFeePips,
    uint8 sizeBucket,
    uint32 toxicScore,
    bool defensiveMode
)
```

Observed progression:

| Step | Applied fee pips | Size bucket | Toxic score | Defensive mode |
| --- | ---: | ---: | ---: | --- |
| Small baseline swap | `3000` | `0` | `10` | `false` |
| Medium size-aware swap | `4000` | `1` | `54` | `false` |
| Same-direction swap 1 | `5000` | `0` | `61` | `false` |
| Same-direction swap 2 | `5000` | `0` | `68` | `false` |
| Same-direction swap 3 | `5000` | `0` | `75` | `false` |
| Defensive trigger swap | `11000` | `0` | `82` | `true` |
| Defensive cooldown swap | `11000` | `0` | `89` | `true` |

Final hook state after the demo:

- `buyVolume`: `1501000000000000`
- `sellVolume`: `0`
- `sameDirectionCount`: `7`
- `lastToxicScore`: `96`
- `defensiveUntil`: set

This proves the MVP behavior onchain:

- fixed dynamic fee override works,
- size premium works,
- toxicity premium works,
- defensive cooldown works.
