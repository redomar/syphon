import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import React from "react";

function Income() {
  return (
    <div className="uppercase">
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
              <Button className="">
                <Plus className="" />
                Add Income
              </Button>
            </div>
          </CardContent>
        </Card>
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
              <Button variant="secondary" className="w-24 border">
                Cancel
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Income;
