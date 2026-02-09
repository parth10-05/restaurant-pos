/**
 * Format a duration in milliseconds to human-readable format
 * @param {number} ms - Duration in milliseconds
 * @param {Object} options - Formatting options
 * @param {boolean} options.short - Use short format (1d 2h 3m) vs long (1 day 2 hours 3 minutes)
 * @param {boolean} options.showSeconds - Include seconds for short durations
 * @returns {string} Formatted duration string
 */
export function formatDuration(ms, { short = true, showSeconds = false } = {}) {
  if (ms === null || ms === undefined || isNaN(ms)) return 'N/A';
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const remainingHours = hours % 24;
  const remainingMinutes = minutes % 60;
  const remainingSeconds = seconds % 60;

  const parts = [];

  if (short) {
    if (days > 0) parts.push(`${days}d`);
    if (remainingHours > 0) parts.push(`${remainingHours}h`);
    if (remainingMinutes > 0 || parts.length === 0) parts.push(`${remainingMinutes}m`);
    if (showSeconds && parts.length < 2 && remainingSeconds > 0) {
      parts.push(`${remainingSeconds}s`);
    }
  } else {
    if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
    if (remainingHours > 0) parts.push(`${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`);
    if (remainingMinutes > 0 || parts.length === 0) {
      parts.push(`${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`);
    }
    if (showSeconds && parts.length < 2 && remainingSeconds > 0) {
      parts.push(`${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`);
    }
  }

  return parts.join(' ');
}

/**
 * Format duration from minutes
 * @param {number} totalMinutes - Duration in minutes
 * @param {Object} options - Formatting options
 * @returns {string} Formatted duration string
 */
export function formatDurationFromMinutes(totalMinutes, options = {}) {
  return formatDuration(totalMinutes * 60 * 1000, options);
}

/**
 * Format duration from seconds
 * @param {number} totalSeconds - Duration in seconds
 * @param {Object} options - Formatting options
 * @returns {string} Formatted duration string
 */
export function formatDurationFromSeconds(totalSeconds, options = {}) {
  return formatDuration(totalSeconds * 1000, options);
}

/**
 * Format relative time (e.g., "5 mins ago", "2 hours ago")
 * @param {Date|string|number} date - The date to compare
 * @returns {string} Relative time string
 */
export function formatRelativeTime(date) {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  
  if (diffMs < 0) return 'just now';
  
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'just now';
  if (diffMinutes === 1) return '1 min ago';
  if (diffMinutes < 60) return `${diffMinutes} mins ago`;
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}

/**
 * Calculate elapsed duration between two dates
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date (defaults to now)
 * @returns {string} Formatted duration
 */
export function formatElapsedTime(startDate, endDate = new Date()) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end - start;
  return formatDuration(diffMs);
}

/**
 * Format currency in Indian Rupees
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '₹0.00';
  return `₹${amount.toLocaleString('en-IN', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
}

/**
 * Format date for display
 * @param {Date|string} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatDate(date, options = { dateStyle: 'medium', timeStyle: 'short' }) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('en-US', options);
}
