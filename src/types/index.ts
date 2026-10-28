export interface Restaurant {
  id: number;
  name: string;
  hotel_name: string;
  address: string;
  welcome_message: string;
  service_instructions?: string;
  cover_image: string | null;
  logo: string | null;
  accent_color: string;
  payment_settings: PaymentSettings;
}

export interface PaymentSettings {
  accept_cash: boolean;
  accept_upi: boolean;
  upi_id: string;
  upi_merchant_name: string;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
  display_order: number;
}

export interface MenuItemVariant {
  id: number;
  name: string;
  price: string;
}

export interface MenuItemModifier {
  id: number;
  name: string;
  price_adjustment: string;
}

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  image: string | null;
  price: string;
  category_id: number | null;
  category_name: string | null;
  dietary_type: "VEG" | "NON_VEG" | "VEGAN" | "EGG" | "";
  spice_level: number;
  is_available: boolean;
  is_bestseller: boolean;
  is_chefs_special: boolean;
  allergens: string[];
  prep_time_minutes: number | null;
  variants: MenuItemVariant[];
  modifiers: MenuItemModifier[];
  modifier_groups?: Array<{
    id: number;
    name: string;
    min_selections: number;
    max_selections: number;
    modifiers: MenuItemModifier[];
  }>;
}

export interface OrderItem {
  name?: string;
  variant_name?: string | null;
  id: number;
  menu_item: number;
  quantity: number;
  unit_price: string;
  status: "PENDING" | "DELIVERED" | "CANCELLED";
}

export interface Order {
  id: number;
  lifecycle:
    | "UNAPPROVED"
    | "NEW"
    | "ACCEPTED"
    | "PREPARING"
    | "READY"
    | "DELIVERED"
    | "COMPLETED"
    | "CANCELLED";
  items: OrderItem[];
}

export interface Session {
  order_type?: string;
  room_number?: string | null;
  guest_name?: string | null;
  id: number;
  status: "OPEN" | "BILL_REQUESTED" | "PAID" | "CLOSED";
  requested_payment_method: string | null;
  active_orders: Order[];
}

export interface TableInfo {
  id: number;
  number: string;
}

export interface ScanResponse {
  context_type?: "DINE_IN" | "ROOM_SERVICE";
  service_available?: boolean;
  room?: TableInfo;
  guest_token: string;
  restaurant: Restaurant;
  table: TableInfo;
  session: Session | null;
  ordering_enabled: boolean;
  can_start_session: boolean;
  menu_items: MenuItem[];
  categories: Category[];
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  selectedVariant?: MenuItemVariant;
  selectedModifiers?: MenuItemModifier[];
  specialInstructions?: string;
}

export interface BillSummary {
  restaurant: { name: string; address: string; logo: string | null };
  table_number: string;
  session_id: number;
  items: {
    name: string;
    variant: string | null;
    quantity: number;
    unit_price: string;
    line_total: string;
  }[];
  subtotal: string;
  taxes: { name: string; rate: string; amount: string }[];
  tax_total: string;
  grand_total: string;
  status: string;
  created_at: string | null;
}
