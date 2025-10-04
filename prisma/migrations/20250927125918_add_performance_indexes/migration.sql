-- CreateIndex
CREATE INDEX "BudgetCategory_budgetId_categoryId_idx" ON "public"."BudgetCategory"("budgetId", "categoryId");

-- CreateIndex
CREATE INDEX "Category_userId_kind_idx" ON "public"."Category"("userId", "kind");

-- CreateIndex
CREATE INDEX "Category_userId_isArchived_idx" ON "public"."Category"("userId", "isArchived");

-- CreateIndex
CREATE INDEX "Debt_userId_isClosed_idx" ON "public"."Debt"("userId", "isClosed");

-- CreateIndex
CREATE INDEX "SavingsGoal_userId_isArchived_idx" ON "public"."SavingsGoal"("userId", "isArchived");

-- CreateIndex
CREATE INDEX "Transaction_userId_incomeSourceId_idx" ON "public"."Transaction"("userId", "incomeSourceId");

-- CreateIndex
CREATE INDEX "Transaction_userId_amount_idx" ON "public"."Transaction"("userId", "amount");
