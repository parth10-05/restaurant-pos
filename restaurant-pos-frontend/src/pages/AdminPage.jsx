import React, { useState } from 'react';
import { useAuthStore } from '../store/auth.store';
import PosTab from '../admin/tabs/PosTab';
import ProductsTab from '../admin/tabs/ProductsTab';
import ReportsTab from '../admin/tabs/ReportsTab';
import SettingsTab from '../admin/tabs/SettingsTab';
import FloorTablesTab from '../admin/tabs/FloorTablesTab';

export default function AdminPage() {
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState('pos');

  const tabs = [
    { id: 'pos', label: 'POS' },
    { id: 'products', label: 'Products' },
    { id: 'floors', label: 'Floors & Tables' },
    { id: 'reports', label: 'Reports' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-semibold text-neutral-900">Admin Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-neutral-600">{user?.email}</span>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 border border-neutral-300 rounded-md hover:bg-neutral-50 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-neutral-900 text-neutral-900'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'pos' && <PosTab />}
        {activeTab === 'products' && <ProductsTab />}
        {activeTab === 'floors' && <FloorTablesTab />}
        {activeTab === 'reports' && <ReportsTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </main>
    </div>
  );
}
