import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { AppointmentService, CustomerService, ServiceService, AppointmentServiceService } from '../db/service';
import type { Appointment, Customer, Service as ServiceType, AppointmentService as AppointmentServiceType } from '../types';

interface AppointmentCalendarProps {
  onNewAppointment: (date: string, time: string) => void;
  onSelectAppointment: (appointment: Appointment) => void;
}

export default function AppointmentCalendar({ onNewAppointment, onSelectAppointment }: AppointmentCalendarProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<Map<number, Customer>>(new Map());
  const [services, setServices] = useState<Map<number, ServiceType>>(new Map());
  const [appointmentServices, setAppointmentServices] = useState<Map<number, AppointmentServiceType[]>>(new Map());

  const timeSlots = Array.from({ length: 24 }, (_, h) => `${h.toString().padStart(2, '0')}:00`);

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const loadData = async () => {
    const apts = await AppointmentService.getByDate(selectedDate);
    setAppointments(apts);

    const customerData = await CustomerService.getAll();
    const customerMap = new Map(customerData.map(c => [c.id!, c]));
    setCustomers(customerMap);

    const serviceData = await ServiceService.getAll();
    const serviceMap = new Map(serviceData.map(s => [s.id!, s]));
    setServices(serviceMap);

    const aptServicesMap = new Map<number, AppointmentServiceType[]>();
    for (const apt of apts) {
      if (apt.id) {
        const aptServices = await AppointmentServiceService.getByAppointmentId(apt.id);
        aptServicesMap.set(apt.id, aptServices);
      }
    }
    setAppointmentServices(aptServicesMap);
  };

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const getAppointmentsForTime = (time: string) => {
    return appointments.filter(apt => apt.start_time === time);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => changeDate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight size={24} />
          </button>
          <h2 className="text-2xl font-semibold text-gray-800 min-w-[300px] text-center">
            {formatDate(selectedDate)}
          </h2>
          <button
            onClick={() => changeDate(1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
        </div>
        <button
          onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
        >
          اليوم
        </button>
      </div>

      <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg">
        {timeSlots.map((time) => {
          const slotsAppointments = getAppointmentsForTime(time);
          return (
            <div key={time} className="flex border-b border-gray-200 hover:bg-gray-50">
              <div className="w-24 p-4 border-r border-gray-200 flex-shrink-0">
                <span className="font-semibold text-gray-700">{time}</span>
              </div>
              <div className="flex-1 p-2 min-h-[80px]">
                {slotsAppointments.length === 0 ? (
                  <button
                    onClick={() => onNewAppointment(selectedDate, time)}
                    className="w-full h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity group"
                  >
                    <div className="flex items-center gap-2 text-amber-600 group-hover:text-amber-700">
                      <Plus size={20} />
                      <span className="text-sm">إضافة موعد</span>
                    </div>
                  </button>
                ) : (
                  <div className="space-y-2">
                    {slotsAppointments.map((apt) => {
                      const customer = customers.get(apt.customer_id);
                      const aptServices = appointmentServices.get(apt.id!) || [];
                      const serviceNames = aptServices
                        .map(as => services.get(as.service_id)?.name)
                        .filter(Boolean)
                        .join(', ');

                      return (
                        <div
                          key={apt.id}
                          onClick={() => onSelectAppointment(apt)}
                          className={`p-3 rounded-lg border-l-4 cursor-pointer transition-all ${
                            apt.status === 'completed'
                              ? 'bg-green-50 border-green-500'
                              : apt.status === 'scheduled'
                              ? 'bg-blue-50 border-blue-500'
                              : apt.status === 'cancelled'
                              ? 'bg-red-50 border-red-500'
                              : 'bg-gray-50 border-gray-500'
                          } hover:shadow-md`}
                        >
                          <div className="font-semibold text-gray-800">{customer?.name}</div>
                          <div className="text-sm text-gray-600">
                            {apt.start_time} - {apt.end_time}
                          </div>
                          {serviceNames && (
                            <div className="text-sm text-gray-500 mt-1">{serviceNames}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
