# HookFlow ✕ BOT Chain: Official Profile & Social Deliverables

This guide provides the official X (Twitter) profile setup, the launch announcement post (tagging `@BOTChain`), and the 5 standalone educational/architectural posts required for the BOT Chain program verification.

---

## 👤 X (Twitter) Profile Setup

### Display Name
```text
HookFlow | BOT Chain Treasury Guard
```

### Bio Options (Strictly within X's 160-character limit)

**Option 1 — Balanced & High-Impact (159 chars) [Recommended]:**
```text
Autonomous native-BOT treasury payout guard on @BOTChain Mainnet (677). Bounded payouts, shared daily caps, operator allowlists & automated burst cooldowns. ⚡️
```

**Option 2 — Technical / Smart Contract Focused (158 chars):**
```text
Flow-controlled treasury guard on @BOTChain. Bounded spending ceilings, shared daily allowances, burst limiters & emergency pause for autonomous agents & DAOs.
```

**Option 3 — Minimalist & Direct (134 chars):**
```text
Guarding native-BOT treasury flow on @BOTChain Mainnet (677). Shared daily limits, operator allowlists & automated cooldown defense. 🛡️
```

### Profile Metadata
- **Location:** `BOT Chain Mainnet (677)`
- **Website:** `https://github.com/Ololadestephen/hookflow` *(or live deployment URL)*
- **Profile Picture (PFP):** [`docs/assets/hookflow-x-pfp.jpg`](assets/hookflow-x-pfp.jpg) *(800×800 Retina JPEG)*
- **Header Cover:** [`docs/assets/hookflow-x-cover.jpg`](assets/hookflow-x-cover.jpg) *(1500×500 Standard Banner JPEG)*

---

## 🚀 Official Launch & Partnership Announcement Post

> **Attach Image:** [`docs/assets/hookflow-botchain-partnership.jpg`](assets/hookflow-botchain-partnership.jpg)  
> **Target Account to Tag:** `@BOTChain`

```text
🛡️ Introducing HookFlow: Autonomous Native-BOT Treasury Payout Guard on @BOTChain Mainnet!

Autonomous agents and protocol operators need delegation to disburse funds. But giving an operator a hot wallet or raw signing key invites catastrophic drain.

HookFlow brings deterministic on-chain flow control to native BOT treasuries on #BOTChain.

Key Invariants:
✅ Single Payout Ceilings: Strict maximum amount per transaction
✅ Shared Daily Limit: Aggregated across all operators, resetting deterministically at 00:00 UTC
✅ Burst Cooldown Defense: Payout rate tracking triggers an automatic, immutable cooldown period
✅ Operator & Recipient Allowlisting: Zero unapproved destinations; instant owner emergency pause
✅ Multi-Vault Isolation: Independent ledger accounting in integer wei

🔗 GitHub: https://github.com/Ololadestephen/hookflow
🌐 BOT Chain Explorer: https://scan.botchain.ai
⚡️ Target: BOT Chain Mainnet (Chain ID 677)

Guard your treasury flow. Build with bounded autonomy on #BOTChain. ⚡️ #BuildOnBOT #Web3 #Security
```

---

## 🧵 Five Standalone Architectural & Educational Posts

### Post 1: The Problem — Raw Hot Wallets vs. Delegated Treasury Guard
> **Topic:** The vulnerability of giving bots or human operators unrestricted wallet access.

```text
Giving an autonomous agent or team operator a raw private key to a treasury wallet is an operational vulnerability waiting to happen.

If that operator key is compromised, or an agent hits an infinite loop:
❌ The entire treasury balance is drained in seconds
❌ Unrestricted transfers flow to arbitrary destination addresses
❌ There is zero circuit breaker

HookFlow introduces an on-chain guardrail between treasury funds and operational execution. Operators can only disburse bounded sums to allowlisted recipients within strict daily caps.

#Web3Security #AutonomousAgents #BOTChain #SmartContracts
```

---

### Post 2: Shared Daily Limits & Deterministic UTC Rollover
> **Topic:** Why per-operator limits fail and why aggregate daily caps are essential.

```text
Why individual operator allowances fail treasury security:

If Operator A has a 100 BOT allowance and Operator B has a 100 BOT allowance, rotating operators or compromising multiple keys doubles the attack surface.

In HookFlow on @BOTChain:
📊 Daily spending allowance is SHARED across every operator assigned to that vault.
🔄 Operator rotation CANNOT reset the daily total.
🕒 Day boundaries evaluate deterministically at 00:00 UTC (block.timestamp / 86400), preventing rolling-window drift or sliding-window bypasses.

Predictable, auditable daily capital flow.

#Solidity #DeFiSecurity #BOTChain
```

---

### Post 3: Burst Rate Limiting & Automated Cooldown Defense
> **Topic:** How HookFlow detects rapid micro-payout drains and triggers on-chain cooldown.

```text
What stops an attacker from executing 100 maximum payouts back-to-back?

HookFlow's native burst defense:
1️⃣ The first successful payout anchors a rolling burst window (e.g. 5 minutes).
2️⃣ Every subsequent payout inside the window increments the burst count.
3️⃣ Reaching the threshold automatically activates an immutable cooldown period (e.g. 30 minutes).
4️⃣ During cooldown, all subsequent payout attempts revert on-chain.

No off-chain monitoring bot or keeper needed — the smart contract protects itself natively on @BOTChain.

#BuildOnBOT #SmartContracts #DevSecOps
```

---

### Post 4: Multi-Vault Isolation & Zero-Relayer Architecture
> **Topic:** Clean isolation, owner withdrawal rights, and zero external relayer dependencies.

```text
Smart contract architecture should be as simple as possible, but no simpler.

HookFlow Treasury Vault invariants:
🔒 Multi-Vault Isolation: Vault A's liabilities can NEVER spend or affect Vault B's deposits.
🔑 Explicit Role Separation:
   • Owner: Holds withdrawal rights, manages allowlists, adjusts policy, toggles emergency pause.
   • Operators: Can ONLY pay allowlisted recipients within policy limits.
   • Recipients: Verified destination addresses only.
⚡️ Native BOT (Wei): Integer arithmetic with zero token-decimal rounding traps.

Built directly on @BOTChain Mainnet (Chain ID 677).

#Solidity #CleanCode #Ethereum #BOTChain
```

---

### Post 5: Autonomous Operations & The Future of Agentic Finance
> **Topic:** Enabling AI agents and autonomous bots to manage real on-chain budgets safely.

```text
The future of on-chain operations is autonomous agents executing tasks, paying vendors, and managing micro-budgets.

For agents to hold capital safely, they need bounded execution environments:
• Defined operational boundaries
• Hard transaction caps
• Automated rate limiting
• Human-in-the-loop owner circuit breakers

HookFlow provides the financial containment layer on @BOTChain Mainnet for the autonomous agent era.

Explore the repository & contract architecture:
https://github.com/Ololadestephen/hookflow

#AI #AutonomousAgents #BOTChain #Web3
```
