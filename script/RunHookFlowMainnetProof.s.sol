// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script} from "forge-std/Script.sol";
import {HookFlowHook} from "../src/HookFlowHook.sol";
import {IERC20Minimal} from "v4-core/src/interfaces/external/IERC20Minimal.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {PoolModifyLiquidityTest} from "v4-core/src/test/PoolModifyLiquidityTest.sol";
import {PoolSwapTest} from "v4-core/src/test/PoolSwapTest.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";
import {LPFeeLibrary} from "v4-core/src/libraries/LPFeeLibrary.sol";
import {TickMath} from "v4-core/src/libraries/TickMath.sol";
import {Currency} from "v4-core/src/types/Currency.sol";
import {PoolId, PoolIdLibrary} from "v4-core/src/types/PoolId.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {ModifyLiquidityParams, SwapParams} from "v4-core/src/types/PoolOperation.sol";

contract RunHookFlowMainnetProof is Script {
    using PoolIdLibrary for PoolKey;

    address internal constant X_LAYER_MAINNET_POOL_MANAGER = 0x360E68faCcca8cA495c1B759Fd9EEe466db9FB32;
    address internal constant HOOKFLOW_MAINNET_HOOK = 0x826EBCEf75EB77103930282690C839B17AE7C0C0;
    address internal constant USDT0 = 0x779Ded0c9e1022225f8E0630b35a9b54bE713736;
    address internal constant WOKB = 0xe538905cf8410324e03A5A23C1c177a474D59b2b;

    event MainnetProofExecuted(
        address indexed modifyLiquidityRouter, address indexed swapRouter, PoolId indexed poolId, int256 liquidityDelta
    );

    struct ProofParams {
        address poolManager;
        address hook;
        address token0;
        address token1;
        int24 tickLower;
        int24 tickUpper;
        int256 liquidityDelta;
        uint256 mediumSwapAmount;
        uint256 smallSwapAmount;
        uint256 toxicSwapCount;
    }

    function run() external returns (PoolModifyLiquidityTest modifyLiquidityRouter, PoolSwapTest swapRouter) {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        ProofParams memory params = proofParams();
        PoolKey memory key = proofPoolKey(params);

        vm.startBroadcast(deployerKey);

        modifyLiquidityRouter = new PoolModifyLiquidityTest(IPoolManager(params.poolManager));
        swapRouter = new PoolSwapTest(IPoolManager(params.poolManager));

        approveRouters(params, modifyLiquidityRouter, swapRouter);

        addProofLiquidity(modifyLiquidityRouter, key, params);

        PoolSwapTest.TestSettings memory settings =
            PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false});

        swapRouter.swap(key, exactInputToken1ForToken0(params.mediumSwapAmount), settings, "");

        for (uint256 i = 0; i < params.toxicSwapCount; i++) {
            swapRouter.swap(key, exactInputToken1ForToken0(params.smallSwapAmount), settings, "");
        }

        emit MainnetProofExecuted(
            address(modifyLiquidityRouter), address(swapRouter), key.toId(), params.liquidityDelta
        );

        vm.stopBroadcast();
    }

    function proofParams() internal view returns (ProofParams memory params) {
        params.poolManager = vm.envOr("POOL_MANAGER", X_LAYER_MAINNET_POOL_MANAGER);
        params.hook = vm.envOr("HOOK_ADDRESS", HOOKFLOW_MAINNET_HOOK);
        params.token0 = vm.envOr("TOKEN0", USDT0);
        params.token1 = vm.envOr("TOKEN1", WOKB);
        params.tickLower = int24(vm.envOr("PROOF_TICK_LOWER", int256(231_480)));
        params.tickUpper = int24(vm.envOr("PROOF_TICK_UPPER", int256(240_000)));
        params.liquidityDelta = int256(vm.envOr("PROOF_LIQUIDITY_DELTA", uint256(212_907_858_906)));
        params.mediumSwapAmount = vm.envOr("PROOF_MEDIUM_SWAP_AMOUNT", uint256(0.011 ether));
        params.smallSwapAmount = vm.envOr("PROOF_SMALL_SWAP_AMOUNT", uint256(0.0001 ether));
        params.toxicSwapCount = vm.envOr("PROOF_TOXIC_SWAP_COUNT", uint256(6));
    }

    function proofPoolKey(ProofParams memory params) internal pure returns (PoolKey memory key) {
        key = PoolKey({
            currency0: Currency.wrap(params.token0),
            currency1: Currency.wrap(params.token1),
            fee: LPFeeLibrary.DYNAMIC_FEE_FLAG,
            tickSpacing: 60,
            hooks: IHooks(params.hook)
        });
    }

    function approveRouters(
        ProofParams memory params,
        PoolModifyLiquidityTest modifyLiquidityRouter,
        PoolSwapTest swapRouter
    ) internal {
        IERC20Minimal(params.token0)
            .approve(address(modifyLiquidityRouter), vm.envOr("PROOF_TOKEN0_LP_ALLOWANCE", uint256(1_000_000)));
        IERC20Minimal(params.token1)
            .approve(address(modifyLiquidityRouter), vm.envOr("PROOF_TOKEN1_LP_ALLOWANCE", uint256(0.00002 ether)));
        IERC20Minimal(params.token0).approve(address(swapRouter), vm.envOr("PROOF_TOKEN0_SWAP_ALLOWANCE", uint256(1)));
        IERC20Minimal(params.token1)
            .approve(address(swapRouter), vm.envOr("PROOF_TOKEN1_SWAP_ALLOWANCE", uint256(0.012 ether)));
    }

    function addProofLiquidity(
        PoolModifyLiquidityTest modifyLiquidityRouter,
        PoolKey memory key,
        ProofParams memory params
    ) internal {
        modifyLiquidityRouter.modifyLiquidity(
            key,
            ModifyLiquidityParams({
                tickLower: params.tickLower,
                tickUpper: params.tickUpper,
                liquidityDelta: params.liquidityDelta,
                salt: bytes32(0)
            }),
            ""
        );
    }

    function exactInputToken1ForToken0(uint256 amount) internal pure returns (SwapParams memory) {
        return SwapParams({
            zeroForOne: false, amountSpecified: -int256(amount), sqrtPriceLimitX96: TickMath.MAX_SQRT_PRICE - 1
        });
    }

    function quoteCurrentState() external view returns (HookFlowHook hook, PoolId poolId) {
        hook = HookFlowHook(HOOKFLOW_MAINNET_HOOK);
        PoolKey memory key = PoolKey({
            currency0: Currency.wrap(USDT0),
            currency1: Currency.wrap(WOKB),
            fee: LPFeeLibrary.DYNAMIC_FEE_FLAG,
            tickSpacing: 60,
            hooks: IHooks(HOOKFLOW_MAINNET_HOOK)
        });
        poolId = key.toId();
    }
}
