import { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { AppointmentService, CustomerService, ServiceService, AppointmentServiceService } from '../db/service';
import type { Appointment, Customer, Service, AppointmentStatus } from '../types';

interface AppointmentFormProps {
  appointment?: Appointment;
  initialDate?: string;
  initialTime?: string;
  onSave: () => void;
  onCancel: () => void;
}

export default function AppointmentForm({ appointment, initialDate, initialTime, onSave, onCancel }: AppointmentFormProps) {
  const [customerId, setCustomerId] = useState<number>(0);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [status, setStatus] = useState<AppointmentStatus>('scheduled');
  const [notes, setNotes] = useState('');
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (appointment) {
      setCustomerId(appointment.customer_id);
      setDate(appointment.date);
      setStartTime(appointment.start_time);
      setEndTime(appointment.end_time);
      setStatus(appointment.status);
      setNotes(appointment.notes || '');
      loadAppointmentServices();
    } else if (initialDate && initialTime) {
      setDate(initialDate);
      setStartTime(initialTime);
      const endHour = parseInt(initialTime.split(':')[0]) + 1;
      setEndTime(endHour >= 24 ? '23:59' : `${endHour.toString().padStart(2, '0')}:00`);
    }
  }, [appointment, initialDate, initialTime]);

  const loadData = async () => {
    const customerData = await CustomerService.getAll();
    const serviceData = await ServiceService.getAll();
    setCustomers(customerData);
    setServices(serviceData);
  };

  const loadAppointmentServices = async () => {
    if (appointment?.id) {
      const aptServices = await AppointmentServiceService.getByAppointmentId(appointment.id);
      setSelectedServices(aptServices.map(as => as.service_id));
    }
  };

  const toggleService = (serviceId: number) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerId || selectedServices.length === 0) {
      alert('يرجى اختيار عميل وخدمة واحدة على الأقل');
      return;
    }

    setIsSaving(true);

    try {
      const timestamp = new Date().toISOString();

      if (appointment?.id) {
        await AppointmentService.update({
          ...appointment,
          customer_id: customerId,
          date,
          start_time: startTime,
          end_time: endTime,
          status,
          notes: notes || undefined,
          updated_at: timestamp,
        });

        await AppointmentServiceService.deleteByAppointmentId(appointment.id);

        for (const serviceId of selectedServices) {
          await AppointmentServiceService.create({
            appointment_id: appointment.id,
            service_id: serviceId,
            quantity: 1,
          });
        }
      } else {
        const aptId = await AppointmentService.create({
          customer_id: customerId,
          date,
          start_time: startTime,
          end_time: endTime,
          status,
          notes: notes || undefined,
          created_at: timestamp,
          updated_at: timestamp,
        });

        for (const serviceId of selectedServices) {
          await AppointmentServiceService.create({
            appointment_id: aptId as number,
            service_id: serviceId,
            quantity: 1,
          });
        }
      }

      onSave();
    } catch (error) {
      console.error('Error saving appointment:', error);
      alert('فشل حفظ الموعد');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!appointment?.id) return;

    if (confirm('هل أنت متأكد من حذف هذا الموعد؟')) {
      try {
        await AppointmentServiceService.deleteByAppointmentId(appointment.id);
        await AppointmentService.delete(appointment.id);
        onSave();
      } catch (error) {
        console.error('Error deleting appointment:', error);
        alert('فشل حذف الموعد');
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          {appointment ? 'تعديل الموعد' : 'موعد جديد'}
        </h2>
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            العميل *
          </label>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(Number(e.target.value))}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">اختر عميلاً</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} - {customer.phone}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              التاريخ *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الحالة *
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="scheduled">مجدول</option>
              <option value="completed">مكتمل</option>
              <option value="cancelled">ملغي</option>
              <option value="no-show">لم يحضر</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              وقت البدء *
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              وقت الانتهاء *
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            الخدمات *
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-300 rounded-lg">
            {services.length === 0 ? (
              <p className="col-span-2 text-gray-500 text-sm">لا توجد خدمات متاحة</p>
            ) : (
              services.map((service) => (
                <label
                  key={service.id}
                  className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedServices.includes(service.id!)}
                    onChange={() => toggleService(service.id!)}
                    className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-sm">{service.name}</span>
                </label>
              ))
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ملاحظات
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
          >
            <Save size={20} />
            <span>{isSaving ? 'جاري الحفظ...' : 'حفظ الموعد'}</span>
          </button>
          {appointment && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <Trash2 size={20} />
              حذف
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
}
