// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/**
 * @title HookflowTreasuryVault
 * @notice Multi-vault native BOT treasury payout guard.
 * Provides isolated balances, owner-governed operator/recipient allowlists,
 * shared daily limits across operators, burst monitoring, and automatic cooldowns.
 */
contract HookflowTreasuryVault {
    struct VaultPolicy {
        uint256 maxPayoutAmount;
        uint256 dailyLimit;
        uint32 burstWindowSeconds;
        uint16 burstThresholdCount;
        uint32 cooldownSeconds;
    }

    struct Vault {
        address owner;
        bool paused;
        uint64 currentDayIndex;
        uint64 burstWindowStart;
        uint64 cooldownUntil;
        uint16 burstCount;
        uint256 balance;
        uint256 totalDeposited;
        uint256 totalPaidOut;
        uint256 totalWithdrawn;
        uint256 dailySpentAmount;
    }

    // Reentrancy guard state
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _reentrancyStatus;

    uint256 public vaultCount;

    mapping(uint256 => Vault) public vaults;
    mapping(uint256 => VaultPolicy) public vaultPolicies;
    mapping(uint256 => mapping(address => bool)) public isOperator;
    mapping(uint256 => mapping(address => bool)) public isRecipient;

    // Events
    event VaultCreated(uint256 indexed vaultId, address indexed owner, uint256 initialDeposit, VaultPolicy policy);
    event Deposited(uint256 indexed vaultId, address indexed sender, uint256 amount, uint256 newBalance);
    event Withdrawn(uint256 indexed vaultId, address indexed owner, uint256 amount, uint256 newBalance);
    event PolicyUpdated(uint256 indexed vaultId, VaultPolicy policy);
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

    // Custom Errors
    error ZeroAddress();
    error ZeroAmount();
    error VaultDoesNotExist(uint256 vaultId);
    error NotVaultOwner(uint256 vaultId, address caller);
    error NotVaultOperator(uint256 vaultId, address caller);
    error RecipientNotApproved(uint256 vaultId, address recipient);
    error VaultIsPaused(uint256 vaultId);
    error CooldownActive(uint256 vaultId, uint64 cooldownUntil);
    error ExceedsMaxPayout(uint256 requested, uint256 maxPayout);
    error ExceedsDailyLimit(uint256 requested, uint256 remainingDailyAllowance);
    error InsufficientVaultBalance(uint256 requested, uint256 available);
    error InvalidPolicy();
    error TransferFailed();
    error ReentrancyGuardReentrantCall();
    error DirectDepositNotAllowed();

    modifier nonReentrant() {
        if (_reentrancyStatus == _ENTERED) revert ReentrancyGuardReentrantCall();
        _reentrancyStatus = _ENTERED;
        _;
        _reentrancyStatus = _NOT_ENTERED;
    }

    modifier onlyVaultOwner(uint256 vaultId) {
        if (vaultId == 0 || vaultId > vaultCount) revert VaultDoesNotExist(vaultId);
        if (msg.sender != vaults[vaultId].owner) revert NotVaultOwner(vaultId, msg.sender);
        _;
    }

    constructor() {
        _reentrancyStatus = _NOT_ENTERED;
    }

    /**
     * @notice Prevents accidental uncredited native currency transfers.
     */
    receive() external payable {
        revert DirectDepositNotAllowed();
    }

    fallback() external payable {
        revert DirectDepositNotAllowed();
    }

    /**
     * @notice Creates a new treasury vault with an initial policy and optional initial deposit.
     * @param initialPolicy The operational spending and cooldown limits for the vault.
     * @return vaultId The unique identifier of the newly created vault.
     */
    function createVault(VaultPolicy calldata initialPolicy) external payable returns (uint256 vaultId) {
        _validatePolicy(initialPolicy);

        vaultCount += 1;
        vaultId = vaultCount;

        Vault storage vault = vaults[vaultId];
        vault.owner = msg.sender;
        vault.balance = msg.value;
        vault.totalDeposited = msg.value;
        vault.currentDayIndex = uint64(block.timestamp / 86400);

        vaultPolicies[vaultId] = initialPolicy;

        emit VaultCreated(vaultId, msg.sender, msg.value, initialPolicy);
        if (msg.value > 0) {
            emit Deposited(vaultId, msg.sender, msg.value, msg.value);
        }
    }

    /**
     * @notice Deposit native BOT into an existing vault. Anyone can fund a vault.
     * @param vaultId The vault identifier.
     */
    function deposit(uint256 vaultId) external payable {
        if (vaultId == 0 || vaultId > vaultCount) revert VaultDoesNotExist(vaultId);
        if (msg.value == 0) revert ZeroAmount();

        Vault storage vault = vaults[vaultId];
        vault.balance += msg.value;
        vault.totalDeposited += msg.value;

        emit Deposited(vaultId, msg.sender, msg.value, vault.balance);
    }

    /**
     * @notice Allows the vault owner to withdraw available funds.
     * @param vaultId The vault identifier.
     * @param amount The amount in wei to withdraw.
     */
    function withdraw(uint256 vaultId, uint256 amount) external onlyVaultOwner(vaultId) nonReentrant {
        if (amount == 0) revert ZeroAmount();

        Vault storage vault = vaults[vaultId];
        if (amount > vault.balance) revert InsufficientVaultBalance(amount, vault.balance);

        vault.balance -= amount;
        vault.totalWithdrawn += amount;

        emit Withdrawn(vaultId, msg.sender, amount, vault.balance);

        (bool success, ) = msg.sender.call{value: amount}("");
        if (!success) revert TransferFailed();
    }

    /**
     * @notice Updates the spending policy for a vault. Does not reset current daily spent or active cooldown.
     * @param vaultId The vault identifier.
     * @param newPolicy The updated policy parameters.
     */
    function setPolicy(uint256 vaultId, VaultPolicy calldata newPolicy) external onlyVaultOwner(vaultId) {
        _validatePolicy(newPolicy);
        vaultPolicies[vaultId] = newPolicy;
        emit PolicyUpdated(vaultId, newPolicy);
    }

    /**
     * @notice Adds or removes an approved operator for a vault.
     * @param vaultId The vault identifier.
     * @param operator The operator address.
     * @param approved True to approve, false to revoke.
     */
    function setOperator(uint256 vaultId, address operator, bool approved) external onlyVaultOwner(vaultId) {
        if (operator == address(0)) revert ZeroAddress();
        isOperator[vaultId][operator] = approved;
        emit OperatorUpdated(vaultId, operator, approved);
    }

    /**
     * @notice Adds or removes an approved payout recipient for a vault.
     * @param vaultId The vault identifier.
     * @param recipient The recipient address.
     * @param approved True to approve, false to revoke.
     */
    function setRecipient(uint256 vaultId, address recipient, bool approved) external onlyVaultOwner(vaultId) {
        if (recipient == address(0)) revert ZeroAddress();
        isRecipient[vaultId][recipient] = approved;
        emit RecipientUpdated(vaultId, recipient, approved);
    }

    /**
     * @notice Pauses or unpauses delegated payouts for a vault.
     * @param vaultId The vault identifier.
     * @param paused True to pause, false to resume.
     */
    function setPaused(uint256 vaultId, bool paused) external onlyVaultOwner(vaultId) {
        vaults[vaultId].paused = paused;
        emit VaultPaused(vaultId, paused);
    }

    /**
     * @notice Executes a guarded payout to an allowlisted recipient by an approved operator.
     * Enforces single payout limit, shared daily limit, burst rate, and cooldown.
     * @param vaultId The vault identifier.
     * @param recipient The allowlisted destination address.
     * @param amount The native BOT amount in wei.
     */
    function payout(
        uint256 vaultId,
        address payable recipient,
        uint256 amount
    ) external nonReentrant {
        if (vaultId == 0 || vaultId > vaultCount) revert VaultDoesNotExist(vaultId);
        if (recipient == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        if (!isOperator[vaultId][msg.sender]) revert NotVaultOperator(vaultId, msg.sender);
        if (!isRecipient[vaultId][recipient]) revert RecipientNotApproved(vaultId, recipient);

        Vault storage vault = vaults[vaultId];
        if (vault.paused) revert VaultIsPaused(vaultId);

        if (block.timestamp < vault.cooldownUntil) {
            revert CooldownActive(vaultId, vault.cooldownUntil);
        }

        VaultPolicy memory policy = vaultPolicies[vaultId];

        if (amount > policy.maxPayoutAmount) {
            revert ExceedsMaxPayout(amount, policy.maxPayoutAmount);
        }

        uint64 today = uint64(block.timestamp / 86400);
        uint256 spentToday = vault.currentDayIndex == today ? vault.dailySpentAmount : 0;

        if (spentToday >= policy.dailyLimit || amount > policy.dailyLimit - spentToday) {
            uint256 remainingAllowance = policy.dailyLimit > spentToday ? policy.dailyLimit - spentToday : 0;
            revert ExceedsDailyLimit(amount, remainingAllowance);
        }

        if (amount > vault.balance) {
            revert InsufficientVaultBalance(amount, vault.balance);
        }

        // Checks passed -> Effects
        vault.balance -= amount;
        vault.totalPaidOut += amount;

        if (vault.currentDayIndex != today) {
            vault.currentDayIndex = today;
            vault.dailySpentAmount = amount;
        } else {
            vault.dailySpentAmount += amount;
        }

        // Burst & Cooldown tracking
        if (vault.burstWindowStart == 0 || block.timestamp >= vault.burstWindowStart + policy.burstWindowSeconds) {
            vault.burstWindowStart = uint64(block.timestamp);
            vault.burstCount = 1;
        } else {
            vault.burstCount += 1;
        }

        uint64 triggeredCooldownUntil = 0;
        if (policy.burstThresholdCount > 0 && vault.burstCount >= policy.burstThresholdCount) {
            triggeredCooldownUntil = uint64(block.timestamp + policy.cooldownSeconds);
            vault.cooldownUntil = triggeredCooldownUntil;
            vault.burstCount = 0;
            vault.burstWindowStart = 0;
            emit CooldownTriggered(vaultId, triggeredCooldownUntil);
        }

        emit PayoutExecuted(
            vaultId,
            msg.sender,
            recipient,
            amount,
            vault.balance,
            vault.dailySpentAmount,
            vault.burstCount,
            vault.cooldownUntil
        );

        // Interaction
        (bool success, ) = recipient.call{value: amount}("");
        if (!success) revert TransferFailed();
    }

    /**
     * @notice Returns comprehensive status of daily allowance, cooldown, and burst activity.
     */
    function getPayoutStatus(uint256 vaultId)
        external
        view
        returns (
            uint256 balance,
            uint256 remainingDailyAllowance,
            uint256 dailySpent,
            uint64 currentDay,
            bool isCooldownActive,
            uint64 cooldownUntil,
            uint16 currentBurstCount,
            uint64 burstWindowStart,
            bool paused
        )
    {
        if (vaultId == 0 || vaultId > vaultCount) revert VaultDoesNotExist(vaultId);

        Vault storage vault = vaults[vaultId];
        VaultPolicy memory policy = vaultPolicies[vaultId];

        uint64 today = uint64(block.timestamp / 86400);
        dailySpent = vault.currentDayIndex == today ? vault.dailySpentAmount : 0;
        remainingDailyAllowance = policy.dailyLimit > dailySpent ? policy.dailyLimit - dailySpent : 0;
        currentDay = today;
        isCooldownActive = block.timestamp < vault.cooldownUntil;
        cooldownUntil = vault.cooldownUntil;
        currentBurstCount = (vault.burstWindowStart > 0 && block.timestamp < vault.burstWindowStart + policy.burstWindowSeconds)
            ? vault.burstCount
            : 0;
        burstWindowStart = vault.burstWindowStart;
        paused = vault.paused;
        balance = vault.balance;
    }

    function _validatePolicy(VaultPolicy memory policy) internal pure {
        if (policy.maxPayoutAmount == 0) revert InvalidPolicy();
        if (policy.dailyLimit < policy.maxPayoutAmount) revert InvalidPolicy();
        if (policy.burstWindowSeconds == 0) revert InvalidPolicy();
        if (policy.burstThresholdCount == 0) revert InvalidPolicy();
        if (policy.cooldownSeconds == 0) revert InvalidPolicy();
    }
}
