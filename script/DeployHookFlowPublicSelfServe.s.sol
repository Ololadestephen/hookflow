// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script} from "forge-std/Script.sol";
import {HookFlowHook} from "../src/HookFlowHook.sol";
import {HookFlowLiquidityRouter} from "../src/HookFlowLiquidityRouter.sol";
import {HookFlowTypes} from "../src/types/HookFlowTypes.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {LPFeeLibrary} from "v4-core/src/libraries/LPFeeLibrary.sol";
import {Currency} from "v4-core/src/types/Currency.sol";
import {PoolId, PoolIdLibrary} from "v4-core/src/types/PoolId.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";

contract HookFlowPublicFactory {
    error HookAddressMismatch(address hook, uint160 expectedFlags);

    event HookDeployed(address indexed hook, address indexed owner, address indexed poolManager, bytes32 salt);

    function deploy(bytes32 salt, address owner, address poolManager) external returns (HookFlowHook hook) {
        hook = new HookFlowHook{salt: salt}(owner, poolManager);
        uint160 expectedFlags = Hooks.BEFORE_SWAP_FLAG | Hooks.AFTER_SWAP_FLAG;

        if (uint160(address(hook)) & Hooks.ALL_HOOK_MASK != expectedFlags) {
            revert HookAddressMismatch(address(hook), expectedFlags);
        }

        emit HookDeployed(address(hook), owner, poolManager, salt);
    }
}

contract DeployHookFlowPublicSelfServe is Script {
    using PoolIdLibrary for PoolKey;

    address internal constant X_LAYER_MAINNET_POOL_MANAGER = 0x360E68faCcca8cA495c1B759Fd9EEe466db9FB32;
    address internal constant USDT0 = 0x779Ded0c9e1022225f8E0630b35a9b54bE713736;
    address internal constant WOKB = 0xe538905cf8410324e03A5A23C1c177a474D59b2b;
    uint160 internal constant HOOK_FLAGS = Hooks.BEFORE_SWAP_FLAG | Hooks.AFTER_SWAP_FLAG;

    error TokensOutOfOrder(address token0, address token1);

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address poolManager = vm.envOr("POOL_MANAGER", X_LAYER_MAINNET_POOL_MANAGER);
        address owner = vm.envOr("HOOK_OWNER", vm.addr(deployerKey));
        address token0 = vm.envOr("TOKEN0", USDT0);
        address token1 = vm.envOr("TOKEN1", WOKB);
        int24 tickSpacing = int24(vm.envOr("TICK_SPACING", int256(60)));
        uint160 sqrtPriceX96 = uint160(vm.envOr("SQRT_PRICE_X96", uint256(8421858656182034097679017132552161)));
        uint256 saltStart = vm.envOr("SALT_START", uint256(0));
        HookFlowTypes.Preset preset = HookFlowTypes.Preset(vm.envOr("PUBLIC_PRESET", uint256(1)));

        if (token0 >= token1) revert TokensOutOfOrder(token0, token1);

        vm.startBroadcast(deployerKey);

        HookFlowPublicFactory factory = new HookFlowPublicFactory();
        bytes32 salt = mineSalt(address(factory), owner, poolManager, saltStart);
        HookFlowHook hook = factory.deploy(salt, owner, poolManager);
        HookFlowLiquidityRouter liquidityRouter = new HookFlowLiquidityRouter(IPoolManager(poolManager));

        PoolKey memory key = PoolKey({
            currency0: Currency.wrap(token0),
            currency1: Currency.wrap(token1),
            fee: LPFeeLibrary.DYNAMIC_FEE_FLAG,
            tickSpacing: tickSpacing,
            hooks: IHooks(address(hook))
        });
        PoolId poolId = key.toId();

        hook.applySafePreset(poolId, preset);
        IPoolManager(poolManager).initialize(key, sqrtPriceX96);

        vm.stopBroadcast();
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
}
