// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script} from "forge-std/Script.sol";
import {HookFlowLiquidityRouter} from "../src/HookFlowLiquidityRouter.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";

contract DeployHookFlowLiquidityRouter is Script {
    address internal constant X_LAYER_MAINNET_POOL_MANAGER = 0x360E68faCcca8cA495c1B759Fd9EEe466db9FB32;

    function run() external returns (HookFlowLiquidityRouter liquidityRouter) {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address poolManager = vm.envOr("POOL_MANAGER", X_LAYER_MAINNET_POOL_MANAGER);

        vm.startBroadcast(deployerKey);
        liquidityRouter = new HookFlowLiquidityRouter(IPoolManager(poolManager));
        vm.stopBroadcast();
    }
}
