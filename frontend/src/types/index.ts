export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'RESTAURANT_ADMIN' | 'STAFF';
  restaurantId?: string;
  isActive: boolean;
  createdAt?: string;
}

export type RestaurantStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

export interface Restaurant {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  address?: string;
  phone?: string;
  logo?: string;
  /** Wide photo shown behind the restaurant name on the customer menu. */
  coverImage?: string;
  currency: string;
  telegramChatId?: string;
  /** Opening hours, "HH:mm" in the restaurant's timezone. */
  openingTime: string;
  closingTime: string;
  alwaysOpen: boolean;
  timezone?: string;
  /** Computed server-side on the public query only. */
  isOpenNow?: boolean;
  isActive: boolean;
  status: RestaurantStatus;
  rejectionReason?: string;
  createdAt?: string;
}

export interface MenuCategory {
  _id: string;
  restaurantId: string;
  name: string;
  order: number;
  isActive: boolean;
}

export interface MenuItem {
  _id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  /** The photo used wherever a single one is needed; mirrors images[0]. */
  imageUrl?: string;
  /** Every photo of the dish, first one leading. */
  images?: string[];
  tags: string[];
  isAvailable: boolean;
  isPopular: boolean;
  /** Computed server-side from the last 30 days of sales (public menu only). */
  isBestSeller?: boolean;
  trackQuantity: boolean;
  quantity: number;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';

// Chosen by the guest when they scan the QR; the kitchen packs take-out orders.
export type OrderType = 'DINE_IN' | 'TAKE_OUT';

export interface Order {
  _id: string;
  restaurantId: string;
  tableId: string;
  /** Null for a collection order phoned in - nobody is sitting anywhere. */
  tableNumber: number | null;
  items: OrderItem[];
  status: OrderStatus;
  orderType?: OrderType;
  totalAmount: number;
  customerNote?: string;
  /** Set when staff took the order over the phone. */
  customerName?: string;
  customerPhone?: string;
  /** When the caller said they would arrive; null for a walk-in order. */
  scheduledFor?: string | null;
  language: string;
  /** Staff collected payment; paid orders leave the kitchen board. */
  isPaid?: boolean;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// One dine-in visit at a table: groups every order placed between the first
// QR scan and staff closing the bill.
export interface TableSession {
  _id: string;
  tableNumber: number;
  status: 'OPEN' | 'CLOSED';
  totalAmount: number;
  orders: Order[];
  lastOrderAt: string;
  closedAt?: string;
  createdAt: string;
}

export interface Table {
  _id: string;
  restaurantId: string;
  number: number;
  name: string;
  qrCodeDataUrl: string;
  capacity: number;
  isActive: boolean;
  createdAt?: string;
}

export interface Feedback {
  _id: string;
  restaurantId: string;
  orderId?: string;
  rating: number;
  comment?: string;
  language: string;
  tableNumber: number;
  createdAt: string;
}

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

// Order status color map for MUI
export const statusColor: Record<OrderStatus, 'warning' | 'info' | 'success' | 'error' | 'default'> = {
  PENDING: 'warning',
  PREPARING: 'info',
  READY: 'success',
  SERVED: 'default',
  CANCELLED: 'error',
};

export const statusLabel: Record<OrderStatus, string> = {
  PENDING: 'Kutilmoqda',
  PREPARING: 'Tayyorlanmoqda',
  READY: 'Tayyor',
  SERVED: 'Berildi',
  CANCELLED: 'Bekor qilingan',
};
