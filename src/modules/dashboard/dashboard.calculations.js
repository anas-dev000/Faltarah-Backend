/**
 * Dashboard Calculations
 * Helper functions for dashboard metrics calculations
 */

/**
 * Calculate date range for current month
 */
export const getCurrentMonthRange = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  
  return { firstDay, lastDay };
};

/**
 * Calculate date range for upcoming period (days from now)
 */
export const getUpcomingDateRange = (days = 30) => {
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + days);
  
  return { startDate: today, endDate: futureDate };
};

/**
 * Calculate percentage change between two values
 */
export const calculatePercentageChange = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

/**
 * Format currency (EGP)
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
  }).format(amount);
};

/**
 * Calculate installment progress percentage
 */
export const calculateInstallmentProgress = (amountPaid, totalAmount) => {
  if (totalAmount === 0) return 0;
  return (amountPaid / totalAmount) * 100;
};

/**
 * Check if date is overdue
 */
export const isOverdue = (dueDate) => {
  return new Date(dueDate) < new Date();
};

/**
 * Calculate days until date
 */
export const daysUntil = (targetDate) => {
  const today = new Date();
  const target = new Date(targetDate);
  const diffTime = target - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Calculate total from installment details
 */
export const calculateInstallmentTotal = (
  monthlyInstallment,
  numberOfMonths,
  paidAtContract,
  paidAtInstallation
) => {
  return (
    Number(monthlyInstallment) * numberOfMonths +
    Number(paidAtContract) +
    Number(paidAtInstallation)
  );
};

/**
 * Group data by period (day, week, month)
 */
export const groupByPeriod = (data, dateField, period = "month") => {
  const grouped = {};
  
  data.forEach((item) => {
    const date = new Date(item[dateField]);
    let key;
    
    switch (period) {
      case "day":
        key = date.toISOString().split("T")[0];
        break;
      case "week":
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split("T")[0];
        break;
      case "month":
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        break;
      case "year":
        key = date.getFullYear().toString();
        break;
      default:
        key = date.toISOString();
    }
    
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(item);
  });
  
  return grouped;
};

/**
 * Calculate average from array of numbers
 */
export const calculateAverage = (numbers) => {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, num) => acc + Number(num), 0);
  return sum / numbers.length;
};

/**
 * Get status badge color
 */
export const getStatusBadgeColor = (status) => {
  const colors = {
    Pending: "yellow",
    Completed: "green",
    Cancelled: "red",
    Overdue: "red",
    Active: "green",
    Inactive: "gray",
    Paid: "green",
    Partial: "yellow",
  };
  
  return colors[status] || "gray";
};