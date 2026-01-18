export const DB_NAME = 'GhazlSalonDB';
export const DB_VERSION = 1;

export const STORES = {
  CUSTOMERS: 'customers',
  APPOINTMENTS: 'appointments',
  APPOINTMENT_SERVICES: 'appointment_services',
  SERVICES: 'services',
  PRODUCTS: 'products',
  INVENTORY: 'inventory',
  INVENTORY_LOGS: 'inventory_logs',
  RECEIPTS: 'receipts',
  RECEIPT_ITEMS: 'receipt_items',
} as const;

export function initDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORES.CUSTOMERS)) {
        const customerStore = db.createObjectStore(STORES.CUSTOMERS, {
          keyPath: 'id',
          autoIncrement: true,
        });
        customerStore.createIndex('phone', 'phone', { unique: false });
        customerStore.createIndex('name', 'name', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.APPOINTMENTS)) {
        const appointmentStore = db.createObjectStore(STORES.APPOINTMENTS, {
          keyPath: 'id',
          autoIncrement: true,
        });
        appointmentStore.createIndex('customer_id', 'customer_id', { unique: false });
        appointmentStore.createIndex('date', 'date', { unique: false });
        appointmentStore.createIndex('status', 'status', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.APPOINTMENT_SERVICES)) {
        const appointmentServiceStore = db.createObjectStore(STORES.APPOINTMENT_SERVICES, {
          keyPath: 'id',
          autoIncrement: true,
        });
        appointmentServiceStore.createIndex('appointment_id', 'appointment_id', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.SERVICES)) {
        db.createObjectStore(STORES.SERVICES, {
          keyPath: 'id',
          autoIncrement: true,
        });
      }

      if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
        const productStore = db.createObjectStore(STORES.PRODUCTS, {
          keyPath: 'id',
          autoIncrement: true,
        });
        productStore.createIndex('sku', 'sku', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.INVENTORY)) {
        const inventoryStore = db.createObjectStore(STORES.INVENTORY, {
          keyPath: 'id',
          autoIncrement: true,
        });
        inventoryStore.createIndex('product_id', 'product_id', { unique: true });
      }

      if (!db.objectStoreNames.contains(STORES.INVENTORY_LOGS)) {
        const inventoryLogStore = db.createObjectStore(STORES.INVENTORY_LOGS, {
          keyPath: 'id',
          autoIncrement: true,
        });
        inventoryLogStore.createIndex('product_id', 'product_id', { unique: false });
        inventoryLogStore.createIndex('created_at', 'created_at', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.RECEIPTS)) {
        const receiptStore = db.createObjectStore(STORES.RECEIPTS, {
          keyPath: 'id',
          autoIncrement: true,
        });
        receiptStore.createIndex('customer_id', 'customer_id', { unique: false });
        receiptStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.RECEIPT_ITEMS)) {
        const receiptItemStore = db.createObjectStore(STORES.RECEIPT_ITEMS, {
          keyPath: 'id',
          autoIncrement: true,
        });
        receiptItemStore.createIndex('receipt_id', 'receipt_id', { unique: false });
      }
    };
  });
}
