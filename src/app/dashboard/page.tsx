import DashboardContent from "@/components/dashboard/DashboardContent";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { currentUser } from "@clerk/nextjs/server";

export default async function DashboardPage() {
  const user = await currentUser().catch(() => null);

  const userData = user
    ? {
        firstName: user.firstName,
      }
    : null;

  return (
    <ProtectedRoute>
      <DashboardContent user={userData} />
    </ProtectedRoute>
  );
}