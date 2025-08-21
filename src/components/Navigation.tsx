import {
  PieChart,
  TrendingUp,
  DollarSign,
  Target,
  CreditCard,
} from "lucide-react";
import React from "react";

export default function Navigation({active}: {active: number}) {
  return (
    <nav className="space-y-2">
      {[
        { id: "overview", icon: PieChart, label: "FINANCIAL OVERVIEW" },
        { id: "income", icon: TrendingUp, label: "INCOME TRACKER" },
        { id: "expenses", icon: DollarSign, label: "EXPENSE TRACKER" },
        { id: "savings", icon: Target, label: "SAVINGS GOALS" },
        { id: "debt", icon: CreditCard, label: "DEBT MANAGEMENT" },
      ].map((item, idx) => (
        <button
          key={item.id}
          className={`${active === idx ? "bg-orange-500 text-white hover:font-bold" : "text-neutral-400 hover:bg-neutral-800"} flex w-full cursor-pointer items-center gap-3 p-3 text-sm font-medium hover:text-white`}
        >
          <item.icon className="size-4" />
          {item.label}
        </button>
      ))}
    </nav>
  );
}
