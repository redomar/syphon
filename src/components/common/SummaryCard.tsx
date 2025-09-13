import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

export interface SummaryCardProps {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  value: string;
  prefix?: string;
}

export function SummaryCard({
  icon: Icon,
  iconColor,
  title,
  value,
  prefix,
}: SummaryCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${iconColor}`} />
          <div>
            <p className="text-sm text-neutral-600">{title}</p>
            <p className="text-2xl font-bold">
              {prefix && <span className={iconColor}>{prefix}</span>}
              {value}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
