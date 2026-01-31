import { useState, useEffect } from 'react';
import { getReceiptSettings, updateReceiptSettings } from '../../services/settings.service';

export default function ReceiptSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await getReceiptSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const updated = await updateReceiptSettings(settings);
      setSettings(updated);
      setMessage({ type: 'success', text: 'Settings saved successfully' });
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-neutral-600">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Header Section */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Receipt Header</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Restaurant Name *
              </label>
              <input
                type="text"
                value={settings.restaurantName}
                onChange={(e) => handleChange('restaurantName', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Address
              </label>
              <textarea
                value={settings.address || ''}
                onChange={(e) => handleChange('address', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  value={settings.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  GST / Tax ID
                </label>
                <input
                  type="text"
                  value={settings.gstNumber || ''}
                  onChange={(e) => handleChange('gstNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content Toggles Section */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Receipt Content</h3>
          
          <div className="space-y-3">
            {[
              { field: 'showOrderNumber', label: 'Show Order Number' },
              { field: 'showCashier', label: 'Show Cashier Name' },
              { field: 'showPaymentMethod', label: 'Show Payment Method' },
              { field: 'showItemTax', label: 'Show Item-wise Tax' },
              { field: 'showTotalTax', label: 'Show Total Tax' },
              { field: 'showQrCode', label: 'Show QR Code' }
            ].map(({ field, label }) => (
              <label key={field} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings[field]}
                  onChange={(e) => handleChange(field, e.target.checked)}
                  className="w-4 h-4 text-neutral-900 border-neutral-300 rounded focus:ring-neutral-900"
                />
                <span className="text-sm text-neutral-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Layout Options Section */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Layout Options</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Paper Width
              </label>
              <select
                value={settings.paperWidth}
                onChange={(e) => handleChange('paperWidth', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-900"
              >
                <option value="58mm">58mm (Thermal)</option>
                <option value="80mm">80mm (Thermal)</option>
                <option value="A4">A4 (Standard)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Font Scale
              </label>
              <select
                value={settings.fontScale}
                onChange={(e) => handleChange('fontScale', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-900"
              >
                <option value="small">Small</option>
                <option value="normal">Normal</option>
                <option value="large">Large</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Receipt Footer</h3>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Custom Footer Text
            </label>
            <textarea
              value={settings.footerText || ''}
              onChange={(e) => handleChange('footerText', e.target.value)}
              rows={3}
              placeholder="e.g., Thank you for your patronage!"
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
            <p className="text-xs text-neutral-500 mt-1">
              This text will appear at the bottom of every receipt
            </p>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-neutral-900 text-white rounded-md hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
