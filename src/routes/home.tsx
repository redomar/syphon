import type { Route } from "./+types/home";
import { Navigate } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Syphon - Personal Finance Tracker" },
    { name: "description", content: "Track your finances with Syphon" },
  ];
}

export default function Home() {
  return <Navigate to="/landing" replace />;
}
