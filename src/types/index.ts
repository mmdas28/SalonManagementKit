export interface Customer {
  id?: number;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'no-show';

export interface Appointment {
  id?: number;
  customer_id: number;
  date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AppointmentService {
  id?: number;
  appointment_id: number;
  service_id: number;
  quantity: number;
}

export interface Service {
  id?: number;
  name: string;
  price: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id?: number;
  name: string;
  price: number;
  sku?: string;
  min_stock_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface Inventory {
  id?: number;
  product_id: number;
  quantity: number;
  updated_at: string;
}

export type InventoryLogReason = 'sale' | 'restock' | 'adjustment';

export interface InventoryLog {
  id?: number;
  product_id: number;
  change_amount: number;
  reason: InventoryLogReason;
  receipt_id?: number;
  notes?: string;
  created_at: string;
}

export interface Receipt {
  id?: number;
  customer_id: number;
  appointment_id?: number;
  timestamp: string;
  subtotal: number;
  tip: number;
  total: number;
  created_at: string;
}

export type ReceiptItemType = 'service' | 'product';

export interface ReceiptItem {
  id?: number;
  receipt_id: number;
  item_type: ReceiptItemType;
  item_id: number;
  name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface CartItem {
  type: ReceiptItemType;
  id: number;
  name: string;
  price: number;
  quantity: number;
}
