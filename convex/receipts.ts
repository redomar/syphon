import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib/auth";

/** Returns a short-lived upload URL for the client to POST a file to. */
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    await requireUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

/** Records an uploaded receipt, optionally linked to a transaction. */
export const saveReceipt = mutation({
  args: {
    storageId: v.id("_storage"),
    name: v.string(),
    contentType: v.string(),
    size: v.number(),
    transactionId: v.optional(v.id("transactions")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (args.transactionId) {
      const tx = await ctx.db.get(args.transactionId);
      if (!tx || tx.userId !== user._id) throw new Error("Transaction not found");
    }

    return await ctx.db.insert("receipts", {
      userId: user._id,
      transactionId: args.transactionId,
      storageId: args.storageId,
      name: args.name,
      contentType: args.contentType,
      size: args.size,
      createdAt: Date.now(),
    });
  },
});

/** All receipts for the user, newest first, with resolved file URLs. */
export const getReceipts = query({
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const receipts = await ctx.db
      .query("receipts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    return await Promise.all(
      receipts.map(async (r) => ({
        ...r,
        url: await ctx.storage.getUrl(r.storageId),
      }))
    );
  },
});

/** Deletes a receipt and its stored file. */
export const deleteReceipt = mutation({
  args: { receiptId: v.id("receipts") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const receipt = await ctx.db.get(args.receiptId);
    if (!receipt || receipt.userId !== user._id) throw new Error("Receipt not found");
    await ctx.storage.delete(receipt.storageId);
    await ctx.db.delete(args.receiptId);
  },
});
