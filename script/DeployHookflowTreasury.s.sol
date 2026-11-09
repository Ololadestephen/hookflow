// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script} from "forge-std/Script.sol";
import {HookflowTreasuryVault} from "../src/HookflowTreasuryVault.sol";

contract DeployHookflowTreasury is Script {
    function run() external returns (HookflowTreasuryVault vault) {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerKey);
        vault = new HookflowTreasuryVault();
        vm.stopBroadcast();
    }
}
