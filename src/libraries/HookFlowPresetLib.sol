// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {HookFlowTypes} from "../types/HookFlowTypes.sol";

library HookFlowPresetLib {
    function stablePair() internal pure returns (HookFlowTypes.PoolConfig memory) {
        return HookFlowTypes.PoolConfig({
            enabled: true,
            baseFeePips: 500,
            maxFeePips: 5_000,
            mediumSizePremiumPips: 250,
            largeSizePremiumPips: 1_000,
            elevatedToxicPremiumPips: 750,
            defensiveToxicPremiumPips: 2_000,
            mediumTradeSize: 100_000 ether,
            largeTradeSize: 500_000 ether,
            toxicScoreElevated: 65,
            toxicScoreDefensive: 85,
            cooldownSeconds: 180,
            windowSeconds: 600
        });
    }

    function volatilePair() internal pure returns (HookFlowTypes.PoolConfig memory) {
        return HookFlowTypes.PoolConfig({
            enabled: true,
            baseFeePips: 3_000,
            maxFeePips: 20_000,
            mediumSizePremiumPips: 1_000,
            largeSizePremiumPips: 4_000,
            elevatedToxicPremiumPips: 3_000,
            defensiveToxicPremiumPips: 10_000,
            mediumTradeSize: 100 ether,
            largeTradeSize: 500 ether,
            toxicScoreElevated: 55,
            toxicScoreDefensive: 80,
            cooldownSeconds: 300,
            windowSeconds: 900
        });
    }

    function launchPool() internal pure returns (HookFlowTypes.PoolConfig memory) {
        return HookFlowTypes.PoolConfig({
            enabled: true,
            baseFeePips: 5_000,
            maxFeePips: 50_000,
            mediumSizePremiumPips: 2_500,
            largeSizePremiumPips: 10_000,
            elevatedToxicPremiumPips: 7_500,
            defensiveToxicPremiumPips: 25_000,
            mediumTradeSize: 25 ether,
            largeTradeSize: 100 ether,
            toxicScoreElevated: 45,
            toxicScoreDefensive: 70,
            cooldownSeconds: 600,
            windowSeconds: 900
        });
    }

    function longTailPool() internal pure returns (HookFlowTypes.PoolConfig memory) {
        return HookFlowTypes.PoolConfig({
            enabled: true,
            baseFeePips: 10_000,
            maxFeePips: 75_000,
            mediumSizePremiumPips: 5_000,
            largeSizePremiumPips: 15_000,
            elevatedToxicPremiumPips: 10_000,
            defensiveToxicPremiumPips: 35_000,
            mediumTradeSize: 10 ether,
            largeTradeSize: 50 ether,
            toxicScoreElevated: 40,
            toxicScoreDefensive: 65,
            cooldownSeconds: 900,
            windowSeconds: 1_200
        });
    }
}

