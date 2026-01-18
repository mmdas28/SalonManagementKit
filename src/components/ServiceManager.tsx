import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { ServiceService } from '../db/service';
import type { Service } from '../types';

export default function ServiceManager() {
  const [services, setServices] = useState<Service[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    const data = await ServiceService.getAll();
    setServices(data);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setName(service.name);
    setPrice(service.price.toString());
    setIsEditing(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('هل أنت متأكد أنك تريد حذف هذه الخدمة؟')) {
      try {
        await ServiceService.delete(id);
        loadServices();
      } catch (error) {
        console.error('Error deleting service:', error);
        alert('فشل في حذف الخدمة');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const timestamp = new Date().toISOString();

      if (editingService) {
        await ServiceService.update({
          ...editingService,
          name,
          price: parseFloat(price),
          updated_at: timestamp,
        });
      } else {
        await ServiceService.create({
          name,
          price: parseFloat(price),
          created_at: timestamp,
          updated_at: timestamp,
        });
      }

      setIsEditing(false);
      setEditingService(null);
      setName('');
      setPrice('');
      loadServices();
    } catch (error) {
      console.error('Error saving service:', error);
      alert('فشل في حفظ الخدمة');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingService(null);
    setName('');
    setPrice('');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">الخدمات</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            <Plus size={20} />
            <span>إضافة خدمة</span>
          </button>
        )}
      </div>

      {isEditing && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {editingService ? 'تعديل خدمة' : 'خدمة جديدة'}
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                اسم الخدمة *
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
        {services.map((service) => (
          <div
            key={service.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-800">{service.name}</h3>
                <p className="text-2xl font-bold text-amber-600">{service.price.toFixed(2)} AED</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(service)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(service.id!)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {services.length === 0 && !isEditing && (
        <div className="text-center py-12 text-gray-500">
          <p>لا توجد خدمات بعد. أضف خدمتك الأولى للبدء.</p>
        </div>
      )}
    </div>
  );
}
