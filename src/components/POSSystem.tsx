import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, DollarSign, Receipt as ReceiptIcon } from 'lucide-react';
import { CustomerService, ServiceService, ProductService, InventoryService, ReceiptService, ReceiptItemService } from '../db/service';
import type { Customer, Service, Product, CartItem } from '../types';

export default function POSSystem() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<number>(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tip, setTip] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastReceiptId, setLastReceiptId] = useState<number>(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const customerData = await CustomerService.getAll();
    const serviceData = await ServiceService.getAll();
    const productData = await ProductService.getAll();
    setCustomers(customerData);
    setServices(serviceData);
    setProducts(productData);
  };

  const addToCart = (type: 'service' | 'product', item: Service | Product) => {
    const existing = cart.find(c => c.type === type && c.id === item.id);
    if (existing) {
      updateQuantity(type, item.id!, existing.quantity + 1);
    } else {
      setCart([...cart, {
        type,
        id: item.id!,
        name: item.name,
        price: item.price,
        quantity: 1,
      }]);
    }
  };

  const updateQuantity = (type: 'service' | 'product', id: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(type, id);
    } else {
      setCart(cart.map(item =>
        item.type === type && item.id === id
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const removeFromCart = (type: 'service' | 'product', id: number) => {
    setCart(cart.filter(item => !(item.type === type && item.id === id)));
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tipAmount = parseFloat(tip) || 0;
    return subtotal + tipAmount;
  };

  const handleCheckout = async () => {
    if (!selectedCustomer) {
      alert('يرجى اختيار عميل');
      return;
    }

    if (cart.length === 0) {
      alert('سلة المشتريات فارغة');
      return;
    }

    setIsProcessing(true);

    try {
      const timestamp = new Date().toISOString();
      const subtotal = calculateSubtotal();
      const tipAmount = parseFloat(tip) || 0;
      const total = subtotal + tipAmount;

      for (const item of cart) {
        if (item.type === 'product') {
          const inventory = await InventoryService.getByProductId(item.id);
          if (!inventory || inventory.quantity < item.quantity) {
            throw new Error(`الكمية غير كافية من ${item.name}`);
          }
        }
      }

      const receiptId = await ReceiptService.create({
        customer_id: selectedCustomer,
        timestamp,
        subtotal,
        tip: tipAmount,
        total,
        created_at: timestamp,
      });

      for (const item of cart) {
        await ReceiptItemService.create({
          receipt_id: receiptId as number,
          item_type: item.type,
          item_id: item.id,
          name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          line_total: item.price * item.quantity,
        });

        if (item.type === 'product') {
          await InventoryService.adjustInventory(
            item.id,
            -item.quantity,
            'sale',
            receiptId as number
          );
        }
      }

      setLastReceiptId(receiptId as number);
      setShowReceipt(true);
      setCart([]);
      setTip('');
      setSelectedCustomer(0);
    } catch (error) {
      console.error('Error processing checkout:', error);
      alert(error instanceof Error ? error.message : 'خطأ في معالجة الدفع');
    } finally {
      setIsProcessing(false);
    }
  };

  const closeReceipt = () => {
    setShowReceipt(false);
    setLastReceiptId(0);
  };

  if (showReceipt) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <ReceiptIcon size={32} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">تم الدفع بنجاح!</h2>
            <p className="text-gray-600">إيصال #{lastReceiptId}</p>
          </div>

          <div className="border-t border-gray-200 pt-4 mb-6">
            <p className="text-center text-gray-600">
              شكراً لتعاملك معنا!
            </p>
          </div>

          <button
            onClick={closeReceipt}
            className="w-full px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            عملية جديدة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      <div className="lg:col-span-2 flex flex-col">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            العميل *
          </label>
          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">اختر العميل...</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} - {customer.phone}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">الخدمات</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => addToCart('service', service)}
                  className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all text-left"
                >
                  <h4 className="font-semibold text-gray-800">{service.name}</h4>
                  <p className="text-amber-600 font-bold">{service.price.toFixed(2)} AED</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">المنتجات</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart('product', product)}
                  className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all text-left"
                >
                  <h4 className="font-semibold text-gray-800">{product.name}</h4>
                  <p className="text-amber-600 font-bold">{product.price.toFixed(2)} AED</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingCart size={24} className="text-amber-600" />
          <h3 className="text-xl font-semibold text-gray-800">سلة المشتريات</h3>
        </div>

        <div className="flex-1 overflow-y-auto mb-4 space-y-2">
          {cart.length === 0 ? (
            <p className="text-gray-500 text-center py-8">السلة فارغة</p>
          ) : (
            cart.map((item, index) => (
              <div key={`${item.type}-${item.id}-${index}`} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">{item.name}</h4>
                    <p className="text-sm text-gray-600">{item.price.toFixed(2)} AED للقطعة</p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.type, item.id)}
                    className="text-red-600 hover:bg-red-50 p-1 rounded"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.type, item.id, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="font-semibold w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.type, item.id, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded hover:bg-gray-300"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <span className="font-bold text-gray-800">
                    {(item.price * item.quantity).toFixed(2)} AED
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-gray-200 pt-4 space-y-3">
          <div className="flex items-center justify-between text-lg">
            <span className="font-medium text-gray-700">المجموع الفرعي:</span>
            <span className="font-semibold text-gray-800">{calculateSubtotal().toFixed(2)} AED</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              بقشيش (اختياري)
            </label>
            <div className="relative">
              <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="number"
                step="0.01"
                min="0"
                value={tip}
                onChange={(e) => setTip(e.target.value)}
                placeholder="0.00"
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-2xl pt-2">
            <span className="font-bold text-gray-800">المجموع:</span>
            <span className="font-bold text-amber-600">{calculateTotal().toFixed(2)} AED</span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={isProcessing || cart.length === 0 || !selectedCustomer}
            className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ReceiptIcon size={20} />
            <span className="font-semibold">
              {isProcessing ? 'جاري المعالجة...' : 'إتمام البيع'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
