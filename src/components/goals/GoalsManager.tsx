import React from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";

function GoalsManager() {
  return (
    <div className="grid gap-6">
      <Card>
        <CardContent className="grid grid-cols-[1fr_auto] items-end w-full">
          <div>
            <h2 className="text-lg font-semibold">Goals Management</h2>
            <p className="text-sn text-neutral-500">
              Manage your financial goals effectively.
            </p>
          </div>
          <div className="grid grid-flow-col auto-cols-max gap-2">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Goal
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default GoalsManager;
