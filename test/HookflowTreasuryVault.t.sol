// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {HookflowTreasuryVault} from "../src/HookflowTreasuryVault.sol";

contract RejectingRecipient {
    // Reverts on receiving native currency
    receive() external payable {
        revert("RejectingRecipient: rejected");
    }
}

contract ReentrantRecipient {
    HookflowTreasuryVault public vault;
    uint256 public vaultId;
    address payable public self;

    constructor(HookflowTreasuryVault _vault, uint256 _vaultId) {
        vault = _vault;
        vaultId = _vaultId;
        self = payable(address(this));
    }

    receive() external payable {
        // Attempt reentrancy
        if (address(vault).balance >= msg.value) {
            vault.payout(vaultId, self, msg.value);
        }
    }
}

contract HookflowTreasuryVaultTest is Test {
    HookflowTreasuryVault internal vault;

    address internal owner1 = address(0x1001);
    address internal owner2 = address(0x1002);
    address internal operator1 = address(0x2001);
    address internal operator2 = address(0x2002);
    address payable internal recipient1 = payable(address(0x3001));
    address payable internal recipient2 = payable(address(0x3002));
    address internal stranger = address(0x9999);

    HookflowTreasuryVault.VaultPolicy internal defaultPolicy;

    event VaultCreated(uint256 indexed vaultId, address indexed owner, uint256 initialDeposit, HookflowTreasuryVault.VaultPolicy policy);
    event Deposited(uint256 indexed vaultId, address indexed sender, uint256 amount, uint256 newBalance);
    event Withdrawn(uint256 indexed vaultId, address indexed owner, uint256 amount, uint256 newBalance);
    event PolicyUpdated(uint256 indexed vaultId, HookflowTreasuryVault.VaultPolicy policy);
    event OperatorUpdated(uint256 indexed vaultId, address indexed operator, bool approved);
    event RecipientUpdated(uint256 indexed vaultId, address indexed recipient, bool approved);
    event VaultPaused(uint256 indexed vaultId, bool paused);
    event PayoutExecuted(
        uint256 indexed vaultId,
        address indexed operator,
        address indexed recipient,
        uint256 amount,
        uint256 newBalance,
        uint256 dailySpent,
        uint16 burstCount,
        uint64 cooldownUntil
    );
    event CooldownTriggered(uint256 indexed vaultId, uint64 cooldownUntil);

    function setUp() public {
        vault = new HookflowTreasuryVault();

        defaultPolicy = HookflowTreasuryVault.VaultPolicy({
            maxPayoutAmount: 5 ether,
            dailyLimit: 10 ether,
            burstWindowSeconds: 300, // 5 minutes
            burstThresholdCount: 3,  // 3 payouts trigger cooldown
            cooldownSeconds: 600     // 10 minutes cooldown
        });

        // Fund accounts
        vm.deal(owner1, 100 ether);
        vm.deal(owner2, 100 ether);
        vm.deal(operator1, 10 ether);
        vm.deal(operator2, 10 ether);
        vm.deal(stranger, 10 ether);
    }

    // --- Helper ---
    function _createDefaultVault(address owner, uint256 depositAmount) internal returns (uint256) {
        vm.prank(owner);
        return vault.createVault{value: depositAmount}(defaultPolicy);
    }

    // --- Tests ---

    function testCreateVaultInitialState() public {
        vm.prank(owner1);
        uint256 vId = vault.createVault{value: 20 ether}(defaultPolicy);

        assertEq(vId, 1);
        assertEq(vault.vaultCount(), 1);

        (
            address vOwner,
            bool paused,
            uint64 currentDayIndex,
            uint64 burstWindowStart,
            uint64 cooldownUntil,
            uint16 burstCount,
            uint256 balance,
            uint256 totalDeposited,
            uint256 totalPaidOut,
            uint256 totalWithdrawn,
            uint256 dailySpentAmount
        ) = vault.vaults(vId);

        assertEq(vOwner, owner1);
        assertFalse(paused);
        assertEq(currentDayIndex, uint64(block.timestamp / 86400));
        assertEq(burstWindowStart, 0);
        assertEq(cooldownUntil, 0);
        assertEq(burstCount, 0);
        assertEq(balance, 20 ether);
        assertEq(totalDeposited, 20 ether);
        assertEq(totalPaidOut, 0);
        assertEq(totalWithdrawn, 0);
        assertEq(dailySpentAmount, 0);
    }

    function testDepositIncreasesBalance() public {
        uint256 vId = _createDefaultVault(owner1, 10 ether);

        vm.prank(stranger);
        vault.deposit{value: 5 ether}(vId);

        (, , , , , , uint256 balance, uint256 totalDeposited, , , ) = vault.vaults(vId);
        assertEq(balance, 15 ether);
        assertEq(totalDeposited, 15 ether);
    }

    function testOwnerCanWithdraw() public {
        uint256 vId = _createDefaultVault(owner1, 20 ether);

        uint256 ownerInitialBal = owner1.balance;
        vm.prank(owner1);
        vault.withdraw(vId, 8 ether);

        (, , , , , , uint256 balance, , , uint256 totalWithdrawn, ) = vault.vaults(vId);
        assertEq(balance, 12 ether);
        assertEq(totalWithdrawn, 8 ether);
        assertEq(owner1.balance, ownerInitialBal + 8 ether);
    }

    function testNonOwnerCannotWithdraw() public {
        uint256 vId = _createDefaultVault(owner1, 20 ether);

        vm.prank(stranger);
        vm.expectRevert(abi.encodeWithSelector(HookflowTreasuryVault.NotVaultOwner.selector, vId, stranger));
        vault.withdraw(vId, 5 ether);
    }

    function testWithdrawCannotExceedBalance() public {
        uint256 vId = _createDefaultVault(owner1, 5 ether);

        vm.prank(owner1);
        vm.expectRevert(abi.encodeWithSelector(HookflowTreasuryVault.InsufficientVaultBalance.selector, 6 ether, 5 ether));
        vault.withdraw(vId, 6 ether);
    }

    function testMultiVaultIsolation() public {
        uint256 vId1 = _createDefaultVault(owner1, 10 ether);
        uint256 vId2 = _createDefaultVault(owner2, 30 ether);

        // Approve operator1 and recipient1 on Vault 1
        vm.startPrank(owner1);
        vault.setOperator(vId1, operator1, true);
        vault.setRecipient(vId1, recipient1, true);
        vm.stopPrank();

        // Payout from Vault 1
        vm.prank(operator1);
        vault.payout(vId1, recipient1, 4 ether);

        (, , , , , , uint256 balance1, , uint256 paidOut1, , ) = vault.vaults(vId1);
        (, , , , , , uint256 balance2, , uint256 paidOut2, , ) = vault.vaults(vId2);

        assertEq(balance1, 6 ether);
        assertEq(paidOut1, 4 ether);
        assertEq(balance2, 30 ether); // Vault 2 balance completely untouched
        assertEq(paidOut2, 0);

        // Vault 1 cannot spend more than its remaining balance even though contract has 36 ether total
        // Vault 1 deposit was 10 ether. Payout 1 was 4 ether (balance = 6 ether, spent = 4 ether, daily remaining = 6 ether).
        // Advance time to next UTC day so daily limit is full (10 ether), but balance remains 6 ether.
        vm.warp(block.timestamp + 1 days + 1);

        // Withdraw 5 ether to owner so balance is down to 1 ether
        vm.prank(owner1);
        vault.withdraw(vId1, 5 ether);

        // Now attempt payout of 2 ether (daily remaining = 10 ether, maxPayout = 5 ether, but balance is only 1 ether)
        vm.prank(operator1);
        vm.expectRevert(abi.encodeWithSelector(HookflowTreasuryVault.InsufficientVaultBalance.selector, 2 ether, 1 ether));
        vault.payout(vId1, recipient1, 2 ether);

        // Owner 1 cannot withdraw Vault 2 funds
        vm.prank(owner1);
        vm.expectRevert(abi.encodeWithSelector(HookflowTreasuryVault.NotVaultOwner.selector, vId2, owner1));
        vault.withdraw(vId2, 10 ether);
    }

    function testOperatorAndRecipientAuthorization() public {
        uint256 vId = _createDefaultVault(owner1, 20 ether);

        // Attempt payout before operator is approved
        vm.prank(operator1);
        vm.expectRevert(abi.encodeWithSelector(HookflowTreasuryVault.NotVaultOperator.selector, vId, operator1));
        vault.payout(vId, recipient1, 1 ether);

        // Approve operator, but recipient not yet approved
        vm.prank(owner1);
        vault.setOperator(vId, operator1, true);

        vm.prank(operator1);
        vm.expectRevert(abi.encodeWithSelector(HookflowTreasuryVault.RecipientNotApproved.selector, vId, address(recipient1)));
        vault.payout(vId, recipient1, 1 ether);

        // Approve recipient
        vm.prank(owner1);
        vault.setRecipient(vId, recipient1, true);

        // Now payout succeeds
        vm.prank(operator1);
        vault.payout(vId, recipient1, 1 ether);
        assertEq(recipient1.balance, 1 ether);

        // Revoke operator
        vm.prank(owner1);
        vault.setOperator(vId, operator1, false);

        vm.prank(operator1);
        vm.expectRevert(abi.encodeWithSelector(HookflowTreasuryVault.NotVaultOperator.selector, vId, operator1));
        vault.payout(vId, recipient1, 1 ether);
    }

    function testMaxPayoutLimit() public {
        uint256 vId = _createDefaultVault(owner1, 20 ether);

        vm.startPrank(owner1);
        vault.setOperator(vId, operator1, true);
        vault.setRecipient(vId, recipient1, true);
        vm.stopPrank();

        // defaultPolicy maxPayoutAmount is 5 ether. Attempt 5.1 ether
        vm.prank(operator1);
        vm.expectRevert(abi.encodeWithSelector(HookflowTreasuryVault.ExceedsMaxPayout.selector, 5.1 ether, 5 ether));
        vault.payout(vId, recipient1, 5.1 ether);

        // 5.0 ether is allowed
        vm.prank(operator1);
        vault.payout(vId, recipient1, 5 ether);
        assertEq(recipient1.balance, 5 ether);
    }

    function testSharedDailyLimitAcrossMultipleOperators() public {
        uint256 vId = _createDefaultVault(owner1, 30 ether);

        // Approve two operators and recipient
        vm.startPrank(owner1);
        vault.setOperator(vId, operator1, true);
        vault.setOperator(vId, operator2, true);
        vault.setRecipient(vId, recipient1, true);
        vm.stopPrank();

        // Operator 1 spends 4 ether (dailyLimit = 10 ether)
        vm.prank(operator1);
        vault.payout(vId, recipient1, 4 ether);

        // Operator 2 spends 4 ether (total spent = 8 ether, remaining = 2 ether)
        vm.prank(operator2);
        vault.payout(vId, recipient1, 4 ether);

        // Operator 1 tries to spend 3 ether -> exceeds remaining 2 ether!
        vm.prank(operator1);
        vm.expectRevert(abi.encodeWithSelector(HookflowTreasuryVault.ExceedsDailyLimit.selector, 3 ether, 2 ether));
        vault.payout(vId, recipient1, 3 ether);

        // Operator 2 spends exactly remaining 2 ether -> succeeds (total spent = 10 ether)
        // Note: 3rd payout triggered cooldown (burstThresholdCount = 3).
        vm.prank(operator2);
        vault.payout(vId, recipient1, 2 ether);

        // Advance time past cooldown (601 seconds) but remaining within the same UTC day
        vm.warp(block.timestamp + 601);

        // Next payout on same day fails even for 1 wei because daily limit is exhausted
        vm.prank(operator1);
        vm.expectRevert(abi.encodeWithSelector(HookflowTreasuryVault.ExceedsDailyLimit.selector, 1, 0));
        vault.payout(vId, recipient1, 1);

        // Advance time to next UTC calendar day (jump 1 day)
        vm.warp(block.timestamp + 1 days + 1);

        // Next day: full 10 ether daily limit is refreshed!
        vm.prank(operator1);
        vault.payout(vId, recipient1, 5 ether);
        assertEq(recipient1.balance, 15 ether);
    }

    function testBurstThresholdTriggersCooldown() public {
        uint256 vId = _createDefaultVault(owner1, 30 ether);

        vm.startPrank(owner1);
        vault.setOperator(vId, operator1, true);
        vault.setRecipient(vId, recipient1, true);
        vm.stopPrank();

        // burstThresholdCount = 3, burstWindowSeconds = 300, cooldownSeconds = 600
        // Payout 1 at t = 1000
        vm.warp(1000);
        vm.prank(operator1);
        vault.payout(vId, recipient1, 1 ether);

        // Payout 2 at t = 1050
        vm.warp(1050);
        vm.prank(operator1);
        vault.payout(vId, recipient1, 1 ether);

        // Payout 3 at t = 1100 -> reaches threshold of 3!
        vm.warp(1100);
        vm.prank(operator1);
        vault.payout(vId, recipient1, 1 ether);

        // Cooldown is now active until 1100 + 600 = 1700
        (, , , , uint64 cooldownUntil, , , , , , ) = vault.vaults(vId);
        assertEq(cooldownUntil, 1700);

        // Payout 4 at t = 1150 reverts due to CooldownActive
        vm.warp(1150);
        vm.prank(operator1);
        vm.expectRevert(abi.encodeWithSelector(HookflowTreasuryVault.CooldownActive.selector, vId, 1700));
        vault.payout(vId, recipient1, 1 ether);

        // Payout at t = 1699 still reverts
        vm.warp(1699);
        vm.prank(operator1);
        vm.expectRevert(abi.encodeWithSelector(HookflowTreasuryVault.CooldownActive.selector, vId, 1700));
        vault.payout(vId, recipient1, 1 ether);

        // At t = 1700: Cooldown expired!
        vm.warp(1700);
        vm.prank(operator1);
        vault.payout(vId, recipient1, 1 ether);
        assertEq(recipient1.balance, 4 ether);
    }

    function testBurstWindowResetsIfThresholdNotReached() public {
        uint256 vId = _createDefaultVault(owner1, 30 ether);

        vm.startPrank(owner1);
        vault.setOperator(vId, operator1, true);
        vault.setRecipient(vId, recipient1, true);
        vm.stopPrank();

        // Payout 1 at t = 1000 (burstCount = 1)
        vm.warp(1000);
        vm.prank(operator1);
        vault.payout(vId, recipient1, 1 ether);

        // Payout 2 at t = 1050 (burstCount = 2)
        vm.warp(1050);
        vm.prank(operator1);
        vault.payout(vId, recipient1, 1 ether);

        // Next payout occurs AFTER window expires: t = 1000 + 300 = 1300.
        // Let's jump to t = 1350. The previous window expired without hitting 3.
        vm.warp(1350);
        vm.prank(operator1);
        vault.payout(vId, recipient1, 1 ether);

        // Burst count resets to 1, window starts at 1350, no cooldown triggered!
        (, , , uint64 burstWindowStart, uint64 cooldownUntil, uint16 burstCount, , , , , ) = vault.vaults(vId);
        assertEq(burstWindowStart, 1350);
        assertEq(burstCount, 1);
        assertEq(cooldownUntil, 0);
    }

    function testPolicyUpdatePreservesDailySpentAndCooldown() public {
        uint256 vId = _createDefaultVault(owner1, 30 ether);

        vm.startPrank(owner1);
        vault.setOperator(vId, operator1, true);
        vault.setRecipient(vId, recipient1, true);
        vm.stopPrank();

        // Operator spends 4 ether today
        vm.prank(operator1);
        vault.payout(vId, recipient1, 4 ether);

        // Owner updates policy with lower daily limit of 5 ether
        HookflowTreasuryVault.VaultPolicy memory newPolicy = HookflowTreasuryVault.VaultPolicy({
            maxPayoutAmount: 2 ether,
            dailyLimit: 5 ether,
            burstWindowSeconds: 200,
            burstThresholdCount: 2,
            cooldownSeconds: 400
        });

        vm.prank(owner1);
        vault.setPolicy(vId, newPolicy);

        // The daily spent amount (4 ether) is preserved! Remaining allowance is now 5 - 4 = 1 ether.
        (, uint256 remainingAllowance, uint256 dailySpent, , , , , , ) = vault.getPayoutStatus(vId);
        assertEq(dailySpent, 4 ether);
        assertEq(remainingAllowance, 1 ether);

        // Trying to spend 1.5 ether fails
        vm.prank(operator1);
        vm.expectRevert(abi.encodeWithSelector(HookflowTreasuryVault.ExceedsDailyLimit.selector, 1.5 ether, 1 ether));
        vault.payout(vId, recipient1, 1.5 ether);

        // Spending exactly 1 ether succeeds
        vm.prank(operator1);
        vault.payout(vId, recipient1, 1 ether);
    }

    function testPauseBlocksPayoutsImmediately() public {
        uint256 vId = _createDefaultVault(owner1, 20 ether);

        vm.startPrank(owner1);
        vault.setOperator(vId, operator1, true);
        vault.setRecipient(vId, recipient1, true);
        vault.setPaused(vId, true);
        vm.stopPrank();

        // Payout should revert with VaultIsPaused
        vm.prank(operator1);
        vm.expectRevert(abi.encodeWithSelector(HookflowTreasuryVault.VaultIsPaused.selector, vId));
        vault.payout(vId, recipient1, 1 ether);

        // Owner withdrawal is still allowed while paused
        vm.prank(owner1);
        vault.withdraw(vId, 5 ether);

        // Unpause restores payouts
        vm.prank(owner1);
        vault.setPaused(vId, false);

        vm.prank(operator1);
        vault.payout(vId, recipient1, 1 ether);
        assertEq(recipient1.balance, 1 ether);
    }

    function testRevertOnFailedTransfer() public {
        uint256 vId = _createDefaultVault(owner1, 20 ether);

        RejectingRecipient rejector = new RejectingRecipient();
        address payable rejectingAddr = payable(address(rejector));

        vm.startPrank(owner1);
        vault.setOperator(vId, operator1, true);
        vault.setRecipient(vId, rejectingAddr, true);
        vm.stopPrank();

        // Payout to rejecting recipient fails with TransferFailed
        vm.prank(operator1);
        vm.expectRevert(HookflowTreasuryVault.TransferFailed.selector);
        vault.payout(vId, rejectingAddr, 2 ether);

        // Invariant: Balance, daily spent, and burst count were not modified
        (, , , , , uint16 burstCount, uint256 balance, , uint256 paidOut, , uint256 dailySpent) = vault.vaults(vId);
        assertEq(balance, 20 ether);
        assertEq(paidOut, 0);
        assertEq(dailySpent, 0);
        assertEq(burstCount, 0);
    }

    function testReentrancyPrevention() public {
        uint256 vId = _createDefaultVault(owner1, 20 ether);

        ReentrantRecipient attacker = new ReentrantRecipient(vault, vId);
        address payable attackerAddr = payable(address(attacker));

        vm.startPrank(owner1);
        vault.setOperator(vId, operator1, true);
        vault.setRecipient(vId, attackerAddr, true);
        vm.stopPrank();

        // When vault transfers native tokens to attacker, attacker attempts to call payout again.
        // The reentrancy guard will trigger ReentrancyGuardReentrantCall inside the inner call,
        // causing TransferFailed in the outer call.
        vm.prank(operator1);
        vm.expectRevert(HookflowTreasuryVault.TransferFailed.selector);
        vault.payout(vId, attackerAddr, 1 ether);

        // Vault funds remain safe
        (, , , , , , uint256 balance, , , , ) = vault.vaults(vId);
        assertEq(balance, 20 ether);
    }

    function testDirectDepositReverts() public {
        vm.prank(stranger);
        (bool success, ) = address(vault).call{value: 1 ether}("");
        assertFalse(success);
    }

    function testZeroAmountAndZeroAddressReverts() public {
        uint256 vId = _createDefaultVault(owner1, 10 ether);

        vm.startPrank(owner1);
        // Zero amount deposit
        vm.expectRevert(HookflowTreasuryVault.ZeroAmount.selector);
        vault.deposit{value: 0}(vId);

        // Zero amount withdraw
        vm.expectRevert(HookflowTreasuryVault.ZeroAmount.selector);
        vault.withdraw(vId, 0);

        // Zero address operator
        vm.expectRevert(HookflowTreasuryVault.ZeroAddress.selector);
        vault.setOperator(vId, address(0), true);

        // Zero address recipient
        vm.expectRevert(HookflowTreasuryVault.ZeroAddress.selector);
        vault.setRecipient(vId, address(0), true);
        vm.stopPrank();

        // Zero address or zero amount payout
        vm.prank(owner1);
        vault.setOperator(vId, operator1, true);

        vm.startPrank(operator1);
        vm.expectRevert(HookflowTreasuryVault.ZeroAddress.selector);
        vault.payout(vId, payable(address(0)), 1 ether);

        vm.expectRevert(HookflowTreasuryVault.ZeroAmount.selector);
        vault.payout(vId, recipient1, 0);
        vm.stopPrank();
    }

    function testInvalidPolicyReverts() public {
        HookflowTreasuryVault.VaultPolicy memory badPolicy = HookflowTreasuryVault.VaultPolicy({
            maxPayoutAmount: 10 ether,
            dailyLimit: 5 ether, // invalid: dailyLimit < maxPayoutAmount
            burstWindowSeconds: 300,
            burstThresholdCount: 3,
            cooldownSeconds: 600
        });

        vm.prank(owner1);
        vm.expectRevert(HookflowTreasuryVault.InvalidPolicy.selector);
        vault.createVault{value: 1 ether}(badPolicy);
    }

    function testOperatorRotationPreservesDailySpent() public {
        HookflowTreasuryVault.VaultPolicy memory policy = HookflowTreasuryVault.VaultPolicy({
            maxPayoutAmount: 8 ether,
            dailyLimit: 10 ether,
            burstWindowSeconds: 300,
            burstThresholdCount: 3,
            cooldownSeconds: 600
        });

        vm.prank(owner1);
        uint256 vId = vault.createVault{value: 30 ether}(policy);

        vm.startPrank(owner1);
        vault.setOperator(vId, operator1, true);
        vault.setRecipient(vId, recipient1, true);
        vm.stopPrank();

        // Operator 1 spends 7 ether out of 10 ether dailyLimit (remaining daily = 3 ether)
        vm.prank(operator1);
        vault.payout(vId, recipient1, 7 ether);

        // Owner revokes Operator 1 and approves Operator 2
        vm.startPrank(owner1);
        vault.setOperator(vId, operator1, false);
        vault.setOperator(vId, operator2, true);
        vm.stopPrank();

        // Operator 2 attempts to spend 4 ether (<= maxPayout 8 ether, but 7 + 4 = 11 > 10 ether daily limit)
        // Must revert with ExceedsDailyLimit(4 ether, 3 ether)!
        vm.prank(operator2);
        vm.expectRevert(abi.encodeWithSelector(HookflowTreasuryVault.ExceedsDailyLimit.selector, 4 ether, 3 ether));
        vault.payout(vId, recipient1, 4 ether);

        // Operator 2 spends 3 ether (exactly reaching the 10 ether dailyLimit) -> succeeds!
        vm.prank(operator2);
        vault.payout(vId, recipient1, 3 ether);
        assertEq(recipient1.balance, 10 ether);
    }
}
