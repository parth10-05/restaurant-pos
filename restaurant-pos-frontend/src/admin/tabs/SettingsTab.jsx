import { useState } from 'react';
import ReceiptSettings from '../settings/ReceiptSettings';

export default function SettingsTab() {
  const [activeSection, setActiveSection] = useState('receipt');

  const sections = [
    { id: 'general', label: 'General', disabled: true },
    { id: 'pos', label: 'POS Behavior', disabled: true },
    { id: 'payments', label: 'Payments', disabled: true },
    { id: 'receipt', label: 'Receipt Template', disabled: false }
  ];

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-neutral-200 p-4">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Settings</h2>
        <nav className="space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => !section.disabled && setActiveSection(section.id)}
              disabled={section.disabled}
              className={`w-full text-left px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeSection === section.id
                  ? 'bg-neutral-900 text-white'
                  : section.disabled
                  ? 'text-neutral-400 cursor-not-allowed'
                  : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              {section.label}
              {section.disabled && (
                <span className="ml-2 text-xs">(Coming Soon)</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {activeSection === 'receipt' && (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-neutral-900">Receipt Template</h1>
              <p className="text-sm text-neutral-600 mt-1">
                Configure how receipts are generated for paid orders
              </p>
            </div>
            <ReceiptSettings />
          </div>
        )}

        {activeSection === 'general' && (
          <div className="text-center text-neutral-500 mt-20">
            General settings coming soon
          </div>
        )}

        {activeSection === 'pos' && (
          <div className="text-center text-neutral-500 mt-20">
            POS behavior settings coming soon
          </div>
        )}

        {activeSection === 'payments' && (
          <div className="text-center text-neutral-500 mt-20">
            Payment settings coming soon
          </div>
        )}
      </div>
    </div>
  );
}
