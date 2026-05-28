// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {HookFlowTypes} from "../types/HookFlowTypes.sol";
import {BalanceDelta, BalanceDeltaLibrary} from "v4-core/src/types/BalanceDelta.sol";
import {LPFeeLibrary} from "v4-core/src/libraries/LPFeeLibrary.sol";

library HookFlowFeeLogic {
    using BalanceDeltaLibrary for BalanceDelta;

    uint24 internal constant MAX_LP_FEE_PIPS = LPFeeLibrary.MAX_LP_FEE;

    function sizeBucket(HookFlowTypes.PoolConfig memory config, uint256 absoluteAmount)
        internal
        pure
        returns (HookFlowTypes.SizeBucket bucket, uint24 premiumPips)
    {
        if (absoluteAmount >= config.largeTradeSize) {
            return (HookFlowTypes.SizeBucket.Large, config.largeSizePremiumPips);
        }

        if (absoluteAmount >= config.mediumTradeSize) {
            return (HookFlowTypes.SizeBucket.Medium, config.mediumSizePremiumPips);
        }

        return (HookFlowTypes.SizeBucket.Small, 0);
    }

    function toxicityPremium(
        HookFlowTypes.PoolConfig memory config,
        HookFlowTypes.PoolFlowState memory state,
        uint32 toxicScore,
        uint64 timestamp
    ) internal pure returns (uint24 premiumPips, bool defensiveMode) {
        defensiveMode = timestamp < state.defensiveUntil || toxicScore >= config.toxicScoreDefensive;

        if (defensiveMode) {
            return (config.defensiveToxicPremiumPips, true);
        }

        if (toxicScore >= config.toxicScoreElevated) {
            return (config.elevatedToxicPremiumPips, false);
        }

        return (0, false);
    }

    function quoteFee(
        HookFlowTypes.PoolConfig memory config,
        HookFlowTypes.PoolFlowState memory state,
        bool zeroForOne,
        uint256 absoluteAmount,
        uint64 timestamp
    ) internal pure returns (HookFlowTypes.FeeQuote memory quote) {
        (HookFlowTypes.SizeBucket bucket, uint24 sizePremiumPips) = sizeBucket(config, absoluteAmount);
        uint32 toxicScore = previewToxicScore(config, state, zeroForOne, absoluteAmount, timestamp);
        (uint24 toxicPremiumPips, bool defensiveMode) = toxicityPremium(config, state, toxicScore, timestamp);

        uint256 feePips = uint256(config.baseFeePips) + sizePremiumPips + toxicPremiumPips;
        if (feePips > config.maxFeePips) feePips = config.maxFeePips;
        if (feePips > MAX_LP_FEE_PIPS) feePips = MAX_LP_FEE_PIPS;

        return HookFlowTypes.FeeQuote({
            feePips: uint24(feePips), sizeBucket: bucket, toxicScore: toxicScore, defensiveMode: defensiveMode
        });
    }

    function previewToxicScore(
        HookFlowTypes.PoolConfig memory config,
        HookFlowTypes.PoolFlowState memory state,
        bool zeroForOne,
        uint256 absoluteAmount,
        uint64 timestamp
    ) internal pure returns (uint32) {
        if (state.windowStart == 0 || timestamp >= state.windowStart + config.windowSeconds) {
            return 10;
        }

        uint256 buyVolume = state.buyVolume;
        uint256 sellVolume = state.sellVolume;

        if (zeroForOne) sellVolume += absoluteAmount;
        else buyVolume += absoluteAmount;

        uint256 totalVolume = buyVolume + sellVolume;
        uint256 imbalanceScore = totalVolume == 0 ? 0 : absDiff(buyVolume, sellVolume) * 30 / totalVolume;

        uint256 streak = state.lastZeroForOne == zeroForOne ? state.sameDirectionCount + 1 : 1;
        uint256 streakScore = streak > 8 ? 60 : streak * 7;
        uint256 score = 10 + imbalanceScore + streakScore;

        return uint32(score > 100 ? 100 : score);
    }

    function nextState(
        HookFlowTypes.PoolConfig memory config,
        HookFlowTypes.PoolFlowState memory state,
        bool zeroForOne,
        uint256 absoluteAmount,
        uint64 timestamp
    ) internal pure returns (HookFlowTypes.PoolFlowState memory next) {
        next = state;

        if (next.windowStart == 0 || timestamp >= next.windowStart + config.windowSeconds) {
            next.windowStart = timestamp;
            next.buyVolume = 0;
            next.sellVolume = 0;
            next.sameDirectionCount = 0;
        }

        if (zeroForOne) next.sellVolume += uint128(absoluteAmount);
        else next.buyVolume += uint128(absoluteAmount);

        next.sameDirectionCount = next.lastZeroForOne == zeroForOne ? next.sameDirectionCount + 1 : 1;
        next.lastZeroForOne = zeroForOne;
        next.lastToxicScore = previewToxicScore(config, state, zeroForOne, absoluteAmount, timestamp);

        if (next.lastToxicScore >= config.toxicScoreDefensive) {
            next.defensiveUntil = timestamp + config.cooldownSeconds;
        }
    }

    function withOverrideFlag(uint24 feePips) internal pure returns (uint24) {
        return feePips | LPFeeLibrary.OVERRIDE_FEE_FLAG;
    }

    function absoluteSpecifiedAmount(int256 amountSpecified) internal pure returns (uint256) {
        return amountSpecified < 0 ? uint256(-amountSpecified) : uint256(amountSpecified);
    }

    function executedAbsoluteAmount(bool zeroForOne, BalanceDelta delta) internal pure returns (uint256) {
        int128 signedAmount = zeroForOne ? delta.amount0() : delta.amount1();
        int256 amount = int256(signedAmount);
        return amount < 0 ? uint256(-amount) : uint256(amount);
    }

    function absDiff(uint256 a, uint256 b) private pure returns (uint256) {
        return a > b ? a - b : b - a;
    }
}
