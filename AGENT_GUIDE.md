# Coding Agent Guide: Hookflow Treasury Payout Guard

Updated: 2026-11-07.
Repository: /Users/apple/Documents/Hookflow

This is the coding-agent handoff for the scope agreed in plan.md. Read applicable AGENTS.md, plan.md, README.md, package scripts, and git status/diff before edits. It authorizes no implementation merely by existing; use the user's current request.

## Mission

Build a small native-BOT treasury payout guard using Hookflow's flow-control concepts. This release does not need Uniswap v4, pools, liquidity, or swaps. Create a purpose-built treasury contract instead of relabelling the current hook.

## Preserve

- frontend/package.json and frontend/package-lock.json already have user changes.
- keylessflow/ is an unrelated untracked project.
- Historical Hookflow contracts, tests, X Layer deployments, and proof records remain attributable to the legacy product.
- Do not overwrite old deployment defaults and accidentally publish treasury calls to a legacy hook address.

## Source Reading Order

1. src/HookFlowHook.sol, src/libraries/HookFlowFeeLogic.sol, and src/types/HookFlowTypes.sol for reusable concepts.
2. test/HookFlowHook.t.sol and foundry.toml for the existing harness and EVM settings.
3. frontend/lib/wagmi.ts and frontend/lib/contracts.ts.
4. frontend/app/providers.tsx and frontend/app/components/AppNav.tsx.
5. frontend/app/dashboard/page.tsx, frontend/app/create/page.tsx, and frontend/app/protect/page.tsx.
6. Existing deployment scripts only to understand history; create a clearly named treasury deployment path.

## First Concrete Task

Write down the new vault accounting and authorization invariants, then add focused treasury contract tests. Start with owner/operator/recipient roles and aggregate per-vault spending before adapting UI.

Do not carry over LP fee premiums or token-decimal assumptions as treasury limits. Native BOT amounts are integer wei.

## Implementation Order

1. Run legacy contract and frontend baseline checks.
2. Add HookflowTreasuryVault.sol and new tests without changing legacy hook semantics.
3. Implement isolated credited balances, deposits, owner withdrawals, and owner-managed operator/recipient permissions.
4. Implement per-payment and shared daily limits; use the UTC-day semantics in plan.md.
5. Implement burst counting and successful-threshold cooldown activation.
6. Test revocation, policy changes, pause, failed recipient transfers, and reentrancy.
7. Add compact treasury create/settings/payout views using the existing wallet stack and design.
8. Add BOT Chain-specific contract configuration, readable transaction states, activity, and footer links.
9. Document the new product and prepare a separate deployment script and evidence packet.

## Rules That Must Not Be Lost

- Spending allowance is shared by all operators for a vault.
- Operator rotation cannot reset the daily total.
- Policy updates cannot accidentally clear existing spent amounts or cooldown.
- A revert cannot persist a cooldown. Set it during the successful threshold-reaching payout, then block later payouts.
- Owner withdrawal remains an explicit owner power. Do not advertise protection against a compromised owner.
- Payouts use only approved recipients; operators cannot change policies or call arbitrary external methods.
- One vault's liabilities must never spend another vault's deposits.

## Verification Commands

From the project root:

```bash
forge test --offline
npm run build
```

Inspect the installed Next.js/ESLint versions before using the existing lint script; a tool failure is not a passed lint result. Add the smallest appropriate frontend/static check if needed.

Retain legacy test results and run new treasury tests separately where useful. Verify the chosen compilation target on BOT Chain rather than requiring Cancun merely because the old Uniswap deployment used it.

## Completion Criteria

An owner can create/fund/configure a vault, approved operators can make bounded payouts, rejected requests show readable reasons, and withdrawal/cooldown behavior matches on-chain state. Actual test/build outcomes and any deployment evidence are recorded.

## Quality And Handoff

Follow the user's current instructions and applicable AGENTS.md files. Before non-trivial implementation, check the baseline, ensure Desloppify state is ignored, and scan only the coherent application or contract boundary. Inspect status and next. After changes run appropriate format/static/tests/build checks and rescan. Do not exclude authored code, weaken tests, or mark findings resolved to improve a score artificially.

Keep dependencies/generated output and unrelated nested projects outside the work boundary. Preserve changes you did not make. Use existing libraries and local patterns; add abstractions only when they remove real complexity.

Complete independent reversible implementation work without unnecessary confirmation. Continue around missing credentials when possible using clearly labelled local fixtures. Ask for a decision only where it blocks the next dependent action. Follow actual user authorization for installations, paid services, mainnet transactions, deployment, posting, committing, and pushing.

Keep private keys and tokens in ignored local environment files. Avoid loading the owner's grant wallet as a deployment or service signer. Never print secrets, automatically publish social drafts, or claim unexecuted tests/deployments succeeded.

Use the program checklist in plan.md for external deliverables. Four participating wallets must have relevant successful originating transactions; record real sender addresses and hashes. Draft social content without inventing users, customers, metrics, or affiliations.

Append a dated execution note to plan.md at handoff:
- Completed tasks and exact files changed.
- Commands actually run and their outcomes, including baseline failures.
- Real deployment and verification evidence, if authorized and completed.
- Remaining risks/decisions, missing configuration, and the next exact action.

Distinguish local implementation, mainnet deployment, participant walkthrough, onboarding approval, and payment. Leave unchecked items incomplete. Recheck any old timeline if this guide is resumed later.

## Starting Prompt

> Read applicable AGENTS.md instructions, plan.md, and AGENT_GUIDE.md. Implement the bounded native-BOT treasury payout guard, beginning with accounting/authorization tests. Preserve legacy Hookflow and unrelated keylessflow work, reuse the existing frontend style, and report actual completion and pending release steps.
