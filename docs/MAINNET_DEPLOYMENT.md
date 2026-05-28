# HookFlow X Layer Mainnet Deployment

Deployment date: May 27, 2026

HookFlow is deployed on X Layer mainnet against the official Uniswap v4 PoolManager.

## Network

- Chain: X Layer Mainnet
- Chain ID: 196
- Explorer: https://www.oklink.com/xlayer
- PoolManager: `0x360E68faCcca8cA495c1B759Fd9EEe466db9FB32`

## Pool

- Pair: USDT0 / WOKB
- Token0, USDT0: `0x779Ded0c9e1022225f8E0630b35a9b54bE713736`
- Token1, WOKB: `0xe538905cf8410324e03A5A23C1c177a474D59b2b`
- Pool ID: `0xbfd3acdc7dd950638cdf9d497dac2e536a169530e7c33375aed70e3693283db6`
- Initial sqrtPriceX96: `8421858656182034097679017132552161`
- Initial tick: `231491`

## Contracts

- HookFlowFactory: `0x7a04F5f91cF1F682d61fF1c44B7564d9C968E8b2`
- HookFlowHook: `0x826EBCEf75EB77103930282690C839B17AE7C0C0`
- OKLink source verification: verified

## Transactions

- Factory deploy: `0xfc3b20258a8b27899129027981947bb8901eeddb7ea831dca70b1dfe2b5a70d9`
- Hook deploy: `0xe4bda53db180cd49b0d29a124cde6b1d09dc18a6295d372d05a135dfac45a2a6`
- Hook config: `0x1201ff9c60e5b24e499cecf3133e934f40defce5f3232902cd02de1a16b3b921`
- Pool initialize: `0x906102ef942606e3b90004f476b0700a61d826c4ac2b1d428a8a58ec8cdc0ad6`

## Mainnet Status

The mainnet pool and hook are deployed, initialized, funded with demo liquidity, and triggered by real swaps. The dashboard links these mainnet setup and behavior transactions directly to OKLink.

## Mainnet Proof Routers

These small routers were deployed only to drive verifiable proof transactions through the official X Layer Uniswap v4 PoolManager.

- Modify-liquidity router: `0xd43a15304d44Ecf160753A87456C47Cba3Ddd685`
- Swap router: `0x1638Dc5A0575DB8D8CAD144529d7Fa325926b3Ec`

## Mainnet Liquidity Proof

- Add liquidity: `0xd0a69260cf7d340c78e77d077a8fec0f6ed9b8473ccf264dcc1e2ae5a871d816`
- Tick range: `231480` to `240000`
- Liquidity delta: `212907858906`

## Mainnet Behavior Proof

Real mainnet swaps triggered:

- fixed beforeSwap fee override
- size premium
- toxicity premium
- defensive cooldown

| Step | Applied fee | Size bucket | Toxicity score | Defensive mode | Transaction |
| --- | ---: | --- | ---: | --- | --- |
| Size premium | `4000` | Medium | `10` | false | `0xe20a15e23ee05e3fae8998a19d620006f798fa82a98c20dfcae60d4426496ede` |
| Fixed fee override | `3000` | Small | `54` | false | `0x71f080b7f04635034751c2ba370634e9bc84e7b81f0f86241b18f48f350bc949` |
| Toxicity premium | `5000` | Small | `61` | false | `0x18af0003cf25200258c9222c53f8f6ad5db13995bff730ba8cdb472ac0e8546b` |
| Toxicity premium | `5000` | Small | `68` | false | `0x8b224fcf0ff5319eaf1e3f0ca0f58d9613e83dda25ad48706cdfd9aa258a6051` |
| Toxicity premium | `5000` | Small | `75` | false | `0x56cf0b61477d4fe657b4a474dc0650fc217370ca4325765d4cc4e15e459497a7` |
| Defensive trigger | `11000` | Small | `82` | true | `0xc689bc3da8dba2d96ef1d55040dded8e393e83780edf091cb3e06b865475fab2` |
| Defensive cooldown | `11000` | Small | `89` | true | `0x2ebed6d3b46fdd45a049910fbb61c86e88cc82ca17fd65d6167e655fc96665eb` |

## Public Self-Serve Deployment

This deployment opens the product flow for LPs without giving them arbitrary config power. After security hardening, `applySafePreset` is restricted to the hook owner so third parties cannot squat future pools or front-run preset selection. The live LP path stays public through the verified router.

- Public factory: `0xf82337ba8E19b5a4A0E33434E2697af245D84BCe`
- Public HookFlowHook: `0xC18e6daa59708C1Be5567C350f176319Ee4580C0`
- HookFlowLiquidityRouter: `0x47a4bfA07471baBdC124cbf70020EBD6CcddBD9D`
- Self-serve pool ID: `0xb13a28deaf008674a2c239235c06028f103512e03503c09559daa13c6b0905a7`
- OKLink verification: public hook, public factory, and liquidity router are verified.

### Self-Serve Transactions

- Public factory deploy: `0x708ec134d9d5439abc3e57644454ca3fe5983aaed82e98ca94eb1d2883c1d6bf`
- Public hook deploy: `0xcf5f0d8da7a53f07a01b4423dac6d2bf8cde0f6f1a81a53cec13734a4f5df1a2`
- Safe preset applied: `0xa31e0de9d13633d02ef8e65f59decba0ec5b053b7712d353a7ee1669ca6103da`
- Self-serve pool initialize: `0x10ab12186145ceaabed95b7fe59ed5b679c09ec959b4e94450cd6bf482fa4e3f`
- Safe router deploy: `0x40cf8b024b21970dac7d199acbc33e05642b3c1de30e4e8cd130144849195725`
- Add liquidity through router: `0x11d1b9f10d963514bc11d6271071caf6b3bc7956e33fd6412409aa6087900bc5`
