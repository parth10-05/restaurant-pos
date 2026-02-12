import React from 'react';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white">
        <div className="container mx-auto px-4">
          <div className="h-16 flex items-center">
            <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">
              Restaurant POS System
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white">
        <div className="container mx-auto px-4">
          <div className="h-14 flex items-center justify-center text-sm text-neutral-500">
            © 2026 Restaurant POS System. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
