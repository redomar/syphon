import { expect, test, describe } from "vitest";
import { api } from "./_generated/api";
import { setupTestWithUser, seedUserB } from "./test.helpers";

async function storeBlob(t: Awaited<ReturnType<typeof setupTestWithUser>>["t"]) {
  return await t.run(async (ctx) =>
    ctx.storage.store(new Blob(["receipt-bytes"], { type: "image/png" }))
  );
}

describe("receipts", () => {
  test("saveReceipt then getReceipts returns it", async () => {
    const { t, asUser } = await setupTestWithUser();
    const storageId = await storeBlob(t);

    await asUser.mutation(api.receipts.saveReceipt, {
      storageId,
      name: "receipt.png",
      contentType: "image/png",
      size: 1234,
    });

    const receipts = await asUser.query(api.receipts.getReceipts);
    expect(receipts).toHaveLength(1);
    expect(receipts[0].name).toBe("receipt.png");
  });

  test("deleteReceipt removes the record", async () => {
    const { t, asUser } = await setupTestWithUser();
    const storageId = await storeBlob(t);
    const id = await asUser.mutation(api.receipts.saveReceipt, {
      storageId,
      name: "r.png",
      contentType: "image/png",
      size: 10,
    });
    await asUser.mutation(api.receipts.deleteReceipt, { receiptId: id });
    expect(await asUser.query(api.receipts.getReceipts)).toHaveLength(0);
  });

  test("blocks deleting another user's receipt", async () => {
    const { t, asUser } = await setupTestWithUser();
    const { asUserB } = await seedUserB(t);
    const storageId = await storeBlob(t);
    const id = await asUser.mutation(api.receipts.saveReceipt, {
      storageId,
      name: "r.png",
      contentType: "image/png",
      size: 10,
    });
    await expect(
      asUserB.mutation(api.receipts.deleteReceipt, { receiptId: id })
    ).rejects.toThrow("Receipt not found");
  });

  test("rejects linking another user's transaction", async () => {
    const { t, asUser } = await setupTestWithUser();
    const { asUserB } = await seedUserB(t);
    const storageId = await storeBlob(t);
    const txId = await asUser.mutation(api.transactions.createTransaction, {
      type: "EXPENSE",
      amount: 1000,
      description: "x",
      date: Date.now(),
    });
    await expect(
      asUserB.mutation(api.receipts.saveReceipt, {
        storageId,
        name: "r.png",
        contentType: "image/png",
        size: 10,
        transactionId: txId,
      })
    ).rejects.toThrow("Transaction not found");
  });
});
