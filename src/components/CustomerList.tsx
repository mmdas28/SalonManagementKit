import { useState, useEffect } from 'react';
import { User, Plus, Search, Eye } from 'lucide-react';
import { CustomerService } from '../db/service';
import type { Customer } from '../types';

interface CustomerListProps {
  onSelectCustomer: (customer: Customer) => void;
  onNewCustomer: () => void;
}

export default function CustomerList({ onSelectCustomer, onNewCustomer }: CustomerListProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      CustomerService.search(searchQuery).then(setFilteredCustomers);
    } else {
      setFilteredCustomers(customers);
    }
  }, [searchQuery, customers]);

  const loadCustomers = async () => {
    const data = await CustomerService.getAll();
    setCustomers(data);
    setFilteredCustomers(data);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">العملاء</h2>
        <button
          onClick={onNewCustomer}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
        >
          <Plus size={20} />
          <span>عميل جديد</span>
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="بحث بالاسم، الهاتف، أو البريد الإلكتروني..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <User size={48} className="mx-auto mb-4 opacity-50" />
            <p>لم يتم العثور على عملاء</p>
          </div>
        ) : (
          filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onSelectCustomer(customer)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-800">{customer.name}</h3>
                  <p className="text-gray-600">{customer.phone}</p>
                  {customer.email && <p className="text-gray-500 text-sm">{customer.email}</p>}
                </div>
                <Eye size={20} className="text-gray-400" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
