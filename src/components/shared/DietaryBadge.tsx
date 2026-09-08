import { cn } from "@/lib/utils";

const config: Record<string, { color: string; bg: string; label: string }> = {
  VEG: { color: "text-emerald-700", bg: "bg-emerald-100", label: "Veg" },
  NON_VEG: { color: "text-red-700", bg: "bg-red-100", label: "Non-Veg" },
  VEGAN: { color: "text-emerald-700", bg: "bg-emerald-100", label: "Vegan" },
  EGG: { color: "text-amber-700", bg: "bg-amber-100", label: "Egg" },
};

const dotColor: Record<string, string> = {
  VEG: "bg-emerald-500",
  NON_VEG: "bg-red-600",
  VEGAN: "bg-emerald-600",
  EGG: "bg-amber-500",
};

export function DietaryBadge({
  type,
  showLabel = false,
}: {
  type: string;
  showLabel?: boolean;
}) {
  const c = config[type];
  if (!c) return null;
  if (showLabel) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
          c.bg,
          c.color,
        )}
      >
        <span className={cn("w-1.5 h-1.5 rounded-full", dotColor[type])} />
        {c.label}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center w-[18px] h-[18px] border-[1.5px] rounded-sm",
      )}
      style={{
        borderColor:
          type === "VEG" || type === "VEGAN"
            ? "#10b981"
            : type === "EGG"
              ? "#d97706"
              : "#dc2626",
      }}
    >
      <span className={cn("w-2 h-2 rounded-full", dotColor[type])} />
    </span>
  );
}
