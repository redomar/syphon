import GoalsManager from "@/components/goals/GoalsManager";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import React from "react";

function Goals() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <GoalsManager />
      </div>
    </ProtectedRoute>
  );
}

export default Goals;
