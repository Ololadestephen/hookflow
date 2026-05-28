// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

library HookFlowTypes {
    enum SizeBucket {
        Small,
        Medium,
        Large
    }

    enum Preset {
        StablePair,
        VolatilePair,
        LaunchPool,
        LongTailPool
    }

    struct PoolConfig {
        bool enabled;
        uint24 baseFeePips;
        uint24 maxFeePips;
        uint24 mediumSizePremiumPips;
        uint24 largeSizePremiumPips;
        uint24 elevatedToxicPremiumPips;
        uint24 defensiveToxicPremiumPips;
        uint128 mediumTradeSize;
        uint128 largeTradeSize;
        uint32 toxicScoreElevated;
        uint32 toxicScoreDefensive;
        uint32 cooldownSeconds;
        uint32 windowSeconds;
    }

    struct PoolFlowState {
        uint64 windowStart;
        uint64 defensiveUntil;
        uint128 buyVolume;
        uint128 sellVolume;
        uint32 sameDirectionCount;
        bool lastZeroForOne;
        uint32 lastToxicScore;
    }

    struct FeeQuote {
        uint24 feePips;
        SizeBucket sizeBucket;
        uint32 toxicScore;
        bool defensiveMode;
    }
}
