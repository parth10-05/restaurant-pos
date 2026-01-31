import { useState } from 'react';
import { downloadReceipt } from '../services/settings.service';

export default function ReceiptDownloadButton({ orderId, orderStatus, className = '' }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  const isPaid = orderStatus === 'paid';

  const handleDownload = async () => {
    if (!isPaid) return;

    setDownloading(true);
    setError(null);

    try {
      await downloadReceipt(orderId);
    } catch (err) {
      console.error('Error downloading receipt:', err);
      setError('Failed to download receipt');
      setTimeout(() => setError(null), 3000);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleDownload}
        disabled={!isPaid || downloading}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          isPaid
            ? 'bg-neutral-900 text-white hover:bg-neutral-800'
            : 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
        } disabled:opacity-50 ${className}`}
        title={!isPaid ? 'Only paid orders can generate receipts' : 'Download receipt PDF'}
      >
        {downloading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Downloading...
          </>
        ) : (
          <>
            <svg className="w-4 h-4 inline-block mr-2 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Receipt
          </>
        )}
      </button>

      {error && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-red-50 text-red-800 text-xs px-3 py-2 rounded-md border border-red-200">
          {error}
        </div>
      )}
    </div>
  );
}
