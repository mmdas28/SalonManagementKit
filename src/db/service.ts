import { initDatabase, STORES } from './schema';
import type {
  Customer,
  Appointment,
  AppointmentService as AppointmentServiceType,
  Service,
  Product,
  Inventory,
  InventoryLog,
  Receipt,
  ReceiptItem,
  InventoryLogReason,
} from '../types';

let dbInstance: IDBDatabase | null = null;

export async function getDB(): Promise<IDBDatabase> {
  if (!dbInstance) {
    dbInstance = await initDatabase();
  }
  return dbInstance;
}

function executeTransaction<T>(
  storeName: string,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const db = await getDB();
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);

    const request = operation(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const CustomerService = {
  async create(customer: Omit<Customer, 'id'>): Promise<number> {
    return executeTransaction(STORES.CUSTOMERS, 'readwrite', (store) =>
      store.add(customer)
    ) as Promise<number>;
  },

  async update(customer: Customer): Promise<void> {
    await executeTransaction(STORES.CUSTOMERS, 'readwrite', (store) =>
      store.put(customer)
    );
  },

  async delete(id: number): Promise<void> {
    await executeTransaction(STORES.CUSTOMERS, 'readwrite', (store) =>
      store.delete(id)
    );
  },

  async getById(id: number): Promise<Customer | undefined> {
    return executeTransaction(STORES.CUSTOMERS, 'readonly', (store) =>
      store.get(id)
    );
  },

  async getAll(): Promise<Customer[]> {
    return executeTransaction(STORES.CUSTOMERS, 'readonly', (store) =>
      store.getAll()
    );
  },

  async search(query: string): Promise<Customer[]> {
    const all = await this.getAll();
    const lowerQuery = query.toLowerCase();
    return all.filter(
      (c) =>
        c.name.toLowerCase().includes(lowerQuery) ||
        c.phone.includes(query) ||
        c.email?.toLowerCase().includes(lowerQuery)
    );
  },
};

export const AppointmentService = {
  async create(appointment: Omit<Appointment, 'id'>): Promise<number> {
    return executeTransaction(STORES.APPOINTMENTS, 'readwrite', (store) =>
      store.add(appointment)
    ) as Promise<number>;
  },

  async update(appointment: Appointment): Promise<void> {
    await executeTransaction(STORES.APPOINTMENTS, 'readwrite', (store) =>
      store.put(appointment)
    );
  },

  async delete(id: number): Promise<void> {
    await executeTransaction(STORES.APPOINTMENTS, 'readwrite', (store) =>
      store.delete(id)
    );
  },

  async getById(id: number): Promise<Appointment | undefined> {
    return executeTransaction(STORES.APPOINTMENTS, 'readonly', (store) =>
      store.get(id)
    );
  },

  async getAll(): Promise<Appointment[]> {
    return executeTransaction(STORES.APPOINTMENTS, 'readonly', (store) =>
      store.getAll()
    );
  },

  async getByCustomerId(customerId: number): Promise<Appointment[]> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.APPOINTMENTS, 'readonly');
      const store = transaction.objectStore(STORES.APPOINTMENTS);
      const index = store.index('customer_id');
      const request = index.getAll(customerId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async getByDate(date: string): Promise<Appointment[]> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.APPOINTMENTS, 'readonly');
      const store = transaction.objectStore(STORES.APPOINTMENTS);
      const index = store.index('date');
      const request = index.getAll(date);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
};

export const AppointmentServiceService = {
  async create(appointmentService: Omit<AppointmentServiceType, 'id'>): Promise<number> {
    return executeTransaction(STORES.APPOINTMENT_SERVICES, 'readwrite', (store) =>
      store.add(appointmentService)
    ) as Promise<number>;
  },

  async getByAppointmentId(appointmentId: number): Promise<AppointmentServiceType[]> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.APPOINTMENT_SERVICES, 'readonly');
      const store = transaction.objectStore(STORES.APPOINTMENT_SERVICES);
      const index = store.index('appointment_id');
      const request = index.getAll(appointmentId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async deleteByAppointmentId(appointmentId: number): Promise<void> {
    const items = await this.getByAppointmentId(appointmentId);
    const db = await getDB();
    const transaction = db.transaction(STORES.APPOINTMENT_SERVICES, 'readwrite');
    const store = transaction.objectStore(STORES.APPOINTMENT_SERVICES);

    items.forEach((item) => {
      if (item.id) store.delete(item.id);
    });

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  },
};

export const ServiceService = {
  async create(service: Omit<Service, 'id'>): Promise<number> {
    return executeTransaction(STORES.SERVICES, 'readwrite', (store) =>
      store.add(service)
    ) as Promise<number>;
  },

  async update(service: Service): Promise<void> {
    await executeTransaction(STORES.SERVICES, 'readwrite', (store) =>
      store.put(service)
    );
  },

  async delete(id: number): Promise<void> {
    await executeTransaction(STORES.SERVICES, 'readwrite', (store) =>
      store.delete(id)
    );
  },

  async getById(id: number): Promise<Service | undefined> {
    return executeTransaction(STORES.SERVICES, 'readonly', (store) =>
      store.get(id)
    );
  },

  async getAll(): Promise<Service[]> {
    return executeTransaction(STORES.SERVICES, 'readonly', (store) =>
      store.getAll()
    );
  },
};

export const ProductService = {
  async create(product: Omit<Product, 'id'>): Promise<number> {
    // Enforce unique product name (case-insensitive, trimmed)
    const existing = await this.getAll();
    const normalizedName = product.name.trim().toLowerCase();
    if (existing.some(p => p.name.trim().toLowerCase() === normalizedName)) {
      throw new Error('يوجد منتج بنفس الاسم بالفعل');
    }
    const productId = await executeTransaction(STORES.PRODUCTS, 'readwrite', (store) =>
      store.add(product)
    ) as number;

    await InventoryService.create({
      product_id: productId as number,
      quantity: 0,
      updated_at: new Date().toISOString(),
    });

    return productId;
  },

  async update(product: Product): Promise<void> {
    // Enforce unique product name on update (excluding self)
    const existing = await this.getAll();
    const normalizedName = product.name.trim().toLowerCase();
    if (existing.some(p => p.id !== product.id && p.name.trim().toLowerCase() === normalizedName)) {
      throw new Error('يوجد منتج بنفس الاسم بالفعل');
    }
    await executeTransaction(STORES.PRODUCTS, 'readwrite', (store) =>
      store.put(product)
    );
  },

  async delete(id: number): Promise<void> {
    await executeTransaction(STORES.PRODUCTS, 'readwrite', (store) =>
      store.delete(id)
    );
  },

  async getById(id: number): Promise<Product | undefined> {
    return executeTransaction(STORES.PRODUCTS, 'readonly', (store) =>
      store.get(id)
    );
  },

  async getAll(): Promise<Product[]> {
    return executeTransaction(STORES.PRODUCTS, 'readonly', (store) =>
      store.getAll()
    );
  },
};

export const InventoryService = {
  async create(inventory: Omit<Inventory, 'id'>): Promise<number> {
    return executeTransaction(STORES.INVENTORY, 'readwrite', (store) =>
      store.add(inventory)
    ) as Promise<number>;
  },

  async update(inventory: Inventory): Promise<void> {
    await executeTransaction(STORES.INVENTORY, 'readwrite', (store) =>
      store.put(inventory)
    );
  },

  async getByProductId(productId: number): Promise<Inventory | undefined> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.INVENTORY, 'readonly');
      const store = transaction.objectStore(STORES.INVENTORY);
      const index = store.index('product_id');
      const request = index.get(productId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async adjustInventory(
    productId: number,
    changeAmount: number,
    reason: InventoryLogReason,
    receiptId?: number,
    notes?: string
  ): Promise<void> {
    const db = await getDB();
    const transaction = db.transaction(
      [STORES.INVENTORY, STORES.INVENTORY_LOGS],
      'readwrite'
    );

    return new Promise(async (resolve, reject) => {
      try {
        const inventoryStore = transaction.objectStore(STORES.INVENTORY);
        const inventoryIndex = inventoryStore.index('product_id');
        const inventoryRequest = inventoryIndex.get(productId);

        inventoryRequest.onsuccess = () => {
          const inventory: Inventory = inventoryRequest.result;

          if (!inventory) {
            reject(new Error('المخزون غير موجود'));
            return;
          }

          const newQuantity = inventory.quantity + changeAmount;

          if (newQuantity < 0) {
            reject(new Error('المخزون غير كافٍ'));
            return;
          }

          inventory.quantity = newQuantity;
          inventory.updated_at = new Date().toISOString();
          inventoryStore.put(inventory);

          const logStore = transaction.objectStore(STORES.INVENTORY_LOGS);
          logStore.add({
            product_id: productId,
            change_amount: changeAmount,
            reason,
            receipt_id: receiptId,
            notes,
            created_at: new Date().toISOString(),
          });
        };

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      } catch (error) {
        reject(error);
      }
    });
  },

  async getAll(): Promise<Inventory[]> {
    return executeTransaction(STORES.INVENTORY, 'readonly', (store) =>
      store.getAll()
    );
  },
};

export const InventoryLogService = {
  async getByProductId(productId: number): Promise<InventoryLog[]> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.INVENTORY_LOGS, 'readonly');
      const store = transaction.objectStore(STORES.INVENTORY_LOGS);
      const index = store.index('product_id');
      const request = index.getAll(productId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async getAll(): Promise<InventoryLog[]> {
    return executeTransaction(STORES.INVENTORY_LOGS, 'readonly', (store) =>
      store.getAll()
    );
  },
};

export const ReceiptService = {
  async create(receipt: Omit<Receipt, 'id'>): Promise<number> {
    return executeTransaction(STORES.RECEIPTS, 'readwrite', (store) =>
      store.add(receipt)
    ) as Promise<number>;
  },

  async getById(id: number): Promise<Receipt | undefined> {
    return executeTransaction(STORES.RECEIPTS, 'readonly', (store) =>
      store.get(id)
    );
  },

  async getAll(): Promise<Receipt[]> {
    return executeTransaction(STORES.RECEIPTS, 'readonly', (store) =>
      store.getAll()
    );
  },

  async getByCustomerId(customerId: number): Promise<Receipt[]> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.RECEIPTS, 'readonly');
      const store = transaction.objectStore(STORES.RECEIPTS);
      const index = store.index('customer_id');
      const request = index.getAll(customerId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
};

export const ReceiptItemService = {
  async create(receiptItem: Omit<ReceiptItem, 'id'>): Promise<number> {
    return executeTransaction(STORES.RECEIPT_ITEMS, 'readwrite', (store) =>
      store.add(receiptItem)
    ) as Promise<number>;
  },

  async getByReceiptId(receiptId: number): Promise<ReceiptItem[]> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.RECEIPT_ITEMS, 'readonly');
      const store = transaction.objectStore(STORES.RECEIPT_ITEMS);
      const index = store.index('receipt_id');
      const request = index.getAll(receiptId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
};
