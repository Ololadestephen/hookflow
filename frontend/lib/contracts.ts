export const hookFlowDeployment = {
  chainName: "X Layer Mainnet",
  chainId: 196,
  explorerBaseUrl: "https://www.oklink.com/xlayer",
  hook: "0x826EBCEf75EB77103930282690C839B17AE7C0C0",
  factory: "0x7a04F5f91cF1F682d61fF1c44B7564d9C968E8b2",
  poolManager: "0x360E68faCcca8cA495c1B759Fd9EEe466db9FB32",
  token0: "0x779Ded0c9e1022225f8E0630b35a9b54bE713736",
  token1: "0xe538905cf8410324e03A5A23C1c177a474D59b2b",
  poolId: "0xbfd3acdc7dd950638cdf9d497dac2e536a169530e7c33375aed70e3693283db6",
  oklinkHookUrl:
    "https://www.oklink.com/xlayer/address/0x826EBCEf75EB77103930282690C839B17AE7C0C0"
} as const;

export const hookFlowSelfServeDeployment = {
  chainName: "X Layer Mainnet",
  chainId: 196,
  explorerBaseUrl: "https://www.oklink.com/xlayer",
  hook: "0xC18e6daa59708C1Be5567C350f176319Ee4580C0",
  factory: "0xf82337ba8E19b5a4A0E33434E2697af245D84BCe",
  liquidityRouter: "0x47a4bfA07471baBdC124cbf70020EBD6CcddBD9D",
  poolManager: "0x360E68faCcca8cA495c1B759Fd9EEe466db9FB32",
  token0: "0x779Ded0c9e1022225f8E0630b35a9b54bE713736",
  token1: "0xe538905cf8410324e03A5A23C1c177a474D59b2b",
  poolId: "0xb13a28deaf008674a2c239235c06028f103512e03503c09559daa13c6b0905a7",
  oklinkHookUrl:
    "https://www.oklink.com/xlayer/address/0xC18e6daa59708C1Be5567C350f176319Ee4580C0",
  transactions: {
    factoryDeploy: "0x708ec134d9d5439abc3e57644454ca3fe5983aaed82e98ca94eb1d2883c1d6bf",
    hookDeploy: "0xcf5f0d8da7a53f07a01b4423dac6d2bf8cde0f6f1a81a53cec13734a4f5df1a2",
    routerDeploy: "0x40cf8b024b21970dac7d199acbc33e05642b3c1de30e4e8cd130144849195725",
    safePreset: "0xa31e0de9d13633d02ef8e65f59decba0ec5b053b7712d353a7ee1669ca6103da",
    initialize: "0x10ab12186145ceaabed95b7fe59ed5b679c09ec959b4e94450cd6bf482fa4e3f",
    approveToken0: "0x6b0da758916e3c5135695a15c8c4ba9de9f0fea6846a41ba15ad489f170f7cf5",
    approveToken1: "0xd0cb24e8ae97b9b114e71f6eedecdbd843df04018f065b3b143752ec4b46c588",
    addLiquidity: "0x11d1b9f10d963514bc11d6271071caf6b3bc7956e33fd6412409aa6087900bc5"
  }
} as const;

export const hookFlowState = {
  appliedFeePips: "11,000",
  toxicityScore: "89 / 100",
  cooldown: "Active",
  preset: "Volatile Pair",
  sameDirectionCount: "7",
  flowBias: "One-sided WOKB -> USDT0 flow"
} as const;

export const deploymentProof = [
  { label: "Factory deploy", tx: "0xfc3b20258a8b27899129027981947bb8901eeddb7ea831dca70b1dfe2b5a70d9" },
  { label: "Hook deploy", tx: "0xe4bda53db180cd49b0d29a124cde6b1d09dc18a6295d372d05a135dfac45a2a6" },
  { label: "Hook config", tx: "0x1201ff9c60e5b24e499cecf3133e934f40defce5f3232902cd02de1a16b3b921" },
  { label: "Pool initialize", tx: "0x906102ef942606e3b90004f476b0700a61d826c4ac2b1d428a8a58ec8cdc0ad6" },
  { label: "Add proof liquidity", tx: "0xd0a69260cf7d340c78e77d077a8fec0f6ed9b8473ccf264dcc1e2ae5a871d816" }
] as const;

export const behaviorProof = {
  chainName: "X Layer Mainnet",
  explorerBaseUrl: "https://www.oklink.com/xlayer",
  hook: "0x826EBCEf75EB77103930282690C839B17AE7C0C0",
  poolId: "0xbfd3acdc7dd950638cdf9d497dac2e536a169530e7c33375aed70e3693283db6"
} as const;

export const flowEvents = [
  {
    step: "Size premium",
    trigger: "0.011 WOKB exact-input swap",
    fee: "4000 pips",
    bucket: "Medium",
    score: "10",
    mode: "Normal",
    tx: "0xe20a15e23ee05e3fae8998a19d620006f798fa82a98c20dfcae60d4426496ede"
  },
  {
    step: "Fixed fee override",
    trigger: "Small WOKB swap after liquidity",
    fee: "3000 pips",
    bucket: "Small",
    score: "54",
    mode: "Normal",
    tx: "0x71f080b7f04635034751c2ba370634e9bc84e7b81f0f86241b18f48f350bc949"
  },
  {
    step: "Toxicity premium",
    trigger: "Same-direction flow",
    fee: "5000 pips",
    bucket: "Small",
    score: "61 / 68 / 75",
    mode: "Elevated",
    tx: "0x56cf0b61477d4fe657b4a474dc0650fc217370ca4325765d4cc4e15e459497a7"
  },
  {
    step: "Defensive trigger",
    trigger: "Toxic score crosses 80",
    fee: "11000 pips",
    bucket: "Small",
    score: "82",
    mode: "Defensive",
    tx: "0xc689bc3da8dba2d96ef1d55040dded8e393e83780edf091cb3e06b865475fab2"
  },
  {
    step: "Defensive cooldown",
    trigger: "Protection remains active",
    fee: "11000 pips",
    bucket: "Small",
    score: "89",
    mode: "Defensive",
    tx: "0x2ebed6d3b46fdd45a049910fbb61c86e88cc82ca17fd65d6167e655fc96665eb"
  }
] as const;
