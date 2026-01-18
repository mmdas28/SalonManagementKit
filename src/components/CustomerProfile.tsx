import { useState, useEffect } from 'react';
import { X, Edit2, Calendar, Receipt as ReceiptIcon, FileText } from 'lucide-react';
import { ReceiptService, AppointmentService } from '../db/service';
import type { Customer, Receipt, Appointment } from '../types';

interface CustomerProfileProps {
  customer: Customer;
  onEdit: () => void;
  onClose: () => void;
}

export default function CustomerProfile({ customer, onEdit, onClose }: CustomerProfileProps) {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    loadData();
  }, [customer.id]);

  const loadData = async () => {
    if (customer.id) {
      const receiptData = await ReceiptService.getByCustomerId(customer.id);
      const appointmentData = await AppointmentService.getByCustomerId(customer.id);
      setReceipts(receiptData.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ));
      setAppointments(appointmentData.sort((a, b) =>
        new Date(b.date + 'T' + b.start_time).getTime() - new Date(a.date + 'T' + a.start_time).getTime()
      ));
    }
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} AED`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  const formatDateTime = (dateString: string, timeString: string) => {
    return `${formatDate(dateString)} ${timeString}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">ملف العميل</h2>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="px-4 py-2 flex items-center gap-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            <Edit2 size={18} />
            تعديل
          </button>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
      </div>

      <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">{customer.name}</h3>
        <div className="space-y-1 text-gray-700">
          <p><strong>الهاتف:</strong> {customer.phone}</p>
          {customer.email && <p><strong>البريد الإلكتروني:</strong> {customer.email}</p>}
          {customer.notes && (
            <div className="mt-2">
              <strong>ملاحظات:</strong>
              <p className="mt-1 text-gray-600">{customer.notes}</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={20} className="text-amber-600" />
            <h3 className="text-lg font-semibold text-gray-800">المواعيد</h3>
          </div>
          <div className="space-y-2">
            {appointments.length === 0 ? (
              <p className="text-gray-500 text-sm">لا توجد مواعيد بعد</p>
            ) : (
              appointments.slice(0, 5).map((apt) => (
                <div key={apt.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {formatDateTime(apt.date, apt.start_time)}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      apt.status === 'completed' ? 'bg-green-100 text-green-700' :
                      apt.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                      apt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {apt.status === 'completed' ? 'مكتمل' :
                       apt.status === 'scheduled' ? 'مجدول' :
                       apt.status === 'cancelled' ? 'ملغي' :
                       apt.status === 'no-show' ? 'لم يحضر' : apt.status}
                    </span>
                  </div>
                  {apt.notes && <p className="text-xs text-gray-600 mt-1">{apt.notes}</p>}
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <ReceiptIcon size={20} className="text-amber-600" />
            <h3 className="text-lg font-semibold text-gray-800">الإيصالات الحديثة</h3>
          </div>
          <div className="space-y-2">
            {receipts.length === 0 ? (
              <p className="text-gray-500 text-sm">لا توجد إيصالات بعد</p>
            ) : (
              receipts.slice(0, 5).map((receipt) => (
                <div key={receipt.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{formatDate(receipt.timestamp)}</span>
                    <span className="text-sm font-semibold text-gray-800">
                      {formatCurrency(receipt.total)}
                    </span>
                  </div>
                  {receipt.tip > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      إكرامية: {formatCurrency(receipt.tip)}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <FileText size={20} className="text-amber-600" />
          <h3 className="text-lg font-semibold text-gray-800">ملخص</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-center">
            <p className="text-2xl font-bold text-blue-700">{appointments.length}</p>
            <p className="text-sm text-blue-600">إجمالي المواعيد</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center">
            <p className="text-2xl font-bold text-green-700">{receipts.length}</p>
            <p className="text-sm text-green-600">إجمالي الإيصالات</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 text-center">
            <p className="text-2xl font-bold text-amber-700">
              {formatCurrency(receipts.reduce((sum, r) => sum + r.total, 0))}
            </p>
            <p className="text-sm text-amber-600">القيمة الإجمالية</p>
          </div>
        </div>
      </div>
    </div>
  );
}
