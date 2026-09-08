"use client";

import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSessionStore } from "@/stores/useSessionStore";
import { useCartStore } from "@/stores/useCartStore";
import { PageTransition } from "@/components/shared/PageTransition";
import { DietaryBadge } from "@/components/shared/DietaryBadge";
import { MenuItemSkeleton } from "@/components/shared/LoadingSkeleton";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { api } from "@/lib/api";
import {
  Search,
  X,
  Bell,
  Minus,
  Plus,
  ChefHat,
  Star,
  Clock,
  AlertTriangle,
  ChevronDown,
  Sparkles,
  ScanLine,
  UtensilsCrossed,
} from "lucide-react";
import type { MenuItem, MenuItemVariant, MenuItemModifier } from "@/types";

// ─── Filter Chips ─────────────────────────────────────────────
type FilterKey = "VEG" | "NON_VEG" | "VEGAN" | "BESTSELLER" | "CHEFS_SPECIAL";
type SortKey = "FEATURED" | "PRICE_LOW" | "PRICE_HIGH" | "FASTEST";

const FILTER_CHIPS: {
  key: FilterKey | "COMBO";
  label: string;
  icon?: string;
  color: string;
}[] = [
  {
    key: "VEG",
    label: "Veg",
    icon: "🟢",
    color: "bg-green-100 text-green-800 border-green-300",
  },
  {
    key: "NON_VEG",
    label: "Non-Veg",
    icon: "🔴",
    color: "bg-red-100 text-red-800 border-red-300",
  },
  {
    key: "VEGAN",
    label: "Vegan",
    icon: "🌱",
    color: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  {
    key: "BESTSELLER",
    label: "Bestsellers",
    icon: "⭐",
    color: "bg-amber-100 text-amber-800 border-amber-300",
  },
  {
    key: "CHEFS_SPECIAL",
    label: "Chef's Special",
    icon: "👨‍🍳",
    color: "bg-purple-100 text-purple-800 border-purple-300",
  },
  {
    key: "COMBO",
    label: "Combo Meals",
    icon: "🍱",
    color: "bg-orange-100 text-orange-800 border-orange-300",
  },
];

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "FEATURED", label: "Featured" },
  { key: "FASTEST", label: "Fastest" },
  { key: "PRICE_LOW", label: "Price: Low to High" },
  { key: "PRICE_HIGH", label: "Price: High to Low" },
];

// ─── Item Detail Bottom Sheet ─────────────────────────────────
function ItemDetailSheet({
  item,
  onClose,
  onAddToCart,
}: {
  item: MenuItem;
  onClose: () => void;
  onAddToCart: (
    item: MenuItem,
    qty: number,
    variant?: MenuItemVariant,
    modifiers?: MenuItemModifier[],
    instructions?: string,
  ) => void;
}) {
  const [qty, setQty] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<
    MenuItemVariant | undefined
  >(item.variants.length > 0 ? item.variants[0] : undefined);
  const [selectedModifiers, setSelectedModifiers] = useState<Set<number>>(
    new Set(),
  );
  const [instructions, setInstructions] = useState("");

  const basePrice = selectedVariant
    ? parseFloat(selectedVariant.price)
    : parseFloat(item.price);
  const modifierTotal = item.modifiers
    .filter((m) => selectedModifiers.has(m.id))
    .reduce((sum, m) => sum + parseFloat(m.price_adjustment), 0);
  const totalPrice = (basePrice + modifierTotal) * qty;

  const handleAdd = () => {
    const mods = item.modifiers.filter((m) => selectedModifiers.has(m.id));
    onAddToCart(
      item,
      qty,
      selectedVariant,
      mods.length > 0 ? mods : undefined,
      instructions || undefined,
    );
    onClose();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-h-[85vh] overflow-y-auto"
      >
        {/* Hero Image */}
        {item.image && (
          <div className="w-full h-48 bg-slate-100">
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <DietaryBadge type={item.dietary_type} />
                {item.is_bestseller && (
                  <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                    Bestseller
                  </span>
                )}
                {item.is_chefs_special && (
                  <span className="text-[10px] uppercase font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                    Chef&apos;s Special
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-slate-900">{item.name}</h2>
              <p className="text-emerald-600 font-semibold mt-1">
                {formatCurrency(item.price)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Description */}
          {item.description && (
            <p className="text-slate-500 text-sm mb-4">{item.description}</p>
          )}

          {/* Meta info */}
          <div className="flex gap-4 mb-6 text-xs text-slate-500">
            {item.prep_time_minutes && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {item.prep_time_minutes} min
              </span>
            )}
            {item.allergens.length > 0 && (
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />{" "}
                {item.allergens.join(", ")}
              </span>
            )}
          </div>

          {/* Variants */}
          {item.variants.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-slate-800 mb-3">
                Choose Size
              </h3>
              <div className="space-y-2">
                {item.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                      selectedVariant?.id === v.id
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="font-medium text-slate-800">{v.name}</span>
                    <span className="font-semibold text-slate-700">
                      {formatCurrency(v.price)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Modifiers */}
          {item.modifiers.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-slate-800 mb-3">
                Customise
              </h3>
              <div className="space-y-2">
                {item.modifiers.map((m) => {
                  const isSelected = selectedModifiers.has(m.id);
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        const next = new Set(selectedModifiers);
                        if (isSelected) next.delete(m.id);
                        else next.add(m.id);
                        setSelectedModifiers(next);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? "bg-emerald-500 border-emerald-500"
                              : "border-slate-300"
                          }`}
                        >
                          {isSelected && (
                            <span className="text-white text-xs">✓</span>
                          )}
                        </div>
                        <span className="font-medium text-slate-800">
                          {m.name}
                        </span>
                      </div>
                      <span className="text-slate-500 text-sm">
                        +{formatCurrency(m.price_adjustment)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Special Instructions */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-slate-800 mb-2">
              Special Instructions
            </h3>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g., Less spicy, no onions..."
              className="w-full p-3 border-2 border-slate-200 rounded-xl text-sm resize-none h-20 outline-none focus:border-emerald-500 transition-colors"
              maxLength={255}
            />
          </div>

          {/* Quantity & Add */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-slate-100 rounded-full p-1">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-700"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-bold text-lg w-6 text-center">{qty}</span>
              <button
                onClick={() => setQty(Math.min(20, qty + 1))}
                className="w-10 h-10 rounded-full bg-emerald-500 shadow-sm flex items-center justify-center text-white"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <Button className="flex-1 py-4 text-base" onClick={handleAdd}>
              Add to Cart — {formatCurrency(totalPrice)}
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ─── Quantity Stepper (inline on menu card) ───────────────────
function QuantityStepper({ itemId }: { itemId: number }) {
  const qty = useCartStore((s) => s.getItemQuantity(itemId));
  const updateQuantity = useCartStore((s) => s.updateQuantity);

  if (qty === 0) return null;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex items-center gap-2 bg-emerald-50 border-2 border-emerald-200 rounded-full p-0.5"
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          updateQuantity(itemId, qty - 1);
        }}
        className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-700"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <span className="font-bold text-sm w-5 text-center text-emerald-800">
        {qty}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          updateQuantity(itemId, qty + 1);
        }}
        className="w-8 h-8 rounded-full bg-emerald-500 shadow-sm flex items-center justify-center text-white"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

const emptySubscribe = () => () => {};

// ─── Main Menu Page ───────────────────────────────────────────
export default function MenuPage() {
  const router = useRouter();
  const { restaurant, table, menuItems, categories, guestToken } =
    useSessionStore();
  const { addItem, getTotalItems, getTotalPrice, getItemQuantity } =
    useCartStore();

  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Set<FilterKey | "COMBO">>(
    new Set(),
  );
  const [sortBy, setSortBy] = useState<SortKey>("FEATURED");
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [callingCaptain, setCallingCaptain] = useState(false);
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  // Refs for scroll-spy
  const categoryRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const categoryBarRef = useRef<HTMLDivElement>(null);

  // Sort categories by display_order
  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.display_order - b.display_order),
    [categories],
  );

  const selectedCategoryId =
    activeCategoryId ?? sortedCategories[0]?.id ?? null;

  // Scroll-spy: IntersectionObserver to highlight active category on scroll
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    categoryRefs.current.forEach((el, categoryId) => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveCategoryId(categoryId);
            }
          });
        },
        { rootMargin: "-160px 0px -60% 0px", threshold: 0 },
      );
      observer.observe(el);
      observers.push(observer);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [menuItems, sortedCategories]);

  // Filter + search logic
  const filteredItems = useMemo(() => {
    let items = menuItems.filter((item) => item.is_available);

    // Text search (fuzzy)
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.category_name?.toLowerCase().includes(q),
      );
    }

    // Dietary filters
    if (activeFilters.has("VEG"))
      items = items.filter((i) => i.dietary_type === "VEG");
    if (activeFilters.has("NON_VEG"))
      items = items.filter((i) => i.dietary_type === "NON_VEG");
    if (activeFilters.has("VEGAN"))
      items = items.filter((i) => i.dietary_type === "VEGAN");
    if (activeFilters.has("BESTSELLER"))
      items = items.filter((i) => i.is_bestseller);
    if (activeFilters.has("CHEFS_SPECIAL"))
      items = items.filter((i) => i.is_chefs_special);
    if (activeFilters.has("COMBO" as FilterKey))
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes("combo") ||
          i.category_name?.toLowerCase().includes("combo"),
      );

    return [...items].sort((a, b) => {
      if (sortBy === "PRICE_LOW") return Number(a.price) - Number(b.price);
      if (sortBy === "PRICE_HIGH") return Number(b.price) - Number(a.price);
      if (sortBy === "FASTEST")
        return (a.prep_time_minutes ?? 999) - (b.prep_time_minutes ?? 999);
      return (
        Number(b.is_bestseller) - Number(a.is_bestseller) ||
        Number(b.is_chefs_special) - Number(a.is_chefs_special)
      );
    });
  }, [menuItems, search, activeFilters, sortBy]);

  // Group filtered items by category
  const groupedItems = useMemo(() => {
    const groups: Map<number, MenuItem[]> = new Map();
    for (const cat of sortedCategories) {
      const catItems = filteredItems.filter((i) => i.category_id === cat.id);
      if (catItems.length > 0) groups.set(cat.id, catItems);
    }
    // Items without category
    const uncategorized = filteredItems.filter((i) => i.category_id === null);
    if (uncategorized.length > 0) groups.set(-1, uncategorized);
    return groups;
  }, [filteredItems, sortedCategories]);

  const toggleFilter = (key: FilterKey | "COMBO") => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const scrollToCategory = (categoryId: number) => {
    setActiveCategoryId(categoryId);
    const el = categoryRefs.current.get(categoryId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleCallCaptain = async () => {
    if (!guestToken || callingCaptain) return;
    setCallingCaptain(true);
    try {
      await api.callCaptain(guestToken);
    } catch {
      // silently handle
    } finally {
      setTimeout(() => setCallingCaptain(false), 3000);
    }
  };

  const handleAddItem = useCallback(
    (item: MenuItem) => {
      if (item.variants.length > 0 || item.modifiers.length > 0) {
        setSelectedItem(item);
      } else {
        addItem(item);
      }
    },
    [addItem],
  );

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 pt-20 space-y-4">
        {[...Array(6)].map((_, i) => (
          <MenuItemSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!restaurant || !table || !guestToken) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center text-center">
        <div className="max-w-sm rounded-3xl bg-white border border-slate-100 shadow-sm p-8">
          <ScanLine className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            Scan your table QR to begin
          </h1>
          <p className="text-sm text-slate-500">
            Your table details are needed before we can show the menu.
          </p>
        </div>
      </div>
    );
  }

  if (menuItems.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center text-center">
        <div className="max-w-sm rounded-3xl bg-white border border-slate-100 shadow-sm p-8">
          <UtensilsCrossed className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            Menu is being prepared
          </h1>
          <p className="text-sm leading-6 text-slate-500">
            There are no items available to order right now. Please ask a team
            member for assistance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-slate-50 pb-[calc(8rem+env(safe-area-inset-bottom))]">
        {/* ── Sticky Header ── */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-xl z-40 border-b border-slate-100">
          {/* Row 1: Restaurant info + Call Captain */}
          <div className="flex justify-between items-center px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 gap-3">
            <div className="flex items-center gap-3">
              {restaurant.logo ? (
                <img
                  src={restaurant.logo}
                  alt="Logo"
                  className="w-10 h-10 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="w-10 h-10 object-contain"
                />
              )}
              <div className="min-w-0">
                <h1 className="font-bold text-slate-900 leading-tight truncate">
                  {restaurant.name}
                </h1>
                <p className="text-xs font-medium text-slate-500">
                  Table {table?.number} · Order at your pace
                </p>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleCallCaptain}
              disabled={callingCaptain}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
                callingCaptain
                  ? "bg-amber-100 text-amber-700"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Bell className="w-4 h-4" />
              {callingCaptain ? "Request sent" : "Need help?"}
            </motion.button>
          </div>

          {/* Row 2: Search */}
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search for biryani, paneer, drinks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-10 py-3 bg-slate-100 rounded-2xl outline-none text-base placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/30 focus:bg-white transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Row 3: Filter Chips */}
          <div className="px-4 pb-3 flex gap-2 overflow-x-auto hide-scrollbar">
            {FILTER_CHIPS.map((chip) => {
              const active = activeFilters.has(chip.key);
              return (
                <motion.button
                  key={chip.key}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleFilter(chip.key)}
                  className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    active
                      ? chip.color + " border-current"
                      : "bg-white border-slate-200 text-slate-600"
                  }`}
                >
                  {chip.icon && <span>{chip.icon}</span>}
                  {chip.label}
                </motion.button>
              );
            })}
          </div>

          <div className="px-4 pb-3 flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-slate-500 whitespace-nowrap">
              {filteredItems.length}{" "}
              {filteredItems.length === 1 ? "dish" : "dishes"}
            </p>
            <label className="relative flex items-center">
              <span className="sr-only">Sort dishes</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortKey)}
                className="appearance-none bg-slate-100 text-slate-700 text-xs font-bold pl-3 pr-8 py-2 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 w-3.5 h-3.5 text-slate-500" />
            </label>
          </div>

          {/* Row 4: Category Tabs */}
          {sortedCategories.length > 1 && (
            <div
              ref={categoryBarRef}
              className="px-4 pb-2 flex gap-1 overflow-x-auto hide-scrollbar border-t border-slate-100 pt-2"
            >
              {sortedCategories
                .filter((c) => groupedItems.has(c.id))
                .map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => scrollToCategory(cat.id)}
                    className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      selectedCategoryId === cat.id
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cat.icon ? `${cat.icon} ` : ""}
                    {cat.name}
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* ── Menu Items grouped by Category ── */}
        <div className="px-4 pt-5 space-y-8 max-w-2xl mx-auto">
          {sortedCategories
            .filter((c) => groupedItems.has(c.id))
            .map((category) => (
              <div
                key={category.id}
                ref={(el) => {
                  if (el) categoryRefs.current.set(category.id, el);
                }}
                className="scroll-mt-48"
              >
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  {category.icon && <span>{category.icon}</span>}
                  {category.name}
                  <span className="text-sm font-normal text-slate-400">
                    ({groupedItems.get(category.id)?.length})
                  </span>
                </h2>

                <div className="space-y-3">
                  {groupedItems.get(category.id)?.map((item) => {
                    const itemQty = getItemQuantity(item.id);

                    return (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-3 p-3.5 min-h-32 bg-white rounded-3xl shadow-sm border border-slate-100 active:scale-[0.99] transition-all hover:shadow-md"
                        onClick={() => {
                          if (
                            item.variants.length > 0 ||
                            item.modifiers.length > 0 ||
                            item.description
                          ) {
                            setSelectedItem(item);
                          }
                        }}
                      >
                        {/* Left: Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <DietaryBadge type={item.dietary_type} />
                            {item.spice_level > 0 && (
                              <span className="text-[10px] text-red-500 font-bold">
                                {"🌶️".repeat(item.spice_level)}
                              </span>
                            )}
                            {item.is_bestseller && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] uppercase font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                                <Star className="w-2.5 h-2.5" /> Bestseller
                              </span>
                            )}
                            {item.is_chefs_special && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] uppercase font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                                <ChefHat className="w-2.5 h-2.5" /> Special
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-slate-900 leading-tight mb-1">
                            {item.name}
                          </h3>
                          <p className="font-bold text-emerald-700 text-sm mb-1.5">
                            {formatCurrency(item.price)}
                          </p>
                          {item.allergens && item.allergens.length > 0 && (
                            <p className="text-[10px] text-amber-600 mb-1 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Contains:{" "}
                              {item.allergens.join(", ")}
                            </p>
                          )}
                          {item.description && (
                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                              {item.description}
                            </p>
                          )}
                          {item.variants.length > 0 && (
                            <p className="text-xs text-emerald-600 font-medium mt-1">
                              Customisable
                            </p>
                          )}
                        </div>

                        {/* Right: Image + Add/Stepper */}
                        <div className="flex flex-col items-center gap-2 flex-shrink-0">
                          {item.image ? (
                            <div className="w-[92px] h-[92px] rounded-2xl overflow-hidden bg-slate-100 shadow-sm">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>
                          ) : (
                            <div className="w-[92px] h-[80px] rounded-2xl bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
                              <span className="text-3xl opacity-30">🍽️</span>
                            </div>
                          )}

                          {/* Add / Qty Stepper */}
                          <div
                            className="-mt-4 relative z-10"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {itemQty > 0 ? (
                              <QuantityStepper itemId={item.id} />
                            ) : (
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleAddItem(item)}
                                className="min-h-10 px-5 py-1.5 bg-white border-2 border-emerald-500 text-emerald-600 font-bold text-sm rounded-xl shadow-md hover:bg-emerald-50 transition-colors"
                              >
                                ADD
                              </motion.button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}

          {/* Uncategorized items */}
          {groupedItems.has(-1) && (
            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-4">
                Other Items
              </h2>
              <div className="space-y-3">
                {groupedItems.get(-1)?.map((item) => {
                  const itemQty = getItemQuantity(item.id);
                  return (
                    <div
                      key={item.id}
                      className="flex gap-3 p-4 bg-white rounded-2xl shadow-sm border border-slate-100"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <DietaryBadge type={item.dietary_type} />
                        </div>
                        <h3 className="font-semibold text-slate-900">
                          {item.name}
                        </h3>
                        <p className="font-medium text-emerald-700 text-sm">
                          {formatCurrency(item.price)}
                        </p>
                      </div>
                      <div
                        className="flex flex-col items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {itemQty > 0 ? (
                          <QuantityStepper itemId={item.id} />
                        ) : (
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleAddItem(item)}
                            className="px-6 py-1.5 bg-white border-2 border-emerald-500 text-emerald-600 font-bold text-sm rounded-lg shadow-md"
                          >
                            ADD
                          </motion.button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* No results */}
          {filteredItems.length === 0 && (
            <div className="text-center py-14 px-6 bg-white rounded-3xl border border-slate-100">
              <Sparkles className="w-9 h-9 text-amber-500 mx-auto mb-4" />
              <p className="text-slate-700 font-bold">No dishes found</p>
              <p className="text-slate-400 text-sm mt-1">
                Try another search or clear your filters.
              </p>
              {(search || activeFilters.size > 0) && (
                <button
                  onClick={() => {
                    setSearch("");
                    setActiveFilters(new Set());
                  }}
                  className="mt-4 text-emerald-600 font-semibold text-sm"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Floating Cart Bar ── */}
        <AnimatePresence>
          {totalItems > 0 && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 right-4 z-50"
            >
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push("/cart")}
                className="w-full flex justify-between items-center py-4 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-xl shadow-emerald-900/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <motion.span
                    key={totalItems}
                    initial={{ scale: 1.5 }}
                    animate={{ scale: 1 }}
                    className="bg-emerald-700 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                  >
                    {totalItems}
                  </motion.span>
                  <span className="font-semibold">
                    {totalItems === 1 ? "1 item" : `${totalItems} items`} · View
                    Cart
                  </span>
                </div>
                <motion.span
                  key={totalPrice}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  className="font-bold text-lg"
                >
                  {formatCurrency(totalPrice)} →
                </motion.span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Item Detail Bottom Sheet ── */}
        <AnimatePresence>
          {selectedItem && (
            <ItemDetailSheet
              item={selectedItem}
              onClose={() => setSelectedItem(null)}
              onAddToCart={(item, qty, variant, mods, instructions) => {
                addItem(item, qty, variant, mods, instructions);
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
