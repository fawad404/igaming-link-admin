"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

interface Category {
  _id: string;
  name: string;
}

interface ArticleFiltersProps {
  search: string;
  status: string;
  category: string;
  categories: Category[];
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onReset: () => void;
}

const STATUS_OPTIONS = [
  { value: "imported", label: "Imported" },
  { value: "ai-draft", label: "AI Draft" },
  { value: "needs-review", label: "Needs Review" },
  { value: "approved", label: "Approved" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

export function ArticleFilters({
  search,
  status,
  category,
  categories,
  onSearchChange,
  onStatusChange,
  onCategoryChange,
  onReset,
}: ArticleFiltersProps) {
  const hasFilters = !!(search || status || category);

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="flex-1 min-w-[180px]">
        <Input
          placeholder="Search by title…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="w-44">
        <Select
          options={STATUS_OPTIONS}
          value={status}
          placeholder="All statuses"
          onChange={(e) => onStatusChange(e.target.value)}
        />
      </div>
      <div className="w-44">
        <Select
          options={categories.map((c) => ({ value: c._id, label: c.name }))}
          value={category}
          placeholder="All categories"
          onChange={(e) => onCategoryChange(e.target.value)}
        />
      </div>
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onReset}>
          Reset
        </Button>
      )}
    </div>
  );
}
