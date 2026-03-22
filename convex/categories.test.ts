import { expect, test, describe } from "vitest";
import { api } from "./_generated/api";
import { setupTestWithUser, seedUserB } from "./test.helpers";

describe("createCategory", () => {
  test("creates a category with correct fields", async () => {
    const { asUser } = await setupTestWithUser();

    const id = await asUser.mutation(api.categories.createCategory, {
      name: "Groceries",
      type: "expense",
      color: "#FF5733",
      icon: "ShoppingCart",
    });

    expect(id).toBeDefined();
  });

  test("prevents duplicate names (case-insensitive) within same type", async () => {
    const { asUser } = await setupTestWithUser();

    await asUser.mutation(api.categories.createCategory, {
      name: "Groceries",
      type: "expense",
      color: "#FF5733",
      icon: "ShoppingCart",
    });

    await expect(
      asUser.mutation(api.categories.createCategory, {
        name: "groceries",
        type: "expense",
        color: "#000000",
        icon: "Cart",
      })
    ).rejects.toThrow("Category with this name already exists");
  });

  test("allows same name across different types", async () => {
    const { asUser } = await setupTestWithUser();

    await asUser.mutation(api.categories.createCategory, {
      name: "Other",
      type: "expense",
      color: "#FF5733",
      icon: "Circle",
    });

    const id = await asUser.mutation(api.categories.createCategory, {
      name: "Other",
      type: "income",
      color: "#33FF57",
      icon: "Circle",
    });

    expect(id).toBeDefined();
  });

  test("requires authentication", async () => {
    const { t } = await setupTestWithUser();

    await expect(
      t.mutation(api.categories.createCategory, {
        name: "Test",
        type: "expense",
        color: "#000",
        icon: "X",
      })
    ).rejects.toThrow("Unauthorized");
  });
});

describe("updateCategory", () => {
  test("updates name successfully", async () => {
    const { t, asUser } = await setupTestWithUser();

    const id = await asUser.mutation(api.categories.createCategory, {
      name: "Groceries",
      type: "expense",
      color: "#FF5733",
      icon: "ShoppingCart",
    });

    await asUser.mutation(api.categories.updateCategory, {
      categoryId: id,
      name: "Food & Groceries",
    });

    const cat = await t.run(async (ctx) => ctx.db.get(id));
    expect(cat!.name).toBe("Food & Groceries");
  });

  test("regression: does not skip update when name is provided", async () => {
    const { t, asUser } = await setupTestWithUser();

    const id = await asUser.mutation(api.categories.createCategory, {
      name: "Old Name",
      type: "expense",
      color: "#FF5733",
      icon: "ShoppingCart",
    });

    await asUser.mutation(api.categories.updateCategory, {
      categoryId: id,
      color: "#000000",
    });

    const cat = await t.run(async (ctx) => ctx.db.get(id));
    expect(cat!.color).toBe("#000000");
  });

  test("prevents renaming to existing duplicate name", async () => {
    const { asUser } = await setupTestWithUser();

    await asUser.mutation(api.categories.createCategory, {
      name: "Groceries",
      type: "expense",
      color: "#FF5733",
      icon: "ShoppingCart",
    });

    const id2 = await asUser.mutation(api.categories.createCategory, {
      name: "Transport",
      type: "expense",
      color: "#FFC300",
      icon: "Car",
    });

    await expect(
      asUser.mutation(api.categories.updateCategory, {
        categoryId: id2,
        name: "Groceries",
      })
    ).rejects.toThrow("Category with this name already exists");
  });

  test("blocks update to another user's category", async () => {
    const { t, asUser } = await setupTestWithUser();
    const { asUserB } = await seedUserB(t);

    const id = await asUser.mutation(api.categories.createCategory, {
      name: "Groceries",
      type: "expense",
      color: "#FF5733",
      icon: "ShoppingCart",
    });

    await expect(
      asUserB.mutation(api.categories.updateCategory, {
        categoryId: id,
        name: "Hacked",
      })
    ).rejects.toThrow("Category not found");
  });
});

describe("deleteCategory (archive)", () => {
  test("archives a category", async () => {
    const { t, asUser } = await setupTestWithUser();

    const id = await asUser.mutation(api.categories.createCategory, {
      name: "Groceries",
      type: "expense",
      color: "#FF5733",
      icon: "ShoppingCart",
    });

    await asUser.mutation(api.categories.deleteCategory, { categoryId: id });

    const cat = await t.run(async (ctx) => ctx.db.get(id));
    expect(cat!.isArchived).toBe(true);
  });

  test("prevents double-archiving", async () => {
    const { asUser } = await setupTestWithUser();

    const id = await asUser.mutation(api.categories.createCategory, {
      name: "Groceries",
      type: "expense",
      color: "#FF5733",
      icon: "ShoppingCart",
    });

    await asUser.mutation(api.categories.deleteCategory, { categoryId: id });

    await expect(
      asUser.mutation(api.categories.deleteCategory, { categoryId: id })
    ).rejects.toThrow("already archived");
  });

  test("blocks archiving another user's category", async () => {
    const { t, asUser } = await setupTestWithUser();
    const { asUserB } = await seedUserB(t);

    const id = await asUser.mutation(api.categories.createCategory, {
      name: "Groceries",
      type: "expense",
      color: "#FF5733",
      icon: "ShoppingCart",
    });

    await expect(
      asUserB.mutation(api.categories.deleteCategory, { categoryId: id })
    ).rejects.toThrow("Category not found");
  });
});

describe("unarchiveCategory", () => {
  test("restores an archived category", async () => {
    const { t, asUser } = await setupTestWithUser();

    const id = await asUser.mutation(api.categories.createCategory, {
      name: "Groceries",
      type: "expense",
      color: "#FF5733",
      icon: "ShoppingCart",
    });

    await asUser.mutation(api.categories.deleteCategory, { categoryId: id });
    await asUser.mutation(api.categories.unarchiveCategory, {
      categoryId: id,
    });

    const cat = await t.run(async (ctx) => ctx.db.get(id));
    expect(cat!.isArchived).toBe(false);
  });

  test("prevents unarchiving a non-archived category", async () => {
    const { asUser } = await setupTestWithUser();

    const id = await asUser.mutation(api.categories.createCategory, {
      name: "Groceries",
      type: "expense",
      color: "#FF5733",
      icon: "ShoppingCart",
    });

    await expect(
      asUser.mutation(api.categories.unarchiveCategory, { categoryId: id })
    ).rejects.toThrow("not archived");
  });
});

describe("getCategories", () => {
  test("returns only active categories by default", async () => {
    const { asUser } = await setupTestWithUser();

    await asUser.mutation(api.categories.createCategory, {
      name: "Active",
      type: "expense",
      color: "#FF5733",
      icon: "A",
    });

    const archivedId = await asUser.mutation(api.categories.createCategory, {
      name: "Archived",
      type: "expense",
      color: "#000000",
      icon: "B",
    });

    await asUser.mutation(api.categories.deleteCategory, {
      categoryId: archivedId,
    });

    const categories = await asUser.query(api.categories.getCategories, {});
    expect(categories).toHaveLength(1);
    expect(categories[0].name).toBe("Active");
  });

  test("filters by type when specified", async () => {
    const { asUser } = await setupTestWithUser();

    await asUser.mutation(api.categories.createCategory, {
      name: "Expense Cat",
      type: "expense",
      color: "#FF5733",
      icon: "A",
    });

    await asUser.mutation(api.categories.createCategory, {
      name: "Income Cat",
      type: "income",
      color: "#33FF57",
      icon: "B",
    });

    const expenses = await asUser.query(api.categories.getCategories, {
      type: "expense",
    });
    expect(expenses).toHaveLength(1);
    expect(expenses[0].name).toBe("Expense Cat");
  });

  test("includes archived when includeArchived is true", async () => {
    const { asUser } = await setupTestWithUser();

    await asUser.mutation(api.categories.createCategory, {
      name: "Active",
      type: "expense",
      color: "#FF5733",
      icon: "A",
    });

    const archivedId = await asUser.mutation(api.categories.createCategory, {
      name: "Archived",
      type: "expense",
      color: "#000000",
      icon: "B",
    });

    await asUser.mutation(api.categories.deleteCategory, {
      categoryId: archivedId,
    });

    const categories = await asUser.query(api.categories.getCategories, {
      includeArchived: true,
    });
    expect(categories).toHaveLength(2);
  });
});

describe("createDefaultCategories", () => {
  test("creates 8 default categories", async () => {
    const { asUser } = await setupTestWithUser();

    const result = await asUser.mutation(
      api.categories.createDefaultCategories,
      {}
    );
    expect(result.created).toBe(8);

    const categories = await asUser.query(api.categories.getCategories, {
      includeArchived: true,
    });
    expect(categories).toHaveLength(8);
  });

  test("prevents creating defaults when user already has categories", async () => {
    const { asUser } = await setupTestWithUser();

    await asUser.mutation(api.categories.createCategory, {
      name: "Existing",
      type: "expense",
      color: "#FF5733",
      icon: "X",
    });

    await expect(
      asUser.mutation(api.categories.createDefaultCategories, {})
    ).rejects.toThrow("already has categories");
  });
});
