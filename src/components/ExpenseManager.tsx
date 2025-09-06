'use client';
import React from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";

function ExpenseManager() {

  const [showImportForm, setShowImportForm] = React.useState(true);
  const fileRef = React.useRef<HTMLInputElement | null>(null);

  return (
    <div className="grid gap-6">
      <Card>
        <CardContent className="grid grid-cols-[1fr_auto] items-end w-full">
          <div>
            <h2 className="text-lg font-semibold">Expense Management</h2>
            <p className="text-sm text-neutral-500">
              Manage your expense drains, categories, and transactions. You can also import a CSV file of your expenses.
            </p>
          </div>
          <div>
            <Button className="btn">Import CSV</Button>
          </div>
        </CardContent>
      </Card>
      {showImportForm && (
        <Card>
          <CardContent className="grid gap-4">
            <h3 className="text-md font-semibold">Import Expenses from CSV</h3>
            <form className="grid gap-4">
              <div className="grid gap-2">
                <label htmlFor="csvFile" className="text-sm font-medium">
                  CSV File
                </label>
                <input
                  ref={fileRef}
                  type="file"
                  id="csvFile"
                  accept=".csv"
                  className="border border-neutral-700 rounded p-2 bg-neutral-800 text-sm"
                />
              </div>
              <div className="grid gap-2">
                {/* Header/Columns Format i.e "Date, Transaction"... */}
                <label htmlFor="headerFormat" className="text-sm font-medium">
                  Header/Columns Format
                </label>
                <input
                  type="text"
                  id="headerFormat"
                  defaultValue={"Date,Merchant Name,Description,Amount,Category,Notes,Account Provider,Account Name,Status,Sub Type"}
                  placeholder="e.g., Date, Transaction, Amount, Category"
                  className="border border-neutral-700 rounded p-2 bg-neutral-800 text-sm"
                />
              </div>
              {/* collumn to be date and column to be amount and column to be category */}
              <div className="grid gap-2">
                <label htmlFor="dateColumn" className="text-sm font-medium">
                  Date Column
                </label>
                <input
                  type="text"
                  id="dateColumn"
                  defaultValue={"Date"}
                  placeholder="e.g., Date"
                  className="border border-neutral-700 rounded p-2 bg-neutral-800 text-sm"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="amountColumn" className="text-sm font-medium">
                  Amount Column
                </label>
                <input
                  type="text"
                  id="amountColumn"
                  defaultValue={"Amount"}
                  placeholder="e.g., Amount"
                  className="border border-neutral-700 rounded p-2 bg-neutral-800 text-sm"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="categoryColumn" className="text-sm font-medium">
                  Category Column
                </label>
                <input
                  type="text"
                  id="categoryColumn"
                  defaultValue={"Category"}
                  placeholder="e.g., Category"
                  className="border border-neutral-700 rounded p-2 bg-neutral-800 text-sm"
                />
              </div>
              <Button type="submit" className="self-start mt-2">
                Import
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ExpenseManager;
