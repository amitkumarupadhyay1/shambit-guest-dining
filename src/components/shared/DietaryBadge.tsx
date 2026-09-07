import { cn } from "@/lib/utils";

const config: Record<string, { color: string; bg: string; label: string }> = {
  VEG: { color: "text-green-700", bg: "bg-green-100", label: "Veg" },
  NON_VEG: { color: "text-red-700", bg: "bg-red-100", label: "Non-Veg" },
  VEGAN: { color: "text-emerald-700", bg: "bg-emerald-100", label: "Vegan" },
  EGG: { color: "text-amber-700", bg: "bg-amber-100", label: "Egg" },
};

const dotColor: Record<string, string> = {
  VEG: "bg-green-600",
  NON_VEG: "bg-red-600",
  VEGAN: "bg-emerald-600",
  EGG: "bg-amber-500",
};

export function DietaryBadge({ type, showLabel = false }: { type: string; showLabel?: boolean }) {
  const c = config[type];
  if (!c) return null;
  if (showLabel) {
    return (
      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", c.bg, c.color)}>
        <span className={cn("w-2 h-2 rounded-full", dotColor[type])} />
        {c.label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 border-2 rounded" style={{ borderColor: type === "VEG" || type === "VEGAN" ? "#16a34a" : type === "EGG" ? "#d97706" : "#dc2626" }}>
      <span className={cn("w-2.5 h-2.5 rounded-full", dotColor[type])} />
    </span>
  );
}
