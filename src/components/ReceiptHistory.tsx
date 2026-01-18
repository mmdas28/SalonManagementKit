import { useState, useEffect } from 'react';
import { Receipt as ReceiptIcon, X, Search } from 'lucide-react';
import { ReceiptService, ReceiptItemService, CustomerService } from '../db/service';
import type { Receipt, ReceiptItem, Customer } from '../types';

export default function ReceiptHistory() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [customers, setCustomers] = useState<Map<number, Customer>>(new Map());
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedReceipt?.id) {
      loadReceiptItems(selectedReceipt.id);
    }
  }, [selectedReceipt]);

  const loadData = async () => {
    const receiptData = await ReceiptService.getAll();
    setReceipts(receiptData.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ));

    const customerData = await CustomerService.getAll();
    const customerMap = new Map(customerData.map(c => [c.id!, c]));
    setCustomers(customerMap);
  };

  const loadReceiptItems = async (receiptId: number) => {
    const items = await ReceiptItemService.getByReceiptId(receiptId);
    setReceiptItems(items);
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} AED`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-SA');
  };

  const filteredReceipts = receipts.filter(receipt => {
    if (!searchQuery) return true;
    const customer = customers.get(receipt.customer_id);
    const lowerQuery = searchQuery.toLowerCase();
    return (
      receipt.id?.toString().includes(searchQuery) ||
      customer?.name.toLowerCase().includes(lowerQuery) ||
      customer?.phone.includes(searchQuery)
    );
  });

  return (
    <div className="flex flex-col h-full" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">سجل الإيصالات</h2>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="بحث في الإيصالات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-hidden">
        <div className="flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-2">
            {filteredReceipts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <ReceiptIcon size={48} className="mx-auto mb-4 opacity-50" />
                <p>لم يتم العثور على إيصالات</p>
              </div>
            ) : (
              filteredReceipts.map((receipt) => {
                const customer = customers.get(receipt.customer_id);
                return (
                  <div
                    key={receipt.id}
                    onClick={() => setSelectedReceipt(receipt)}
                    className={`bg-white border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedReceipt?.id === receipt.id
                        ? 'border-amber-500 shadow-md'
                        : 'border-gray-200 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <ReceiptIcon size={18} className="text-amber-600" />
                          <span className="font-semibold text-gray-800">إيصال رقم {receipt.id}</span>
                        </div>
                        <p className="text-gray-600">{customer?.name || 'غير معروف'}</p>
                        <p className="text-sm text-gray-500">{formatDate(receipt.timestamp)}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-2xl font-bold text-amber-600">
                          {formatCurrency(receipt.total)}
                        </p>
                        {receipt.tip > 0 && (
                          <p className="text-xs text-gray-500">
                            إكرامية: {formatCurrency(receipt.tip)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex flex-col">
          {selectedReceipt ? (
            <div className="bg-white border border-gray-200 rounded-lg p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">
                  إيصال رقم {selectedReceipt.id}
                </h3>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-gray-600 mb-1">العميل</p>
                <p className="font-semibold text-gray-800">
                  {customers.get(selectedReceipt.customer_id)?.name || 'غير معروف'}
                </p>
                <p className="text-sm text-gray-600 mt-3 mb-1">التاريخ والوقت</p>
                <p className="text-gray-700">{formatDate(selectedReceipt.timestamp)}</p>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">العناصر</h4>
                <div className="space-y-2">
                  {receiptItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{item.name}</p>
                        <p className="text-sm text-gray-600">
                          {item.quantity} × {formatCurrency(item.unit_price)}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded ${
                          item.item_type === 'service'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {item.item_type === 'service' ? 'خدمة' : 'منتج'}
                        </span>
                      </div>
                      <p className="font-semibold text-gray-800">
                        {formatCurrency(item.line_total)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex items-center justify-between text-lg">
                  <span className="text-gray-700">المجموع الفرعي:</span>
                  <span className="font-semibold text-gray-800">
                    {formatCurrency(selectedReceipt.subtotal)}
                  </span>
                </div>
                {selectedReceipt.tip > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">الإكرامية:</span>
                    <span className="font-semibold text-gray-800">
                      {formatCurrency(selectedReceipt.tip)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-2xl pt-2 border-t border-gray-200">
                  <span className="font-bold text-gray-800">الإجمالي:</span>
                  <span className="font-bold text-amber-600">
                    {formatCurrency(selectedReceipt.total)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <ReceiptIcon size={64} className="mx-auto mb-4 opacity-30" />
                <p>اختر إيصالاً لعرض التفاصيل</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
