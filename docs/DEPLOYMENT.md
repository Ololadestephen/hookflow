# HookFlow Deployment Notes

This repo is now wired to real Uniswap v4 core imports. The deployment path is designed for X Layer and keeps the demo focused on one dynamic-fee pool.

## X Layer Network Details

Official X Layer RPC docs list:

- Mainnet chain ID: `196`
- Mainnet RPC: `https://rpc.xlayer.tech`
- Testnet chain ID: `1952`
- Testnet RPC: `https://testrpc.xlayer.tech/terigon`

Official Uniswap v4 deployments currently list X Layer mainnet:

- PoolManager: `0x360E68facCca8cA495c1B759Fd9EEe466db9FB32`
- PositionManager: `0xCFeAFc6928dc385A342E7aC6491D371D2871458b`
- StateView: `0x76fD297e2D437cd7f76D50F01AfE6160f86E9990`
- Quoter: `0x8928074CA1B241d8eC02815881c1aF11e8bC5219`

For testnet, set `POOL_MANAGER` to the competition-provided or self-deployed v4 PoolManager address.

## Deploy Hook And Initialize Pool

Create a local `.env` from `.env.example`, then set:

- `PRIVATE_KEY`
- `TOKEN0`
- `TOKEN1`
- `HOOK_OWNER`
- `POOL_MANAGER` if not using the X Layer mainnet default
- `DEPLOY_POOL_MANAGER=true` on testnet if there is no official/testnet v4 PoolManager available

Run:

```sh
source .env
forge script script/DeployHookFlow.s.sol:DeployHookFlow \
  --rpc-url "$XLAYER_RPC_URL" \
  --broadcast
```

The script:

- optionally deploys a fresh v4 `PoolManager`,
- deploys a small CREATE2 factory,
- mines a hook salt for the exact `beforeSwap + afterSwap` permission bits,
- deploys `HookFlowHook`,
- sets demo pool config,
- optionally initializes the dynamic-fee pool.

## Verify

X Layer verification uses OKLink. After deployment, wait at least one minute, then run:

```sh
forge verify-contract <HOOK_ADDRESS> \
  src/HookFlowHook.sol:HookFlowHook \
  --chain 196 \
  --verifier oklink \
  --verifier-url https://www.oklink.com/api/v5/explorer/contract/verify-source-code-plugin/XLAYER \
  --api-key "$OKLINK_API_KEY" \
  --constructor-args $(cast abi-encode "constructor(address,address)" "$HOOK_OWNER" "$POOL_MANAGER") \
  --watch
```

For X Layer testnet, use chain `1952` and verifier URL suffix `XLAYER_TESTNET`.

## Demo Transactions

After deployment, the onchain demo should show:

- small swap: base fee
- medium or large swap: size premium
- repeated same-direction swaps: elevated toxicity premium
- enough repeated flow: defensive cooldown

Track the hook's `FlowAssessed` event for:

- applied fee
- size bucket
- toxicity score
- defensive mode
