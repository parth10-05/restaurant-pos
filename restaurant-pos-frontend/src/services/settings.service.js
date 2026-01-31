import { api } from '../config/api';

// Get receipt settings
export const getReceiptSettings = async () => {
  const response = await api.get('/admin/settings/receipt');
  return response.data;
};

// Update receipt settings
export const updateReceiptSettings = async (settings) => {
  const response = await api.put('/admin/settings/receipt', settings);
  return response.data;
};

// Download receipt for an order
export const downloadReceipt = async (orderId) => {
  const response = await api.get(`/orders/${orderId}/receipt`, {
    responseType: 'blob'
  });
  
  // Create blob URL and trigger download
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `receipt-${orderId.substring(0, 8)}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
