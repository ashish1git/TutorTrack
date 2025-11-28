export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const calculateDuration = (start, end) => {
  if (!start || !end) return 0;
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  const startDate = new Date(0, 0, 0, startH, startM, 0);
  const endDate = new Date(0, 0, 0, endH, endM, 0);
  let diff = endDate.getTime() - startDate.getTime();
  if (diff < 0) return 0; // Invalid time range
  return diff / 1000 / 60 / 60; // Hours
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
};