import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { classNames } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: { value: number; label: string };
  loading?: boolean;
}

export function StatCard({ label, value, icon: Icon, iconColor = "text-primary", trend, loading }: StatCardProps) {
  if (loading) {
    return (
      <div className="rounded-xl bg-admin-card border border-admin-border shadow-sm p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-24 bg-admin-border rounded" />
          <div className="h-10 w-10 bg-admin-border rounded-lg" />
        </div>
        <div className="h-8 w-16 bg-admin-border rounded" />
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-admin-card border border-admin-border shadow-sm p-6 hover:scale-[1.01] transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-text-muted">{label}</span>
        <div className={classNames("flex h-10 w-10 items-center justify-center rounded-lg bg-admin-bg", iconColor)}>
          <Icon size={20} />
        </div>
      </div>
      <p className="text-3xl font-bold text-text-main">{value}</p>
      {trend && (
        <div className="mt-2 flex items-center gap-1">
          {trend.value >= 0 ? (
            <TrendingUp size={14} className="text-success" />
          ) : (
            <TrendingDown size={14} className="text-danger" />
          )}
          <span className={classNames("text-xs font-medium", trend.value >= 0 ? "text-success" : "text-danger")}>
            {trend.value >= 0 ? "+" : ""}{trend.value}%
          </span>
          <span className="text-xs text-text-muted">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
