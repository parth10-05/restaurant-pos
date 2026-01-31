import React from 'react';
import { useAuthStore } from '../store/auth.store';

export default function KitchenPage() {
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200">
        <div className="container mx-auto px-4">
          <div className="h-16 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-neutral-900">Kitchen Display</h1>
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
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg border border-neutral-200 p-8">
          <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Kitchen Orders</h2>
          <p className="text-neutral-600">This is the kitchen display system.</p>
        </div>
      </main>
    </div>
  );
}
