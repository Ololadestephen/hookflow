"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatEther, isAddress, parseEther } from "viem";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract
} from "wagmi";
import { botChainDeployment, hookflowTreasuryVaultAbi } from "../../lib/contracts";
import { botChain } from "../../lib/wagmi";
import { AppNav } from "../components/AppNav";
import { Providers } from "../providers";

type TransactionRecord = {
  hash: `0x${string}`;
  type: string;
  details: string;
  timestamp: number;
};

function formatWei(wei?: bigint): string {
  if (wei === undefined) return "0.00";
  try {
    const val = formatEther(wei);
    const num = parseFloat(val);
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  } catch {
    return "0.00";
  }
}

function shortAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function TreasuryDashboardContent() {
  const { address, isConnected, chainId } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  const isBotChain = chainId === botChain.id;

  // Selected Vault State
  const [selectedVaultId, setSelectedVaultId] = useState<string>("1");
  const vaultIdBigInt = useMemo(() => {
    try {
      const parsed = BigInt(selectedVaultId);
      return parsed > 0n ? parsed : 1n;
    } catch {
      return 1n;
    }
  }, [selectedVaultId]);

  // Transaction History
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);

  // Create Vault Form State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [createDeposit, setCreateDeposit] = useState<string>("1.0");
  const [createMaxPayout, setCreateMaxPayout] = useState<string>("0.2");
  const [createDailyLimit, setCreateDailyLimit] = useState<string>("1.0");
  const [createBurstWindow, setCreateBurstWindow] = useState<string>("300");
  const [createBurstThreshold, setCreateBurstThreshold] = useState<string>("3");
  const [createCooldown, setCreateCooldown] = useState<string>("600");

  // Operator Payout Form State
  const [payoutRecipient, setPayoutRecipient] = useState<string>("");
  const [payoutAmount, setPayoutAmount] = useState<string>("");

  // Owner Admin States
  const [adminDepositAmount, setAdminDepositAmount] = useState<string>("");
  const [adminWithdrawAmount, setAdminWithdrawAmount] = useState<string>("");
  const [operatorAddress, setOperatorAddress] = useState<string>("");
  const [operatorStatus, setOperatorStatus] = useState<boolean>(true);
  const [recipientAddress, setRecipientAddress] = useState<string>("");
  const [recipientStatus, setRecipientStatus] = useState<boolean>(true);

  // Wagmi Contract Writes
  const { data: writeHash, isPending: isWritePending, writeContract, reset: resetWrite, error: writeError } = useWriteContract();
  const { isLoading: isTxWaiting, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({ hash: writeHash });

  // Read Contract Data
  const { data: totalVaults, refetch: refetchTotalVaults } = useReadContract({
    address: botChainDeployment.treasuryVault,
    abi: hookflowTreasuryVaultAbi,
    functionName: "vaultCount",
    chainId: botChain.id
  });

  const { data: payoutStatus, refetch: refetchPayoutStatus } = useReadContract({
    address: botChainDeployment.treasuryVault,
    abi: hookflowTreasuryVaultAbi,
    functionName: "getPayoutStatus",
    args: [vaultIdBigInt],
    chainId: botChain.id
  });

  const { data: vaultDetails, refetch: refetchVaultDetails } = useReadContract({
    address: botChainDeployment.treasuryVault,
    abi: hookflowTreasuryVaultAbi,
    functionName: "vaults",
    args: [vaultIdBigInt],
    chainId: botChain.id
  });

  const { data: vaultPolicy, refetch: refetchPolicy } = useReadContract({
    address: botChainDeployment.treasuryVault,
    abi: hookflowTreasuryVaultAbi,
    functionName: "vaultPolicies",
    args: [vaultIdBigInt],
    chainId: botChain.id
  });

  const { data: isCurrentCallerOperator } = useReadContract({
    address: botChainDeployment.treasuryVault,
    abi: hookflowTreasuryVaultAbi,
    functionName: "isOperator",
    args: [vaultIdBigInt, address || "0x0000000000000000000000000000000000000000"],
    chainId: botChain.id,
    query: { enabled: !!address }
  });

  const { data: isRecipientApproved } = useReadContract({
    address: botChainDeployment.treasuryVault,
    abi: hookflowTreasuryVaultAbi,
    functionName: "isRecipient",
    args: [vaultIdBigInt, isAddress(payoutRecipient) ? (payoutRecipient as `0x${string}`) : "0x0000000000000000000000000000000000000000"],
    chainId: botChain.id,
    query: { enabled: isAddress(payoutRecipient) }
  });

  const isVaultOwner = useMemo(() => {
    if (!address || !vaultDetails) return false;
    return vaultDetails[0].toLowerCase() === address.toLowerCase();
  }, [address, vaultDetails]);

  // Handle action callbacks
  function recordTx(hash: `0x${string}`, type: string, details: string) {
    setTransactions((prev) => [{ hash, type, details, timestamp: Date.now() }, ...prev]);
  }

  function handleCreateVault() {
    try {
      const depWei = parseEther(createDeposit || "0");
      const maxPayWei = parseEther(createMaxPayout || "0");
      const dailyWei = parseEther(createDailyLimit || "0");
      const burstWin = Number(createBurstWindow) || 300;
      const burstThresh = Number(createBurstThreshold) || 3;
      const coolSec = Number(createCooldown) || 600;

      writeContract(
        {
          address: botChainDeployment.treasuryVault,
          abi: hookflowTreasuryVaultAbi,
          functionName: "createVault",
          args: [
            {
              maxPayoutAmount: maxPayWei,
              dailyLimit: dailyWei,
              burstWindowSeconds: burstWin,
              burstThresholdCount: burstThresh,
              cooldownSeconds: coolSec
            }
          ],
          value: depWei,
          chainId: botChain.id
        },
        {
          onSuccess: (hash) => {
            recordTx(hash, "Create Vault", `New Vault initialized with ${createDeposit} BOT`);
            setShowCreateModal(false);
          }
        }
      );
    } catch (e: any) {
      alert(e?.message || "Invalid vault configuration parameters");
    }
  }

  function handleExecutePayout() {
    if (!isAddress(payoutRecipient)) {
      alert("Please provide a valid recipient address");
      return;
    }
    try {
      const amountWei = parseEther(payoutAmount || "0");
      writeContract(
        {
          address: botChainDeployment.treasuryVault,
          abi: hookflowTreasuryVaultAbi,
          functionName: "payout",
          args: [vaultIdBigInt, payoutRecipient as `0x${string}`, amountWei],
          chainId: botChain.id
        },
        {
          onSuccess: (hash) => {
            recordTx(hash, "Payout", `Sent ${payoutAmount} BOT to ${shortAddress(payoutRecipient)}`);
            setPayoutAmount("");
          }
        }
      );
    } catch (e: any) {
      alert(e?.message || "Failed to submit payout");
    }
  }

  function handleDeposit() {
    try {
      const amountWei = parseEther(adminDepositAmount || "0");
      writeContract(
        {
          address: botChainDeployment.treasuryVault,
          abi: hookflowTreasuryVaultAbi,
          functionName: "deposit",
          args: [vaultIdBigInt],
          value: amountWei,
          chainId: botChain.id
        },
        {
          onSuccess: (hash) => {
            recordTx(hash, "Deposit", `Deposited ${adminDepositAmount} BOT to Vault #${selectedVaultId}`);
            setAdminDepositAmount("");
          }
        }
      );
    } catch (e: any) {
      alert(e?.message || "Invalid deposit amount");
    }
  }

  function handleWithdraw() {
    try {
      const amountWei = parseEther(adminWithdrawAmount || "0");
      writeContract(
        {
          address: botChainDeployment.treasuryVault,
          abi: hookflowTreasuryVaultAbi,
          functionName: "withdraw",
          args: [vaultIdBigInt, amountWei],
          chainId: botChain.id
        },
        {
          onSuccess: (hash) => {
            recordTx(hash, "Withdrawal", `Owner withdrew ${adminWithdrawAmount} BOT from Vault #${selectedVaultId}`);
            setAdminWithdrawAmount("");
          }
        }
      );
    } catch (e: any) {
      alert(e?.message || "Invalid withdrawal amount");
    }
  }

  function handleSetOperator() {
    if (!isAddress(operatorAddress)) {
      alert("Invalid operator address");
      return;
    }
    writeContract(
      {
        address: botChainDeployment.treasuryVault,
        abi: hookflowTreasuryVaultAbi,
        functionName: "setOperator",
        args: [vaultIdBigInt, operatorAddress as `0x${string}`, operatorStatus],
        chainId: botChain.id
      },
      {
        onSuccess: (hash) => {
          recordTx(hash, "Operator Update", `${operatorStatus ? "Approved" : "Revoked"} ${shortAddress(operatorAddress)}`);
          setOperatorAddress("");
        }
      }
    );
  }

  function handleSetRecipient() {
    if (!isAddress(recipientAddress)) {
      alert("Invalid recipient address");
      return;
    }
    writeContract(
      {
        address: botChainDeployment.treasuryVault,
        abi: hookflowTreasuryVaultAbi,
        functionName: "setRecipient",
        args: [vaultIdBigInt, recipientAddress as `0x${string}`, recipientStatus],
        chainId: botChain.id
      },
      {
        onSuccess: (hash) => {
          recordTx(hash, "Recipient Update", `${recipientStatus ? "Approved" : "Revoked"} ${shortAddress(recipientAddress)}`);
          setRecipientAddress("");
        }
      }
    );
  }

  function handleTogglePause() {
    const nextPaused = !payoutStatus?.[8];
    writeContract(
      {
        address: botChainDeployment.treasuryVault,
        abi: hookflowTreasuryVaultAbi,
        functionName: "setPaused",
        args: [vaultIdBigInt, nextPaused],
        chainId: botChain.id
      },
      {
        onSuccess: (hash) => {
          recordTx(hash, "Pause State", `Vault #${selectedVaultId} ${nextPaused ? "Paused" : "Unpaused"}`);
        }
      }
    );
  }

  // Parse Live Status
  const balanceWei = payoutStatus?.[0];
  const remainingDailyWei = payoutStatus?.[1];
  const dailySpentWei = payoutStatus?.[2];
  const isCooldownActive = payoutStatus?.[4] || false;
  const cooldownUntil = payoutStatus?.[5] || 0n;
  const burstCount = payoutStatus?.[6] || 0;
  const isPaused = payoutStatus?.[8] || false;

  const maxPayoutWei = vaultPolicy?.[0];
  const dailyLimitWei = vaultPolicy?.[1];
  const burstThreshold = vaultPolicy?.[3] || 0;

  return (
    <main className="min-h-screen bg-background text-on-background lg:grid lg:grid-cols-[250px_minmax(0,1fr)]">
      <AppNav active="treasury" />

      <section className="flex flex-col justify-between px-4 py-5 md:px-8 md:py-6">
        <div className="mx-auto w-full max-w-6xl">
          {/* Top Bar */}
          <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant/60 pb-6">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <span className="inline-flex rounded border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                  BOT Chain Mainnet Guard
                </span>
                {isPaused && (
                  <span className="inline-flex rounded border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-400">
                    Paused
                  </span>
                )}
                {isCooldownActive && (
                  <span className="inline-flex rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    Cooldown Active
                  </span>
                )}
              </div>
              <h1 className="font-display text-3xl font-semibold tracking-normal md:text-4xl">
                Treasury Payout Guard
              </h1>
              <p className="mt-1 text-sm text-on-surface-variant">
                Bounded native-BOT treasury vaults with shared daily allowances, burst limiters, and automated cooldown defense.
              </p>
            </div>

            {/* Wallet & Chain Status */}
            <div className="flex flex-wrap items-center gap-3">
              {isConnected ? (
                <>
                  {!isBotChain ? (
                    <button
                      onClick={() => switchChain({ chainId: botChain.id })}
                      className="cursor-pointer rounded-lg bg-amber-500/20 border border-amber-500/40 px-4 py-2 font-label-md text-xs font-semibold text-amber-300 hover:bg-amber-500/30 transition-all"
                    >
                      Switch to BOT Chain (677)
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-xs font-medium text-primary">
                      <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                      BOT Chain (677)
                    </span>
                  )}
                  <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-surface-container px-3 py-2 text-xs font-mono-data">
                    <span>{shortAddress(address || "")}</span>
                    <button
                      onClick={() => disconnect()}
                      className="ml-2 text-on-surface-variant hover:text-white"
                      title="Disconnect"
                    >
                      ✕
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => connect({ connector: connectors[0] })}
                  className="cursor-pointer rounded-lg bg-primary px-5 py-2.5 font-label-md text-xs font-semibold text-on-primary transition-transform hover:scale-105 active:opacity-80"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </header>

          {/* Vault Selector & Create Modal Trigger */}
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/5 bg-surface-container-low/70 p-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                Select Vault:
              </label>
              <input
                type="number"
                min="1"
                value={selectedVaultId}
                onChange={(e) => setSelectedVaultId(e.target.value)}
                className="w-20 rounded border border-white/10 bg-surface-container px-3 py-1.5 font-mono-data text-sm text-white focus:border-primary focus:outline-none"
              />
              <span className="text-xs text-on-surface-variant">
                Total Vaults: {totalVaults ? totalVaults.toString() : "0"}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {isVaultOwner && (
                <span className="rounded bg-primary/20 border border-primary/30 px-2 py-1 text-[11px] font-bold text-primary">
                  YOU ARE VAULT OWNER
                </span>
              )}
              {isCurrentCallerOperator && !isVaultOwner && (
                <span className="rounded bg-emerald-500/20 border border-emerald-500/30 px-2 py-1 text-[11px] font-bold text-emerald-300">
                  APPROVED OPERATOR
                </span>
              )}
              <button
                onClick={() => setShowCreateModal(true)}
                className="cursor-pointer rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 font-label-md text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
              >
                + New Treasury Vault
              </button>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-white/5 bg-surface-container-low p-5 shadow-panel">
              <p className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">Vault Balance</p>
              <p className="mt-2 font-mono-data text-2xl font-bold text-white">
                {formatWei(balanceWei)} <span className="text-sm font-normal text-primary">BOT</span>
              </p>
              <p className="mt-1 text-xs text-on-surface-variant">Isolated on-chain balance</p>
            </div>

            <div className="rounded-xl border border-white/5 bg-surface-container-low p-5 shadow-panel">
              <p className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">Daily Allowance Left</p>
              <p className="mt-2 font-mono-data text-2xl font-bold text-white">
                {formatWei(remainingDailyWei)} <span className="text-sm font-normal text-primary">BOT</span>
              </p>
              <p className="mt-1 text-xs text-on-surface-variant">
                Spent: {formatWei(dailySpentWei)} / {formatWei(dailyLimitWei)} BOT today
              </p>
            </div>

            <div className="rounded-xl border border-white/5 bg-surface-container-low p-5 shadow-panel">
              <p className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">Single Payout Ceiling</p>
              <p className="mt-2 font-mono-data text-2xl font-bold text-white">
                {formatWei(maxPayoutWei)} <span className="text-sm font-normal text-primary">BOT</span>
              </p>
              <p className="mt-1 text-xs text-on-surface-variant">Strict per-transaction limit</p>
            </div>

            <div className="rounded-xl border border-white/5 bg-surface-container-low p-5 shadow-panel">
              <p className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">Burst & Cooldown</p>
              <p className="mt-2 font-mono-data text-2xl font-bold text-white">
                {isCooldownActive ? (
                  <span className="text-amber-400">Cooling Down</span>
                ) : (
                  <span>{burstCount} / {burstThreshold}</span>
                )}
              </p>
              <p className="mt-1 text-xs text-on-surface-variant">
                {isCooldownActive
                  ? `Blocks payouts until timestamp ${cooldownUntil.toString()}`
                  : `Threshold resets after burst window`}
              </p>
            </div>
          </div>

          {/* Main Action Grid */}
          <div className="mb-8 grid gap-8 lg:grid-cols-2">
            {/* Operator Payout Panel */}
            <div className="rounded-xl border border-white/5 bg-surface-container-low p-6 shadow-panel">
              <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
                <h2 className="font-display text-xl font-semibold text-white">Execute Guarded Payout</h2>
                <span className="text-xs text-on-surface-variant">Operator Mode</span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                    Approved Recipient Address
                  </label>
                  <input
                    type="text"
                    placeholder="0x..."
                    value={payoutRecipient}
                    onChange={(e) => setPayoutRecipient(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-surface-container px-3.5 py-2.5 font-mono-data text-sm text-white placeholder-white/20 focus:border-primary focus:outline-none"
                  />
                  {isAddress(payoutRecipient) && (
                    <p className="mt-1 text-xs">
                      Status:{" "}
                      {isRecipientApproved ? (
                        <span className="text-primary font-medium">✓ Allowlisted Recipient</span>
                      ) : (
                        <span className="text-red-400 font-medium">✗ Not Allowlisted for Vault #{selectedVaultId}</span>
                      )}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                    Amount (BOT)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    placeholder="0.0"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-surface-container px-3.5 py-2.5 font-mono-data text-sm text-white placeholder-white/20 focus:border-primary focus:outline-none"
                  />
                  <div className="mt-1 flex justify-between text-xs text-on-surface-variant">
                    <span>Ceiling: {formatWei(maxPayoutWei)} BOT</span>
                    <span>Daily Left: {formatWei(remainingDailyWei)} BOT</span>
                  </div>
                </div>

                <button
                  onClick={handleExecutePayout}
                  disabled={isWritePending || isTxWaiting || isCooldownActive || isPaused || !isAddress(payoutRecipient)}
                  className={`mt-2 w-full rounded-lg py-3 font-label-md text-xs font-bold uppercase tracking-wider transition-all ${
                    isCooldownActive || isPaused || !isAddress(payoutRecipient)
                      ? "cursor-not-allowed bg-white/5 text-on-surface-variant"
                      : "cursor-pointer bg-primary text-on-primary hover:shadow-[0_0_20px_rgba(78,222,163,0.3)] active:opacity-90"
                  }`}
                >
                  {isWritePending || isTxWaiting
                    ? "Confirming Transaction..."
                    : isCooldownActive
                    ? "Cooldown Active - Payouts Blocked"
                    : isPaused
                    ? "Vault is Paused"
                    : "Transfer Bounded BOT Payout"}
                </button>
              </div>
            </div>

            {/* Owner Management Controls */}
            <div className="rounded-xl border border-white/5 bg-surface-container-low p-6 shadow-panel">
              <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
                <h2 className="font-display text-xl font-semibold text-white">Vault Administration</h2>
                <span className="text-xs text-on-surface-variant">Owner Controls</span>
              </div>

              {!isVaultOwner ? (
                <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-white/10 text-center p-6 text-on-surface-variant">
                  <span className="text-3xl mb-2">🔒</span>
                  <p className="font-medium text-white">Owner Restricted</p>
                  <p className="mt-1 text-xs max-w-sm">
                    Connect the owner wallet ({shortAddress(vaultDetails?.[0] || "")}) to deposit, withdraw, pause, or configure operators and recipients.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Quick Pause / Resume */}
                  <div className="flex items-center justify-between rounded-lg border border-white/5 bg-surface-container p-3">
                    <div>
                      <p className="text-xs font-semibold text-white">Emergency Circuit Breaker</p>
                      <p className="text-[11px] text-on-surface-variant">
                        Immediately halts or resumes all delegated operator payouts.
                      </p>
                    </div>
                    <button
                      onClick={handleTogglePause}
                      className={`cursor-pointer rounded px-3 py-1.5 text-xs font-bold uppercase ${
                        isPaused
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : "bg-red-500/20 text-red-300 border border-red-500/40"
                      }`}
                    >
                      {isPaused ? "Unpause Vault" : "Pause Vault"}
                    </button>
                  </div>

                  {/* Fund & Withdraw */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-white/5 bg-surface-container p-3">
                      <label className="text-[11px] font-medium uppercase text-on-surface-variant block mb-1">
                        Deposit BOT
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="0.0"
                          value={adminDepositAmount}
                          onChange={(e) => setAdminDepositAmount(e.target.value)}
                          className="w-full rounded border border-white/10 bg-surface-container-lowest px-2 py-1 text-xs text-white focus:outline-none"
                        />
                        <button
                          onClick={handleDeposit}
                          className="cursor-pointer rounded bg-primary/20 px-2.5 py-1 text-xs font-bold text-primary hover:bg-primary/30"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    <div className="rounded-lg border border-white/5 bg-surface-container p-3">
                      <label className="text-[11px] font-medium uppercase text-on-surface-variant block mb-1">
                        Owner Withdraw
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="0.0"
                          value={adminWithdrawAmount}
                          onChange={(e) => setAdminWithdrawAmount(e.target.value)}
                          className="w-full rounded border border-white/10 bg-surface-container-lowest px-2 py-1 text-xs text-white focus:outline-none"
                        />
                        <button
                          onClick={handleWithdraw}
                          className="cursor-pointer rounded bg-white/10 px-2.5 py-1 text-xs font-bold text-white hover:bg-white/20"
                        >
                          Pull
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Manage Operator */}
                  <div className="rounded-lg border border-white/5 bg-surface-container p-3">
                    <label className="text-[11px] font-medium uppercase text-on-surface-variant block mb-1">
                      Manage Operator
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Operator 0x..."
                        value={operatorAddress}
                        onChange={(e) => setOperatorAddress(e.target.value)}
                        className="w-full rounded border border-white/10 bg-surface-container-lowest px-2 py-1 text-xs text-white focus:outline-none"
                      />
                      <select
                        value={operatorStatus ? "true" : "false"}
                        onChange={(e) => setOperatorStatus(e.target.value === "true")}
                        className="rounded border border-white/10 bg-surface-container-lowest px-2 py-1 text-xs text-white"
                      >
                        <option value="true">Approve</option>
                        <option value="false">Revoke</option>
                      </select>
                      <button
                        onClick={handleSetOperator}
                        className="cursor-pointer rounded bg-primary/20 px-3 py-1 text-xs font-bold text-primary hover:bg-primary/30"
                      >
                        Save
                      </button>
                    </div>
                  </div>

                  {/* Manage Recipient */}
                  <div className="rounded-lg border border-white/5 bg-surface-container p-3">
                    <label className="text-[11px] font-medium uppercase text-on-surface-variant block mb-1">
                      Manage Allowlisted Recipient
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Recipient 0x..."
                        value={recipientAddress}
                        onChange={(e) => setRecipientAddress(e.target.value)}
                        className="w-full rounded border border-white/10 bg-surface-container-lowest px-2 py-1 text-xs text-white focus:outline-none"
                      />
                      <select
                        value={recipientStatus ? "true" : "false"}
                        onChange={(e) => setRecipientStatus(e.target.value === "true")}
                        className="rounded border border-white/10 bg-surface-container-lowest px-2 py-1 text-xs text-white"
                      >
                        <option value="true">Approve</option>
                        <option value="false">Revoke</option>
                      </select>
                      <button
                        onClick={handleSetRecipient}
                        className="cursor-pointer rounded bg-primary/20 px-3 py-1 text-xs font-bold text-primary hover:bg-primary/30"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Activity & Proof Receipts */}
          <div className="rounded-xl border border-white/5 bg-surface-container-low p-6 shadow-panel mb-8">
            <h3 className="font-display text-lg font-semibold text-white mb-4">On-Chain Activity Receipts</h3>
            {transactions.length === 0 ? (
              <p className="text-xs text-on-surface-variant">No transactions submitted in this browser session.</p>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx, idx) => (
                  <div
                    key={idx}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/5 bg-surface-container px-3.5 py-2.5 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-primary mr-2">[{tx.type}]</span>
                      <span className="text-white">{tx.details}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <a
                        href={`${botChainDeployment.explorerBaseUrl}/tx/${tx.hash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono-data text-xs text-primary underline hover:text-white"
                      >
                        {shortAddress(tx.hash)} ↗
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Create Vault Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-surface-container-high p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="font-display text-xl font-bold text-white">Create BOT Treasury Vault</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-on-surface-variant hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-on-surface-variant block mb-1">
                    Initial Deposit (BOT)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={createDeposit}
                    onChange={(e) => setCreateDeposit(e.target.value)}
                    className="w-full rounded border border-white/10 bg-surface-container px-3 py-1.5 text-sm text-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-on-surface-variant block mb-1">
                      Max Payout (BOT)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={createMaxPayout}
                      onChange={(e) => setCreateMaxPayout(e.target.value)}
                      className="w-full rounded border border-white/10 bg-surface-container px-3 py-1.5 text-sm text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-on-surface-variant block mb-1">
                      Daily Limit (BOT)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={createDailyLimit}
                      onChange={(e) => setCreateDailyLimit(e.target.value)}
                      className="w-full rounded border border-white/10 bg-surface-container px-3 py-1.5 text-sm text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-on-surface-variant block mb-1">
                      Burst Window (s)
                    </label>
                    <input
                      type="number"
                      value={createBurstWindow}
                      onChange={(e) => setCreateBurstWindow(e.target.value)}
                      className="w-full rounded border border-white/10 bg-surface-container px-3 py-1.5 text-sm text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-on-surface-variant block mb-1">
                      Burst Count
                    </label>
                    <input
                      type="number"
                      value={createBurstThreshold}
                      onChange={(e) => setCreateBurstThreshold(e.target.value)}
                      className="w-full rounded border border-white/10 bg-surface-container px-3 py-1.5 text-sm text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-on-surface-variant block mb-1">
                      Cooldown (s)
                    </label>
                    <input
                      type="number"
                      value={createCooldown}
                      onChange={(e) => setCreateCooldown(e.target.value)}
                      className="w-full rounded border border-white/10 bg-surface-container px-3 py-1.5 text-sm text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-white/5">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="cursor-pointer rounded-lg px-4 py-2 text-xs font-semibold text-on-surface-variant hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateVault}
                    disabled={isWritePending || isTxWaiting}
                    className="cursor-pointer rounded-lg bg-primary px-5 py-2 text-xs font-bold text-on-primary hover:shadow-glow transition-all"
                  >
                    Deploy Vault
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BOT Chain Official Footer Links */}
        <footer className="mt-12 border-t border-outline-variant/60 pt-6 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-on-surface-variant">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">HookFlow BOT Treasury Guard</span>
              <span>•</span>
              <span>Chain ID: {botChainDeployment.chainId}</span>
            </div>

            <div className="flex items-center gap-6">
              <a
                href={botChainDeployment.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:text-primary transition-colors flex items-center gap-1"
              >
                BOT Chain Official ↗
              </a>
              <a
                href={botChainDeployment.explorerBaseUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:text-primary transition-colors flex items-center gap-1"
              >
                BOT Chain Mainnet Explorer ↗
              </a>
            </div>
          </div>
        </footer>
      </section>
    </main>
  );
}

export default function TreasuryPage() {
  return (
    <Providers>
      <TreasuryDashboardContent />
    </Providers>
  );
}
