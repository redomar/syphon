import { redirect } from "react-router";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Syphon - Personal Finance Tracker" },
    { name: "description", content: "Track your finances with Syphon" },
  ];
}

export function loader() {
  return redirect("/landing");
}
