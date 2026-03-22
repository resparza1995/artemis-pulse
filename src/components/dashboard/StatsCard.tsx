import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "../ui/card";

type StatsCardProps = {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
};

export function StatsCard({ label, value, hint, icon: Icon }: StatsCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-start justify-between gap-4 p-4">
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {label}
          </p>
          <p className="font-display text-2xl font-semibold text-foreground">{value}</p>
          <p className="max-w-[16rem] text-sm leading-5 text-muted-foreground">{hint}</p>
        </div>
        <div className="app-icon-chip p-2.5">
          <Icon className="h-[18px] w-[18px]" />
        </div>
      </CardContent>
    </Card>
  );
}
