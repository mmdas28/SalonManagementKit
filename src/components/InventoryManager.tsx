import { useState, useEffect } from 'react';
import { Package, Edit3, AlertTriangle } from 'lucide-react';
import { ProductService, InventoryService, InventoryLogService } from '../db/service';
import type { Product, Inventory, InventoryLog } from '../types';

export default function InventoryManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<Map<number, Inventory>>(new Map());
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [adjustType, setAdjustType] = useState<'restock' | 'adjustment'>('restock');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedProduct?.id) {
      loadLogs(selectedProduct.id);
    }
  }, [selectedProduct]);

  const loadData = async () => {
    const productData = await ProductService.getAll();
    setProducts(productData);

    const inventoryData = await InventoryService.getAll();
    const inventoryMap = new Map(inventoryData.map(inv => [inv.product_id, inv]));
    setInventory(inventoryMap);
  };

  const loadLogs = async (productId: number) => {
    const logData = await InventoryLogService.getByProductId(productId);
    setLogs(logData.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ));
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProduct?.id) return;

    try {
      const amount = parseInt(adjustAmount);
      await InventoryService.adjustInventory(
        selectedProduct.id,
        amount,
        adjustType,
        undefined,
        adjustNotes || undefined
      );

      setAdjustAmount('');
      setAdjustNotes('');
      await loadData();
      await loadLogs(selectedProduct.id);
    } catch (error) {
      console.error('Error adjusting inventory:', error);
      alert(error instanceof Error ? error.message : 'فشل في تعديل المخزون');
    }
  };

  const getStockStatus = (product: Product) => {
    const inv = inventory.get(product.id!);
    if (!inv) return { status: 'غير معروف', quantity: 0, color: 'gray' };

    const quantity = inv.quantity;
    if (quantity === 0) return { status: 'نفذت الكمية', quantity, color: 'red' };
    if (quantity <= product.min_stock_threshold) return { status: 'مخزون منخفض', quantity, color: 'yellow' };
    return { status: 'متوفر', quantity, color: 'green' };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-SA');
  };

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'sale': return 'بيع';
      case 'restock': return 'إعادة تعبئة';
      case 'adjustment': return 'تعديل';
      case 'initial': return 'رصيد افتتاحي';
      case 'return': return 'مرتجع';
      default: return reason;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      <div className="flex flex-col">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">إدارة المخزون</h2>

        <div className="flex-1 overflow-y-auto space-y-2">
          {products.map((product) => {
            const stockStatus = getStockStatus(product);
            return (
              <div
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className={`bg-white border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedProduct?.id === product.id
                    ? 'border-amber-500 shadow-md'
                    : 'border-gray-200 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-800">{product.name}</h3>
                    <div className={`flex items-center gap-2 mt-2 text-sm font-medium ${
                      stockStatus.color === 'red' ? 'text-red-600' :
                      stockStatus.color === 'yellow' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {stockStatus.color === 'red' && <AlertTriangle size={16} />}
                      {stockStatus.color === 'yellow' && <AlertTriangle size={16} />}
                      <Package size={16} />
                      <span>{stockStatus.quantity} وحدة</span>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded text-sm font-medium ${
                    stockStatus.color === 'red' ? 'bg-red-100 text-red-700' :
                    stockStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {stockStatus.status}
                  </div>
                </div>
              </div>
            );
          })}

          {products.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Package size={48} className="mx-auto mb-4 opacity-50" />
              <p>لم يتم العثور على منتجات. أضف منتجات أولاً.</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col">
        {selectedProduct ? (
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{selectedProduct.name}</h3>
              <p className="text-3xl font-bold text-amber-600">
                {inventory.get(selectedProduct.id!)?.quantity || 0} وحدة
              </p>
              <p className="text-sm text-gray-600 mt-1">
                حد التنبيه: {selectedProduct.min_stock_threshold} وحدة
              </p>
            </div>

            <form onSubmit={handleAdjust} className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">تعديل المخزون</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    نوع التعديل
                  </label>
                  <select
                    value={adjustType}
                    onChange={(e) => setAdjustType(e.target.value as 'restock' | 'adjustment')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="restock">إعادة تعبئة (إضافة)</option>
                    <option value="adjustment">تعديل (إضافة/إزالة)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    تغيير الكمية *
                  </label>
                  <input
                    type="number"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    required
                    placeholder={adjustType === 'restock' ? 'أدخل قيمة موجبة' : 'أدخل قيمة موجبة أو سالبة'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ملاحظات
                  </label>
                  <textarea
                    value={adjustNotes}
                    onChange={(e) => setAdjustNotes(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  <Edit3 size={20} />
                  <span>تطبيق التعديل</span>
                </button>
              </div>
            </form>

            <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4 overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">سجل المخزون</h3>
              <div className="space-y-2">
                {logs.length === 0 ? (
                  <p className="text-gray-500 text-sm">لا يوجد سجل بعد</p>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="border-b border-gray-100 pb-2">
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold ${
                          log.change_amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {log.change_amount > 0 ? '+' : ''}{log.change_amount} وحدة
                        </span>
                        <span className="text-xs text-gray-500">{getReasonLabel(log.reason)}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{formatDate(log.created_at)}</p>
                      {log.notes && <p className="text-sm text-gray-700 mt-1">{log.notes}</p>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Package size={64} className="mx-auto mb-4 opacity-30" />
              <p>اختر منتجاً لإدارة مخزونه</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
