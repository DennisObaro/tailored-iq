import type { CreditSource, CreditTransaction } from "@/lib/types";
import { simulateNetwork } from "./client";
import { db, type Database } from "./_db";
import { id } from "@/lib/utils/id";

/**
 * The client credit balance, always derived from the ledger.
 *
 * Nothing stores a balance. Every read sums the rows, so there is no second
 * copy of the number to fall out of step with the transactions that explain
 * it — a spend that fails to write its row simply doesn't happen.
 */
export function balanceWithin(d: Database, userId: string): number {
  return d.creditTransactions
    .filter((t) => t.userId === userId)
    .reduce((sum, t) => sum + t.amount, 0);
}

export function recordCreditWithin(
  d: Database,
  input: { userId: string; amount: number; source: CreditSource; note: string },
): CreditTransaction {
  const transaction: CreditTransaction = {
    id: id("credit"),
    userId: input.userId,
    amount: input.amount,
    source: input.source,
    note: input.note,
    createdAt: new Date().toISOString(),
  };
  d.creditTransactions.unshift(transaction);
  return transaction;
}

/**
 * Spends up to `amount` of the user's balance, and reports what was actually
 * taken. A partial balance is applied rather than refused: credit comes off
 * the price, it isn't a token that only works in whole purchases.
 */
export function spendCreditsWithin(
  d: Database,
  input: { userId: string; amount: number; note: string },
): number {
  const applied = Math.min(balanceWithin(d, input.userId), Math.max(input.amount, 0));
  if (applied <= 0) return 0;
  recordCreditWithin(d, {
    userId: input.userId,
    amount: -applied,
    source: "playbook_unlock",
    note: input.note,
  });
  return applied;
}

export async function getCreditBalance(userId: string): Promise<number> {
  return simulateNetwork(() => balanceWithin(db.get(), userId), { latency: [100, 200] });
}

export async function listCreditTransactions(userId: string): Promise<CreditTransaction[]> {
  return simulateNetwork(
    () =>
      db
        .get()
        .creditTransactions.filter((t) => t.userId === userId)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    { latency: [120, 250] },
  );
}
