import { useState } from 'react';
import { Calendar, Users, Package, Settings, Receipt as ReceiptIcon, Zap } from 'lucide-react';
import CustomerList from './components/CustomerList';
import CustomerForm from './components/CustomerForm';
import CustomerProfile from './components/CustomerProfile';
import AppointmentCalendar from './components/AppointmentCalendar';
import AppointmentForm from './components/AppointmentForm';
import ServiceManager from './components/ServiceManager';
import ProductManager from './components/ProductManager';
import InventoryManager from './components/InventoryManager';
import POSSystem from './components/POSSystem';
import ReceiptHistory from './components/ReceiptHistory';
import type { Customer, Appointment } from './types';

type View = 'customers' | 'appointments' | 'services' | 'products' | 'inventory' | 'pos' | 'receipts';
type CustomerView = 'list' | 'form' | 'profile';
type AppointmentView = 'calendar' | 'form';

function App() {
  const [currentView, setCurrentView] = useState<View>('customers');
  const [customerView, setCustomerView] = useState<CustomerView>('list');
  const [appointmentView, setAppointmentView] = useState<AppointmentView>('calendar');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerView('profile');
  };

  const handleEditCustomer = () => {
    setCustomerView('form');
  };

  const handleNewCustomer = () => {
    setSelectedCustomer(null);
    setCustomerView('form');
  };

  const handleSaveCustomer = () => {
    setCustomerView('list');
    setSelectedCustomer(null);
  };

  const handleCancelCustomer = () => {
    setCustomerView('list');
    setSelectedCustomer(null);
  };

  const handleNewAppointment = (date: string, time: string) => {
    setAppointmentDate(date);
    setAppointmentTime(time);
    setSelectedAppointment(null);
    setAppointmentView('form');
  };

  const handleSelectAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setAppointmentView('form');
  };

  const handleSaveAppointment = () => {
    setAppointmentView('calendar');
    setSelectedAppointment(null);
    setAppointmentDate('');
    setAppointmentTime('');
  };

  const handleCancelAppointment = () => {
    setAppointmentView('calendar');
    setSelectedAppointment(null);
    setAppointmentDate('');
    setAppointmentTime('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <nav className="bg-white border-b border-amber-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Zap size={32} className="text-amber-600" />
              <h1 className="text-3xl font-bold text-gray-900"> صالون غزل للسيدات</h1>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCurrentView('customers')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                currentView === 'customers'
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Users size={20} />
              العملاء
            </button>

            <button
              onClick={() => setCurrentView('appointments')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                currentView === 'appointments'
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Calendar size={20} />
              المواعيد
            </button>

            <button
              onClick={() => setCurrentView('pos')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                currentView === 'pos'
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <ReceiptIcon size={20} />
              نقطة البيع
            </button>

            <button
              onClick={() => setCurrentView('receipts')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                currentView === 'receipts'
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <ReceiptIcon size={20} />
              الإيصالات
            </button>

            <button
              onClick={() => setCurrentView('services')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                currentView === 'services'
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Package size={20} />
              الخدمات
            </button>

            <button
              onClick={() => setCurrentView('products')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                currentView === 'products'
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Package size={20} />
              المنتجات
            </button>

            <button
              onClick={() => setCurrentView('inventory')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                currentView === 'inventory'
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Settings size={20} />
              المخزون
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {currentView === 'customers' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {customerView === 'list' && (
              <div className="lg:col-span-2">
                <CustomerList
                  onSelectCustomer={handleSelectCustomer}
                  onNewCustomer={handleNewCustomer}
                />
              </div>
            )}

            {customerView === 'form' && (
              <div className="lg:col-span-2 flex justify-center">
                <CustomerForm
                  customer={selectedCustomer || undefined}
                  onSave={handleSaveCustomer}
                  onCancel={handleCancelCustomer}
                />
              </div>
            )}

            {customerView === 'profile' && selectedCustomer && (
              <div className="lg:col-span-2 flex justify-center">
                <CustomerProfile
                  customer={selectedCustomer}
                  onEdit={handleEditCustomer}
                  onClose={handleCancelCustomer}
                />
              </div>
            )}
          </div>
        )}

        {currentView === 'appointments' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {appointmentView === 'calendar' && (
              <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
                <AppointmentCalendar
                  onNewAppointment={handleNewAppointment}
                  onSelectAppointment={handleSelectAppointment}
                />
              </div>
            )}

            {appointmentView === 'form' && (
              <div className="lg:col-span-2 flex justify-center">
                <AppointmentForm
                  appointment={selectedAppointment || undefined}
                  initialDate={appointmentDate}
                  initialTime={appointmentTime}
                  onSave={handleSaveAppointment}
                  onCancel={handleCancelAppointment}
                />
              </div>
            )}
          </div>
        )}

        {currentView === 'services' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <ServiceManager />
          </div>
        )}

        {currentView === 'products' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <ProductManager />
          </div>
        )}

        {currentView === 'inventory' && (
          <div className="bg-white rounded-lg shadow-md p-6 h-[80vh]">
            <InventoryManager />
          </div>
        )}

        {currentView === 'pos' && (
          <div className="bg-white rounded-lg shadow-md p-6 h-[85vh]">
            <POSSystem />
          </div>
        )}

        {currentView === 'receipts' && (
          <div className="bg-white rounded-lg shadow-md p-6 h-[85vh]">
            <ReceiptHistory />
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-amber-200 mt-12 py-6 text-center text-gray-600">
        <p>MA 2025/2026</p>
      </footer>
    </div>
  );
}

export default App;
