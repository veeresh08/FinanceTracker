// Currency formatting utility for Indian Rupees
export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  if (currency === 'INR') {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 })}`;
  }
  return `$${amount.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
};

// Format month name
export const getMonthName = (month: string): string => {
  const months: Record<string, string> = {
    '01': 'January', '02': 'February', '03': 'March', '04': 'April',
    '05': 'May', '06': 'June', '07': 'July', '08': 'August',
    '09': 'September', '10': 'October', '11': 'November', '12': 'December'
  };
  return months[month] || month;
};

// Get current month and year
export const getCurrentMonth = (): string => {
  const date = new Date();
  return `${(date.getMonth() + 1).toString().padStart(2, '0')}`;
};

export const getCurrentYear = (): number => {
  return new Date().getFullYear();
};


