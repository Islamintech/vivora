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
  currency: string;
  telegramChatId?: string;
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
  imageUrl?: string;
  allergens: string[];
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
  tableNumber: number;
  items: OrderItem[];
  status: OrderStatus;
  orderType?: OrderType;
  totalAmount: number;
  customerNote?: string;
  language: string;
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
