import { classNames } from "@/lib/utils";

type BadgeVariant =
  | "imported"
  | "draft"
  | "review"
  | "approved"
  | "published"
  | "archived"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "default";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  imported: "bg-gray-100 text-gray-600",
  draft: "bg-blue-100 text-blue-700",
  review: "bg-amber-100 text-amber-700",
  approved: "bg-purple-100 text-purple-700",
  published: "bg-green-100 text-green-700",
  archived: "bg-gray-100 text-gray-400",
  success: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
  default: "bg-gray-100 text-gray-600",
};

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span
      className={classNames(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
