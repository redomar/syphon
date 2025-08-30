import { Card, CardContent } from "@/components/ui/card";
import React from "react";

function Income() {
  return <div>
    <div className="space-y-6">
        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold">Income</h2>
            <p className="text-sm text-neutral-500">Manage your income sources and amounts.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h3 className="text-md font-semibold">Add New Income Source</h3>
            <form className="flex flex-col space-y-4">
              <input type="text" placeholder="Source" className="border p-2" />
              <input type="number" placeholder="Amount" className="border p-2" />
              <button type="submit" className="bg-blue-500 text-white p-2">Add</button>
            </form>
          </CardContent>
        </Card>
    </div>
  </div>;
}

export default Income;
