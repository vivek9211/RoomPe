/**
 * Format currency amount with proper Indian number formatting
 * @param amount - The amount to format
 * @param currency - The currency symbol (default: '₹')
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, currency: string = '₹'): string => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return `${currency}0`;
  }
  
  // Format with Indian number system (lakhs, crores)
  return `${currency}${amount.toLocaleString('en-IN')}`;
};

/**
 * Format currency amount with decimal places
 * @param amount - The amount to format
 * @param decimals - Number of decimal places (default: 2)
 * @param currency - The currency symbol (default: '₹')
 * @returns Formatted currency string with decimals
 */
export const formatCurrencyWithDecimals = (amount: number, decimals: number = 2, currency: string = '₹'): string => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return `${currency}0.00`;
  }
  
  return `${currency}${amount.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}`;
};

/**
 * Parse currency string to number
 * @param currencyString - Currency string like "₹1,23,456"
 * @returns Parsed number
 */
export const parseCurrency = (currencyString: string): number => {
  if (!currencyString || typeof currencyString !== 'string') {
    return 0;
  }
  
  // Remove currency symbol and commas
  const cleanString = currencyString.replace(/[₹,]/g, '');
  const parsed = parseFloat(cleanString);
  
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Format amount in paise to rupees
 * @param paise - Amount in paise
 * @returns Formatted currency string in rupees
 */
export const formatPaiseToRupees = (paise: number): string => {
  const rupees = paise / 100;
  return formatCurrency(rupees);
};

/**
 * Convert rupees to paise
 * @param rupees - Amount in rupees
 * @returns Amount in paise
 */
export const convertRupeesToPaise = (rupees: number): number => {
  return Math.round(rupees * 100);
};

/**
 * Calculate percentage of amount
 * @param amount - Base amount
 * @param percentage - Percentage to calculate
 * @returns Calculated amount
 */
export const calculatePercentage = (amount: number, percentage: number): number => {
  return (amount * percentage) / 100;
};

/**
 * Format amount with K, L, Cr suffixes for large numbers
 * @param amount - Amount to format
 * @param currency - Currency symbol (default: '₹')
 * @returns Formatted string with suffixes
 */
export const formatCurrencyCompact = (amount: number, currency: string = '₹'): string => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return `${currency}0`;
  }
  
  if (amount >= 10000000) { // 1 crore
    return `${currency}${(amount / 10000000).toFixed(1)}Cr`;
  } else if (amount >= 100000) { // 1 lakh
    return `${currency}${(amount / 100000).toFixed(1)}L`;
  } else if (amount >= 1000) { // 1 thousand
    return `${currency}${(amount / 1000).toFixed(1)}K`;
  } else {
    return formatCurrency(amount, currency);
  }
};

/**
 * Validate if amount is a valid positive number
 * @param amount - Amount to validate
 * @returns True if valid, false otherwise
 */
export const isValidAmount = (amount: any): boolean => {
  return typeof amount === 'number' && !isNaN(amount) && amount >= 0;
};

/**
 * Get currency symbol based on currency code
 * @param currencyCode - Currency code (INR, USD, etc.)
 * @returns Currency symbol
 */
export const getCurrencySymbol = (currencyCode: string = 'INR'): string => {
  const symbols: { [key: string]: string } = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥'
  };
  
  return symbols[currencyCode.toUpperCase()] || '₹';
};

/**
 * Format amount for display in payment cards
 * @param amount - Amount to format
 * @param showDecimals - Whether to show decimal places
 * @returns Formatted string for UI display
 */
export const formatPaymentAmount = (amount: number, showDecimals: boolean = false): string => {
  if (showDecimals) {
    return formatCurrencyWithDecimals(amount);
  } else {
    return formatCurrency(amount);
  }
};

/**
 * Calculate late fee based on days overdue
 * @param daysOverdue - Number of days overdue
 * @param dailyLateFee - Daily late fee amount (default: 50)
 * @returns Total late fee amount
 */
export const calculateLateFee = (daysOverdue: number, dailyLateFee: number = 50): number => {
  return Math.max(0, daysOverdue * dailyLateFee);
};

/**
 * Format date for display
 * @param date - Date object or timestamp
 * @returns Formatted date string
 */
export const formatDate = (date: Date | any): string => {
  if (!date) return 'N/A';
  
  let dateObj: Date;
  
  if (date instanceof Date) {
    dateObj = date;
  } else if (date.toDate && typeof date.toDate === 'function') {
    // Firestore timestamp
    dateObj = date.toDate();
  } else if (typeof date === 'number' || typeof date === 'string') {
    dateObj = new Date(date);
  } else {
    return 'N/A';
  }
  
  if (isNaN(dateObj.getTime())) {
    return 'N/A';
  }
  
  return dateObj.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format date and time for display
 * @param date - Date object or timestamp
 * @returns Formatted date and time string
 */
export const formatDateTime = (date: Date | any): string => {
  if (!date) return 'N/A';
  
  let dateObj: Date;
  
  if (date instanceof Date) {
    dateObj = date;
  } else if (date.toDate && typeof date.toDate === 'function') {
    // Firestore timestamp
    dateObj = date.toDate();
  } else if (typeof date === 'number' || typeof date === 'string') {
    dateObj = new Date(date);
  } else {
    return 'N/A';
  }
  
  if (isNaN(dateObj.getTime())) {
    return 'N/A';
  }
  
  return dateObj.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};