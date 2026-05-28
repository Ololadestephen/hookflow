// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script} from "forge-std/Script.sol";
import {HookFlowHook} from "../src/HookFlowHook.sol";
import {HookFlowTypes} from "../src/types/HookFlowTypes.sol";
import {HookFlowFactory} from "./DeployHookFlow.s.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";
import {PoolManager} from "v4-core/src/PoolManager.sol";
import {TestERC20} from "v4-core/src/test/TestERC20.sol";
import {PoolModifyLiquidityTest} from "v4-core/src/test/PoolModifyLiquidityTest.sol";
import {PoolSwapTest} from "v4-core/src/test/PoolSwapTest.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {LPFeeLibrary} from "v4-core/src/libraries/LPFeeLibrary.sol";
import {TickMath} from "v4-core/src/libraries/TickMath.sol";
import {Currency} from "v4-core/src/types/Currency.sol";
import {PoolId, PoolIdLibrary} from "v4-core/src/types/PoolId.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {ModifyLiquidityParams, SwapParams} from "v4-core/src/types/PoolOperation.sol";

contract DemoHookFlow is Script {
    using PoolIdLibrary for PoolKey;

    uint160 internal constant SQRT_PRICE_1_1 = 79_228_162_514_264_337_593_543_950_336;
    uint160 internal constant HOOK_FLAGS = Hooks.BEFORE_SWAP_FLAG | Hooks.AFTER_SWAP_FLAG;

    event DemoDeployed(
        address indexed poolManager,
        address indexed hook,
        address indexed token0,
        address token1,
        address modifyLiquidityRouter,
        address swapRouter,
        PoolId poolId
    );

    function run()
        external
        returns (PoolManager poolManager, HookFlowHook hook, TestERC20 token0, TestERC20 token1, PoolId poolId)
    {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address owner = vm.envOr("HOOK_OWNER", vm.addr(deployerKey));

        vm.startBroadcast(deployerKey);

        poolManager = new PoolManager(owner);
        PoolModifyLiquidityTest modifyLiquidityRouter = new PoolModifyLiquidityTest(poolManager);
        PoolSwapTest swapRouter = new PoolSwapTest(poolManager);

        (token0, token1) = deploySortedTokens(1_000_000 ether);

        HookFlowFactory factory = new HookFlowFactory();
        bytes32 salt = mineSalt(address(factory), owner, address(poolManager), 0);
        hook = factory.deploy(salt, owner, address(poolManager));

        PoolKey memory key = PoolKey({
            currency0: Currency.wrap(address(token0)),
            currency1: Currency.wrap(address(token1)),
            fee: LPFeeLibrary.DYNAMIC_FEE_FLAG,
            tickSpacing: 60,
            hooks: IHooks(address(hook))
        });
        poolId = key.toId();

        hook.setPoolConfig(poolId, demoConfig());
        poolManager.initialize(key, SQRT_PRICE_1_1);

        token0.approve(address(modifyLiquidityRouter), type(uint256).max);
        token1.approve(address(modifyLiquidityRouter), type(uint256).max);
        token0.approve(address(swapRouter), type(uint256).max);
        token1.approve(address(swapRouter), type(uint256).max);

        modifyLiquidityRouter.modifyLiquidity(
            key, ModifyLiquidityParams({tickLower: -120, tickUpper: 120, liquidityDelta: 1e18, salt: 0}), ""
        );

        PoolSwapTest.TestSettings memory settings =
            PoolSwapTest.TestSettings({takeClaims: false, settleUsingBurn: false});

        swapRouter.swap(key, exactInput(false, 1e12), settings, "");
        swapRouter.swap(key, exactInput(false, 1e15), settings, "");
        swapRouter.swap(key, exactInput(false, 1e14), settings, "");
        swapRouter.swap(key, exactInput(false, 1e14), settings, "");
        swapRouter.swap(key, exactInput(false, 1e14), settings, "");
        swapRouter.swap(key, exactInput(false, 1e14), settings, "");
        swapRouter.swap(key, exactInput(false, 1e14), settings, "");

        emit DemoDeployed(
            address(poolManager),
            address(hook),
            address(token0),
            address(token1),
            address(modifyLiquidityRouter),
            address(swapRouter),
            poolId
        );

        vm.stopBroadcast();
    }

    function deploySortedTokens(uint256 amountToMint) internal returns (TestERC20 token0, TestERC20 token1) {
        TestERC20 first = new TestERC20(amountToMint);
        TestERC20 second = new TestERC20(amountToMint);

        if (address(first) < address(second)) return (first, second);
        return (second, first);
    }

    function exactInput(bool zeroForOne, int256 amount) internal pure returns (SwapParams memory) {
        return SwapParams({
            zeroForOne: zeroForOne,
            amountSpecified: -amount,
            sqrtPriceLimitX96: zeroForOne ? TickMath.MIN_SQRT_PRICE + 1 : TickMath.MAX_SQRT_PRICE - 1
        });
    }

    function mineSalt(address factory, address owner, address poolManager, uint256 saltStart)
        public
        pure
        returns (bytes32 salt)
    {
        bytes32 initCodeHash =
            keccak256(abi.encodePacked(type(HookFlowHook).creationCode, abi.encode(owner, poolManager)));

        for (uint256 i = saltStart; i < type(uint256).max; i++) {
            salt = bytes32(i);
            address predicted =
                address(uint160(uint256(keccak256(abi.encodePacked(bytes1(0xff), factory, salt, initCodeHash)))));

            if (uint160(predicted) & Hooks.ALL_HOOK_MASK == HOOK_FLAGS) return salt;
        }

        revert("salt not found");
    }

    function demoConfig() public pure returns (HookFlowTypes.PoolConfig memory) {
        return HookFlowTypes.PoolConfig({
            enabled: true,
            baseFeePips: 3_000,
            maxFeePips: 15_000,
            mediumSizePremiumPips: 1_000,
            largeSizePremiumPips: 5_000,
            elevatedToxicPremiumPips: 2_000,
            defensiveToxicPremiumPips: 8_000,
            mediumTradeSize: 1e15,
            largeTradeSize: 5e15,
            toxicScoreElevated: 55,
            toxicScoreDefensive: 80,
            cooldownSeconds: 300,
            windowSeconds: 900
        });
    }
}
