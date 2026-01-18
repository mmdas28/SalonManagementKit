import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Package } from 'lucide-react';
import { ProductService, InventoryService } from '../db/service';
import type { Product, Inventory } from '../types';

export default function ProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<Map<number, Inventory>>(new Map());
  const [isEditing, setIsEditing] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [minStockThreshold, setMinStockThreshold] = useState('5');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const productData = await ProductService.getAll();
    setProducts(productData);

    const inventoryData = await InventoryService.getAll();
    const inventoryMap = new Map(inventoryData.map(inv => [inv.product_id, inv]));
    setInventory(inventoryMap);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setPrice(product.price.toString());
    setMinStockThreshold(product.min_stock_threshold.toString());
    setIsEditing(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('هل أنت متأكد أنك تريد حذف هذا المنتج؟')) {
      try {
        await ProductService.delete(id);
        loadData();
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('فشل في حذف المنتج');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const timestamp = new Date().toISOString();

      if (editingProduct) {
        await ProductService.update({
          ...editingProduct,
          name,
          price: parseFloat(price),
          min_stock_threshold: parseInt(minStockThreshold),
          updated_at: timestamp,
        });
      } else {
        await ProductService.create({
          name,
          price: parseFloat(price),
          min_stock_threshold: parseInt(minStockThreshold),
          created_at: timestamp,
          updated_at: timestamp,
        });
      }

      setIsEditing(false);
      setEditingProduct(null);
      setName('');
      setPrice('');
      setMinStockThreshold('5');
      loadData();
    } catch (error) {
      console.error('Error saving product:', error);
      alert(error instanceof Error ? error.message : 'فشل في حفظ المنتج');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingProduct(null);
    setName('');
    setPrice('');
    setMinStockThreshold('5');
  };

  const getStockStatus = (productId: number, threshold: number) => {
    const inv = inventory.get(productId);
    if (!inv) return { status: 'unknown', quantity: 0 };

    const quantity = inv.quantity;
    if (quantity === 0) return { status: 'out', quantity };
    if (quantity <= threshold) return { status: 'low', quantity };
    return { status: 'good', quantity };
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">المنتجات</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            <Plus size={20} />
            <span>إضافة منتج</span>
          </button>
        )}
      </div>

      {isEditing && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {editingProduct ? 'تعديل منتج' : 'منتج جديد'}
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                اسم المنتج *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                السعر *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                حد تنبيه انخفاض المخزون *
              </label>
              <input
                type="number"
                min="0"
                value={minStockThreshold}
                onChange={(e) => setMinStockThreshold(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              حفظ
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => {
          const stockStatus = getStockStatus(product.id!, product.min_stock_threshold);
          return (
            <div
              key={product.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-800">{product.name}</h3>
                  <p className="text-2xl font-bold text-amber-600 mt-1">{product.price.toFixed(2)} AED</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id!)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className={`flex items-center gap-2 mt-3 p-2 rounded ${
                stockStatus.status === 'out' ? 'bg-red-100 text-red-700' :
                stockStatus.status === 'low' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                <Package size={16} />
                <span className="text-sm font-medium">
                  المخزون: {stockStatus.quantity}
                  {stockStatus.status === 'out' && ' - نفذت الكمية'}
                  {stockStatus.status === 'low' && ' - مخزون منخفض'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {products.length === 0 && !isEditing && (
        <div className="text-center py-12 text-gray-500">
          <p>لا توجد منتجات بعد. أضف منتجك الأول للبدء.</p>
        </div>
      )}
    </div>
  );
}
