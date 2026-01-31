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
      <header className="bg-white border-b-2 border-neutral-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-bold text-neutral-900 uppercase tracking-wide">Admin Dashboard</h1>
              <p className="text-xs text-neutral-500 font-medium">Management Portal</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-semibold text-neutral-900">{user?.email}</div>
                <div className="text-xs text-neutral-500 font-medium uppercase">{user?.role}</div>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-bold text-neutral-700 hover:text-neutral-900 border-2 border-neutral-300 rounded-lg hover:bg-neutral-50 transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-neutral-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-6 border-b-2 font-bold text-sm uppercase tracking-wide transition-all ${
                  activeTab === tab.id
                    ? 'border-neutral-900 text-neutral-900 bg-neutral-50'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
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
