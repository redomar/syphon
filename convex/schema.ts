import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    _id: v.string(),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    // ISO8601 formatted date string
    createdAt: v.string(),
    updatedAt: v.string(),
    timezone: v.string(),
  }),
});
