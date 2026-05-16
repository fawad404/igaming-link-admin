import { classNames } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  className?: string;
}

export function Card({ children, header, className }: CardProps) {
  return (
    <div
      className={classNames(
        "rounded-xl bg-admin-card border border-admin-border shadow-sm",
        className
      )}
    >
      {header && (
        <div className="border-b border-admin-border px-6 py-4 font-semibold text-text-main">
          {header}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
