import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { requireUser } from "./lib/auth";

/**
 * E9 importer v2 — batched write path. The client parses and classifies the CSV
 * (src/lib/import), then: startImport -> appendBatch (<= MAX_BATCH rows, repeat)
 * -> linkTransfers -> finishImport. Re-sending rows is safe: dedupeKey is checked
 * server-side, so an interrupted import can simply be run again.
 */

export const MAX_BATCH = 500;
const UNDO_BATCH = 500;

const batchRow = v.object({
  ref: v.number(), // client row index, echoed back for transfer linking
  type: v.union(v.literal("INCOME"), v.literal("EXPENSE"), v.literal("TRANSFER")),
  amount: v.number(), // pence, > 0
  description: v.string(),
  date: v.number(),
  categoryId: v.optional(v.id("categories")),
  accountId: v.optional(v.id("accounts")),
  merchant: v.optional(v.string()),
  merchantSource: v.optional(
    v.union(v.literal("csv"), v.literal("rule"), v.literal("cleaner"), v.literal("raw"))
  ),
  rawDescription: v.optional(v.string()),
  externalCategory: v.optional(v.string()),
  isRefund: v.optional(v.boolean()),
  direction: v.optional(v.union(v.literal("in"), v.literal("out"))),
  dedupeKey: v.string(),
  sourceRow: v.optional(v.record(v.string(), v.string())),
});

async function ownImport(ctx: MutationCtx, importId: Id<"imports">, userId: Id<"users">) {
  const imp = await ctx.db.get(importId);
  if (!imp || imp.userId !== userId) throw new Error("Import not found");
  return imp;
}

export const startImport = mutation({
  args: {
    fileName: v.string(),
    total: v.number(),
    mappingSnapshot: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return await ctx.db.insert("imports", {
      userId: user._id,
      fileName: args.fileName,
      rowCount: 0,
      status: "in_progress",
      counts: {
        total: args.total,
        inserted: 0,
        duplicate: 0,
        excluded: 0,
        skipped: 0,
        transfers: 0,
        refunds: 0,
      },
      mappingSnapshot: args.mappingSnapshot,
      createdAt: Date.now(),
    });
  },
});

export const appendBatch = mutation({
  args: { importId: v.id("imports"), rows: v.array(batchRow) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const imp = await ownImport(ctx, args.importId, user._id);
    if (imp.status !== "in_progress") throw new Error("Import is not in progress");
    if (args.rows.length > MAX_BATCH) throw new Error(`At most ${MAX_BATCH} rows per batch`);

    // verify referenced categories/accounts belong to the user (cached per batch)
    const owned = new Map<string, boolean>();
    const check = async (id: Id<"categories"> | Id<"accounts"> | undefined) => {
      if (!id) return;
      if (!owned.has(id)) {
        const doc = await ctx.db.get(id);
        owned.set(id, !!doc && doc.userId === user._id);
      }
      if (!owned.get(id)) throw new Error("Category or account not found");
    };

    const now = Date.now();
    const results: { ref: number; id: Id<"transactions">; duplicate: boolean }[] = [];
    let inserted = 0;
    let duplicate = 0;

    for (const row of args.rows) {
      if (row.amount <= 0) throw new Error("Amount must be positive");
      await check(row.categoryId);
      await check(row.accountId);

      const existing = await ctx.db
        .query("transactions")
        .withIndex("by_user_and_dedupe", (q) =>
          q.eq("userId", user._id).eq("dedupeKey", row.dedupeKey)
        )
        .first();
      if (existing) {
        duplicate++;
        results.push({ ref: row.ref, id: existing._id, duplicate: true });
        continue;
      }

      const { ref: _ref, ...fields } = row;
      const id = await ctx.db.insert("transactions", {
        ...fields,
        userId: user._id,
        status: "posted",
        importId: args.importId,
        isDemoData: false,
        createdAt: now,
        updatedAt: now,
      });
      inserted++;
      results.push({ ref: row.ref, id, duplicate: false });
    }

    const counts = imp.counts!;
    await ctx.db.patch(args.importId, {
      rowCount: imp.rowCount + inserted,
      counts: {
        ...counts,
        inserted: counts.inserted + inserted,
        duplicate: counts.duplicate + duplicate,
      },
    });

    return { inserted, duplicate, results };
  },
});

/** Links transfer legs both ways. Legs must be the user's TRANSFER rows. */
export const linkTransfers = mutation({
  args: {
    importId: v.id("imports"),
    pairs: v.array(v.object({ a: v.id("transactions"), b: v.id("transactions") })),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await ownImport(ctx, args.importId, user._id);
    if (args.pairs.length > MAX_BATCH) throw new Error(`At most ${MAX_BATCH} pairs per call`);
    let linked = 0;
    for (const { a, b } of args.pairs) {
      const [ta, tb] = [await ctx.db.get(a), await ctx.db.get(b)];
      if (!ta || !tb || ta.userId !== user._id || tb.userId !== user._id) continue;
      if (ta.type !== "TRANSFER" || tb.type !== "TRANSFER") continue;
      await ctx.db.patch(a, { transferPairId: b });
      await ctx.db.patch(b, { transferPairId: a });
      linked++;
    }
    return { linked };
  },
});

const pair = v.object({ value: v.string(), target: v.string() });
const profileArg = v.object({
  name: v.string(),
  headerFingerprint: v.string(),
  mapping: v.any(),
  categoryTargets: v.array(pair),
  accountTargets: v.array(pair),
});

/** Marks the import complete with final client-side counts and remembers the profile. */
export const finishImport = mutation({
  args: {
    importId: v.id("imports"),
    excluded: v.number(),
    skipped: v.number(),
    transfers: v.number(),
    refunds: v.number(),
    profile: v.optional(profileArg),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const imp = await ownImport(ctx, args.importId, user._id);
    const now = Date.now();

    let profileId = imp.profileId;
    if (args.profile) {
      const existing = await ctx.db
        .query("import_profiles")
        .withIndex("by_user_and_fingerprint", (q) =>
          q.eq("userId", user._id).eq("headerFingerprint", args.profile!.headerFingerprint)
        )
        .first();
      if (existing) {
        await ctx.db.patch(existing._id, {
          ...args.profile,
          categoryMap: undefined,
          accountMap: undefined,
          lastUsedAt: now,
          updatedAt: now,
        });
        profileId = existing._id;
      } else {
        profileId = await ctx.db.insert("import_profiles", {
          ...args.profile,
          userId: user._id,
          lastUsedAt: now,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    await ctx.db.patch(args.importId, {
      status: "complete",
      profileId,
      counts: {
        ...imp.counts!,
        excluded: args.excluded,
        skipped: args.skipped,
        transfers: args.transfers,
        refunds: args.refunds,
      },
    });
    return { profileId };
  },
});

/** Import history, newest first. */
export const getImports = query({
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    return await ctx.db
      .query("imports")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

/**
 * Deletes an import's transactions in batches. Call until `done`; the import
 * record is removed on the final call. Unlinks transfer partners and receipts
 * that live outside this import.
 */
export const undoImport = mutation({
  args: { importId: v.id("imports") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await ownImport(ctx, args.importId, user._id);

    const batch = await ctx.db
      .query("transactions")
      .withIndex("by_user_and_import", (q) =>
        q.eq("userId", user._id).eq("importId", args.importId)
      )
      .take(UNDO_BATCH);

    for (const t of batch) {
      if (t.transferPairId) {
        const partner = await ctx.db.get(t.transferPairId);
        if (partner && partner.importId !== args.importId) {
          await ctx.db.patch(partner._id, { transferPairId: undefined });
        }
      }
      const receipts = await ctx.db
        .query("receipts")
        .withIndex("by_transaction", (q) => q.eq("transactionId", t._id))
        .collect();
      for (const r of receipts) await ctx.db.patch(r._id, { transactionId: undefined });
      await ctx.db.delete(t._id);
    }

    const done = batch.length < UNDO_BATCH;
    if (done) await ctx.db.delete(args.importId);
    return { deleted: batch.length, done };
  },
});
