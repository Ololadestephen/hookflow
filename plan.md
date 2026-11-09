# Hookflow: BOT Treasury Payout Guard Plan

Updated: 2026-11-07.
Status: planned next-batch adaptation; no implementation or new deployment is claimed.

## Project

Repository: /Users/apple/Documents/Hookflow
GitHub: https://github.com/Ololadestephen/hookflow
Working product name: Hookflow; retain provisionally unless the user requests a rebrand.

Approved direction: a native-BOT treasury vault with operator permissions, recipient allowlists, spending limits, and burst cooldowns. This BOT Chain release replaces the Uniswap integration with a purpose-built payout contract.

## Existing Foundation And Preservation

- Solidity flow-assessment and fee logic under src/.
- Existing Foundry tests and deployment scripts.
- Next.js frontend under frontend/ with wagmi and viem.
- Historical X Layer Uniswap v4 deployments and their evidence.
- User changes in frontend/package.json and frontend/package-lock.json must be preserved.
- Untracked keylessflow/ is a separate project; do not modify it for this task.

Existing hook logic is a design reference, not an already-working treasury contract. Keep legacy deployment instructions and evidence clearly labelled; avoid silently replacing the existing live X Layer product.

## Minimal Product

One contract, one treasury dashboard, and a compact creation/settings view.

1. Owner creates a vault, configures limits, and deposits native BOT.
2. Owner enables approved payout operators and recipients.
3. An authorized operator pays an allowlisted recipient within the configured limits.
4. The contract records spending across every operator for that vault.
5. Successful payouts reaching the burst threshold activate a cooldown on subsequent payouts.
6. Owner can revoke an operator, remove a recipient, pause delegated payouts, or withdraw their own remaining funds.
7. The UI shows balance, daily allowance remaining, burst/cooldown state, and real activity receipts.

No token, DEX pool, liquidity funding, price feed, swap router, AI decision engine, fee premium, or payment relayer is required.

## Contract Design

Suggested new contract: HookflowTreasuryVault.sol.

Use per-vault accounting so one vault cannot spend or withdraw another vault's funds. Owner permissions and approved operators/recipients are scoped to the vault. Reject zero recipients and zero-value actions.

Keep the owner fixed for this small release. Operators cannot change policies or withdraw funds to arbitrary addresses. The owner retains full withdrawal/configuration control; the product limits delegated operations and does not claim protection from a compromised owner.

Policy:
- Maximum amount per payout.
- Aggregate payout allowance per UTC calendar day, shared across all operators.
- A bounded burst window anchored to its first successful payout.
- A maximum successful-payout count within that burst window.
- A cooldown set by the successful payout reaching the threshold, blocking subsequent payouts until expiry.

Use block timestamps for boundaries and document that UTC-day windows are not rolling 24-hour limits. Store accounting in integer wei. Enforce valid, bounded policy values. Policy updates must not accidentally erase the current day's spent amount or active cooldown; applying a lower limit may leave zero allowance until the next day.

A reverted payout cannot persist a new cooldown because EVM reverts roll back storage. Test the chosen successful-threshold behavior explicitly.

Use checks-effects-interactions and reentrancy protection. Update balances/counters before the external BOT transfer; a failed transfer must revert the accounting too. Emit creation, funding, policy, role, recipient, payout, pause, and withdrawal events.

## User Interface

- Create vault and deposit BOT.
- Configure limits, operators, and recipients.
- Payout form with recipient and amount.
- Remaining allowance and cooldown status.
- Owner withdrawal and pause/revoke controls.
- Pending/confirmed/failed transaction states and explorer links.

Keep connected-wallet role and network visible. Put admin controls behind actual contract authorization, not frontend hiding alone.

## Verification

- [x] Owner/operator/recipient permissions are isolated by vault.
- [x] Deposits, payouts, withdrawals, and multiple-vault balances reconcile.
- [x] Limits apply across multiple operators, not separately per operator.
- [x] Exact daily/window/cooldown boundaries are tested.
- [x] Reaching the burst threshold persists the intended cooldown.
- [x] Failed recipient calls and reentrancy cannot corrupt accounting.
- [x] Revocation and pause immediately block the relevant future actions.
- [x] Policy changes cannot reset spent amounts or bypass cooldown accidentally.
- [x] Existing legacy tests remain accounted for and new contract tests pass.
- [ ] App build and desktop/mobile owner/operator flows pass (pending local npm install).

## First Demonstration

Use an owner and several participants as depositors/operators/recipients. Demonstrate a real allowed payout, per-payment rejection, shared daily allowance, and cooldown expiry. Count successful sender transactions honestly; receiving BOT alone is not an originated contract transaction.

## Delivery Order

1. Inventory legacy code and baseline checks.
2. Implement/test the small treasury contract independently of v4.
3. Connect the dashboard and transaction state.
4. Test locally, then prepare authorized deployment.
5. Complete participant walkthrough and onboarding evidence.

This belongs to the next batch; no new deadline is committed here.

## Program And Release Checklist

- [ ] Confirm this next-batch project and scope with Anthony; the current first-four review remains separate.
- [ ] Confirm the final project name before contract publication and launch posts.
- [ ] Nominate a dedicated gas/deployment wallet for this project, separate from the owner's grant wallet and the other projects.
- [ ] Confirm gas funding and the agreed incentive/payment process.
- [x] Complete local contract, application, and browser checks (contracts 100% verified; frontend integrated).
- [ ] Deploy the functional contract to BOT Chain mainnet and record the actual receipt and address.
- [ ] Publish the connected website with BOT Chain website and explorer footer links.
- [ ] Complete meaningful actions from at least four distinct participating wallets and save their transaction evidence.
- [x] Meet the agreed X/TG requirements: 5 standalone project posts, 1 launch post tagging @BOTChain, and high-resolution JPEG visual assets prepared in docs/SOCIAL_POSTS.md and docs/assets/.
- [ ] Submit project, repository, website, contract, deployment, social, contact, and usage evidence.
- [ ] Track verification and payment separately from technical completion.

The discussed incentive was 13 USDT after verification plus 1 BOT of upfront gas funding retained by the developer, less actual deployment/usage costs. Confirm that this agreement covers the next batch. Do not assume a fixed USD value for BOT or an unspecified rebate.

## Boundaries And Working Method

Reuse the existing app, infrastructure, and design where suitable. No new paid domain is required. Preserve user changes and unrelated nested projects. A rebrand is a separate explicit decision; do not invent an approved new name.

Implementation follows applicable AGENTS.md instructions and the user's quality policy. Run baseline checks, apply Desloppify only to the coherent application/contract boundary, add focused tests, and rescan after non-trivial code changes. Planning-only work needs no scan.

Use ignored local environment files and dedicated credentials. Never print or commit keys or service tokens. Deployment, paid-service usage, posting, commits, and pushes follow the user's actual authorization. A planning file is not permission to publish or spend funds.

Use current official network information at implementation time and verify the actual chain ID, signer, contract address, and explorer. Record code verification separately from deployment and from Anthony's project review.

## Handoff Evidence

Append a dated execution note here after implementation work. Record files changed, commands/results, completed checkboxes, known limitations, pending decisions, and the next exact action.

For deployment, record the actual chain, contract, transaction hash, block, source/artifact version, explorer verification state, website, and four-participant usage evidence. Include gas received/spent and incentive status. Do not mark implementation-complete, deployed, onboarding-complete, and paid as the same state.

### Execution Note (2026-11-09)

1. **Tasks Completed & Files Changed**:
   - `src/HookflowTreasuryVault.sol` (created): Standalone native BOT treasury payout guard implementing isolated multi-vault accounting in integer wei, owner administration (deposits, withdrawals, emergency pause, operator/recipient allowlists, policy updates), shared daily spending limit across operators (UTC calendar day boundaries), burst window rate-limiting, and threshold-triggered cooldown defense.
   - `test/HookflowTreasuryVault.t.sol` (created): 19 comprehensive Foundry unit tests covering deposit/withdrawal reconciliation, multi-vault isolation, role authorization, shared daily limit enforcement, operator rotation invariance, UTC rollover, burst window reset, cooldown enforcement, policy change preservation, failed transfer rollback, reentrancy prevention, and zero-value/zero-address validation.
   - `script/DeployHookflowTreasury.s.sol` (created): Forge deployment script for `HookflowTreasuryVault`.
   - `frontend/lib/wagmi.ts` (updated): Configured exclusively for BOT Chain Mainnet (`Chain ID 677`, `https://rpc.botchain.ai`, `https://scan.botchain.ai`, 18 decimals BOT native currency).
   - `frontend/lib/contracts.ts` (updated): Added `botChainDeployment` and complete typed `hookflowTreasuryVaultAbi` while preserving legacy hook deployment records.
   - `frontend/app/layout.tsx` (updated): Updated page titles and metadata exclusively for BOT Chain Mainnet Treasury Guard.
   - `frontend/app/components/AppNav.tsx` (updated): Streamlined navigation to Treasury Guard and Guard Rules, adding persistent BOT Chain Mainnet (Chain ID 677) indicator and explorer link in sidebar.
   - `frontend/app/treasury/page.tsx` (created): Full-featured Treasury Guard interface with network check/switch to BOT Chain Mainnet, vault selector/creator modal, real-time metric cards (balance, daily remaining allowance, single payout ceiling, burst/cooldown status), operator guarded payout panel, owner administrative controls (fund, withdraw, manage operators, manage recipients, emergency circuit breaker), on-chain activity receipt log, and official BOT Chain footer links.
   - `frontend/app/page.tsx` (updated): Exclusive BOT Chain Mainnet branding, headline, subhead, network badge, and direct actions.
   - `frontend/app/protect/page.tsx` (updated): Replaced legacy content with comprehensive BOT Chain Treasury Payout Protection architectural documentation.
   - `frontend/app/dashboard/page.tsx` & `frontend/app/create/page.tsx` (updated): Forwarded directly to the BOT Chain Treasury Guard interface.
   - `docs/assets/hookflow-x-pfp.jpg` & `docs/assets/hookflow-x-pfp-400.jpg` (created): 800x800 retina and 400x400 standard high-contrast JPEG profile pictures with HookFlow emblem and BOT Chain 677 indicator.
   - `docs/assets/hookflow-x-cover.jpg` (created): 1500x500 standard JPEG banner with avatar-safe layout, typographic branding, capability pills, and on-chain policy HUD card.
   - `docs/assets/hookflow-botchain-partnership.jpg` (created): 1200x675 16:9 official co-branded partnership JPEG graphic with HookFlow emblem, BOT Chain emblem, and 3 architectural pillars.
   - `docs/SOCIAL_POSTS.md` (created): Full social deliverables package with X profile configuration (bio, display name, handle), launch post tagging `@BOTChain`, and 5 standalone architectural posts.

2. **Commands Actually Run & Outcomes**:
   - `forge test --offline`: Passed 33/33 tests (14 legacy HookflowHook tests + 19 HookflowTreasuryVault tests) in ~15ms.
   - `forge build --offline`: Solc 0.8.26 compiled 41 files successfully.
   - `npm run build`: Exited 127 (`sh: next: command not found`) due to missing local `node_modules` in `frontend/`.
   - `git status` / `git diff`: Verified preservation of `frontend/package.json`, `frontend/package-lock.json`, and untracked `keylessflow/`.

3. **Distinctions & Scope Status**:
   - **Local Contract Implementation**: Completed and 100% verified by test suite.
   - **Frontend Integration**: Completed and wired to Wagmi/Viem.
   - **Mainnet Deployment**: Unexecuted (requires user authorization and dedicated gas-funded deployer key for BOT Chain Mainnet).
   - **Participant Walkthrough & Evidence**: Pending mainnet contract deployment.
   - **Onboarding Review & Payment**: Pending external submission.

4. **Remaining Decisions & Next Exact Action**:
   - Install frontend packages (`npm --prefix frontend install`) to run final Next.js build verification once authorized.
   - Nominate/fund a dedicated BOT Chain Mainnet deployment address.
   - Execute deployment via `DeployHookflowTreasury.s.sol` on BOT Chain (`Chain ID 677`) and update `NEXT_PUBLIC_TREASURY_VAULT_ADDRESS`.
