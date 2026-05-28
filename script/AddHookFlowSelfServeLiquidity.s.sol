// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script} from "forge-std/Script.sol";
import {HookFlowLiquidityRouter} from "../src/HookFlowLiquidityRouter.sol";
import {IERC20Minimal} from "v4-core/src/interfaces/external/IERC20Minimal.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";
import {LPFeeLibrary} from "v4-core/src/libraries/LPFeeLibrary.sol";
import {Currency} from "v4-core/src/types/Currency.sol";
import {PoolId, PoolIdLibrary} from "v4-core/src/types/PoolId.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {ModifyLiquidityParams} from "v4-core/src/types/PoolOperation.sol";

contract AddHookFlowSelfServeLiquidity is Script {
    using PoolIdLibrary for PoolKey;

    address internal constant PUBLIC_HOOK = 0xC18e6daa59708C1Be5567C350f176319Ee4580C0;
    address internal constant LIQUIDITY_ROUTER = 0x47a4bfA07471baBdC124cbf70020EBD6CcddBD9D;
    address internal constant USDT0 = 0x779Ded0c9e1022225f8E0630b35a9b54bE713736;
    address internal constant WOKB = 0xe538905cf8410324e03A5A23C1c177a474D59b2b;

    function run() external returns (PoolId poolId) {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address token0 = vm.envOr("TOKEN0", USDT0);
        address token1 = vm.envOr("TOKEN1", WOKB);
        address hook = vm.envOr("PUBLIC_HOOK", PUBLIC_HOOK);
        address payable router = payable(vm.envOr("LIQUIDITY_ROUTER", LIQUIDITY_ROUTER));
        int24 tickLower = int24(vm.envOr("LP_TICK_LOWER", int256(231_480)));
        int24 tickUpper = int24(vm.envOr("LP_TICK_UPPER", int256(240_000)));
        int256 liquidityDelta = int256(vm.envOr("LP_LIQUIDITY_DELTA", uint256(212_907_858_906)));
        uint256 token0Allowance = vm.envOr("LP_TOKEN0_ALLOWANCE", uint256(1_000_000));
        uint256 token1Allowance = vm.envOr("LP_TOKEN1_ALLOWANCE", uint256(0.00002 ether));

        PoolKey memory key = PoolKey({
            currency0: Currency.wrap(token0),
            currency1: Currency.wrap(token1),
            fee: LPFeeLibrary.DYNAMIC_FEE_FLAG,
            tickSpacing: 60,
            hooks: IHooks(hook)
        });
        poolId = key.toId();

        vm.startBroadcast(deployerKey);

        IERC20Minimal(token0).approve(router, token0Allowance);
        IERC20Minimal(token1).approve(router, token1Allowance);
        HookFlowLiquidityRouter(router).modifyLiquidity(
            key,
            ModifyLiquidityParams({
                tickLower: tickLower,
                tickUpper: tickUpper,
                liquidityDelta: liquidityDelta,
                salt: bytes32(0)
            }),
            token0Allowance,
            token1Allowance,
            block.timestamp + 20 minutes,
            ""
        );

        vm.stopBroadcast();
    }
}
