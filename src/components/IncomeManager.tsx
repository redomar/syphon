"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import React from "react";

function IncomeManager() {
  const [showAddition, setShowAddition] = React.useState(false);

  const handleAddIncomeClick = () => {
    setShowAddition(true);
  };

  const handleHideAddition = (hidden: boolean) => {
    if (hidden) {
      setShowAddition(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex items-end w-full">
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Income</h2>
            <p className="text-sm text-neutral-500">
              Manage your income sources and amounts.
            </p>
          </div>
          <div>
            <Button onClick={handleAddIncomeClick} className="">
              <Plus className="" />
              Add Income
            </Button>
          </div>
        </CardContent>
      </Card>

      {showAddition && (
        <Card>
          <CardContent>
            <h3 className="text-md font-semibold">Add New Income Source</h3>
            <form className="flex flex-row space-x-4 items-end w-full">
              <div className="flex flex-col flex-1">
                <label className="text-sm text-neutral-600 mb-1">Source</label>
                <input
                  type="text"
                  placeholder="Source"
                  className="border text-sm p-2 w-full"
                />
              </div>
              <div className="flex flex-col flex-1">
                <label className="text-sm text-neutral-600 mb-1">Amount</label>
                <input
                  type="number"
                  placeholder="Amount"
                  className="border text-sm p-2 w-full"
                />
              </div>
              <div className="flex flex-col flex-1">
                <label className="text-sm text-neutral-600 mb-1">Date</label>
                <input type="date" className="border text-sm p-2 w-full" />
              </div>
              <Button type="submit" className="w-24 border">
                Add
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-24 border"
                onClick={() => handleHideAddition(true)}
              >
                Cancel
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default IncomeManager;
