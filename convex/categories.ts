import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";

/**
 * Helper function to get the current authenticated user
 */
async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

/**
 * Creates a new category for the authenticated user
 */
export const createCategory = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("income"), v.literal("expense")),
    color: v.string(),
    icon: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    // Check if a category with the same name already exists (including archived ones)
    const existingCategories = await ctx.db
      .query("categories")
      .withIndex("by_user_and_type", (q) =>
        q.eq("userId", user._id).eq("type", args.type)
      )
      .collect();

    if (
      existingCategories.some(
        (cat) => cat.name.toLowerCase() === args.name.toLowerCase()
      )
    ) {
      throw new Error("Category with this name already exists");
    }

    const now = Date.now();

    const categoryId = await ctx.db.insert("categories", {
      name: args.name,
      type: args.type,
      color: args.color,
      icon: args.icon,
      userId: user._id,
      createdAt: now,
      updatedAt: now,
      isArchived: false,
      isDefault: false,
    });

    return categoryId;
  },
});

/**
 * Updates an existing category for the authenticated user
 */
export const updateCategory = mutation({
  args: {
    categoryId: v.id("categories"),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const category = await ctx.db.get(args.categoryId);

    if (!category || category.userId !== user._id) {
      throw new Error("Category not found");
    }

    // Only check for duplicate names if name is being updated
    if (args.name) {
      const existingCategories = await ctx.db
        .query("categories")
        .withIndex("by_user_and_type", (q) =>
          q.eq("userId", user._id).eq("type", category.type)
        )
        .collect();

      const duplicate = existingCategories.find(
        (cat) =>
          cat._id !== args.categoryId &&
          cat.name.toLowerCase() === args.name!.toLowerCase()
      );

      if (duplicate) {
        if (duplicate.isArchived) {
          throw new Error(
            "Category with this name already exists but is archived. Please choose a different name or unarchive the existing category."
          );
        }
        throw new Error("Category with this name already exists");
      }
    }

    await ctx.db.patch(args.categoryId, {
      ...(args.name && { name: args.name }),
      ...(args.color && { color: args.color }),
      ...(args.icon && { icon: args.icon }),
      updatedAt: Date.now(),
    });

    return args.categoryId;
  },
});

/**
 * Soft deletes a category by setting isArchived to true
 */
export const deleteCategory = mutation({
  args: {
    categoryId: v.id("categories"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    const category = await ctx.db.get(args.categoryId);

    if (!category || category.userId !== user._id) {
      throw new Error("Category not found");
    }

    if (category.isArchived) {
      throw new Error("Category is already archived");
    }

    await ctx.db.patch(args.categoryId, {
      isArchived: true,
      updatedAt: Date.now(),
    });

    return args.categoryId;
  },
});

/**
 * Gets categories for the authenticated user with optional filtering
 * All queries are fully indexed for maximum performance
 */
export const getCategories = query({
  args: {
    type: v.optional(v.union(v.literal("income"), v.literal("expense"))),
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);

    let categories;

    // No type filter, only active categories - use by_user_active index
    if (!args.type && !args.includeArchived) {
      categories = await ctx.db
        .query("categories")
        .withIndex("by_user_active", (q) =>
          q.eq("userId", user._id).eq("isArchived", false)
        )
        .collect();
    }
    // No type filter, include archived - use by_user index
    else if (!args.type && args.includeArchived) {
      categories = await ctx.db
        .query("categories")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();
    }
    // With type filter, only active - use by_user_type_active index (NEW!)
    else if (args.type && !args.includeArchived) {
      categories = await ctx.db
        .query("categories")
        .withIndex("by_user_type_active", (q) =>
          q.eq("userId", user._id).eq("type", args.type!).eq("isArchived", false)
        )
        .collect();
    }
    // With type filter, include archived - use by_user_and_type index
    else {
      categories = await ctx.db
        .query("categories")
        .withIndex("by_user_and_type", (q) =>
          q.eq("userId", user._id).eq("type", args.type!)
        )
        .collect();
    }

    return categories.toSorted((a, b) => a.name.localeCompare(b.name));
  },
});
