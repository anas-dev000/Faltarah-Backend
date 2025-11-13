// ==========================================
// accessories.calculations.js
// ==========================================

/**
 * Calculate total value of accessories
 */
export function calculateTotalValue(accessories) {
  if (!Array.isArray(accessories) || accessories.length === 0) {
    return 0;
  }

  return accessories.reduce((total, accessory) => {
    const value = (accessory.price || 0) * (accessory.stock || 0);
    return total + value;
  }, 0);
}

/**
 * Calculate average price of accessories
 */
export function calculateAveragePrice(accessories) {
  if (!Array.isArray(accessories) || accessories.length === 0) {
    return 0;
  }

  const total = accessories.reduce((sum, accessory) => {
    return sum + (accessory.price || 0);
  }, 0);

  return total / accessories.length;
}

/**
 * Calculate total stock quantity
 */
export function calculateTotalStock(accessories) {
  if (!Array.isArray(accessories) || accessories.length === 0) {
    return 0;
  }

  return accessories.reduce((total, accessory) => {
    return total + (accessory.stock || 0);
  }, 0);
}

/**
 * Get low stock accessories
 */
export function getLowStockAccessories(accessories, threshold = 10) {
  if (!Array.isArray(accessories)) {
    return [];
  }

  return accessories.filter(
    (accessory) => (accessory.stock || 0) <= threshold
  );
}

/**
 * Get out of stock accessories
 */
export function getOutOfStockAccessories(accessories) {
  if (!Array.isArray(accessories)) {
    return [];
  }

  return accessories.filter((accessory) => (accessory.stock || 0) === 0);
}

/**
 * Group accessories by category
 */
// export function groupByCategory(accessories) {
//   if (!Array.isArray(accessories)) {
//     return {};
//   }

//   return accessories.reduce((groups, accessory) => {
//     const category = accessory.category || "Uncategorized";

//     if (!groups[category]) {
//       groups[category] = {
//         category,
//         items: [],
//         totalStock: 0,
//         totalValue: 0,
//         count: 0,
//       };
//     }

//     groups[category].items.push(accessory);
//     groups[category].totalStock += accessory.stock || 0;
//     groups[category].totalValue +=
//       (accessory.price || 0) * (accessory.stock || 0);
//     groups[category].count += 1;

//     return groups;
//   }, {});
// }

/**
 * Group accessories by supplier
 */
export function groupBySupplier(accessories) {
  if (!Array.isArray(accessories)) {
    return {};
  }

  return accessories.reduce((groups, accessory) => {
    const supplierId = accessory.supplierId || "Unknown";
    const supplierName = accessory.supplier?.name || "Unknown Supplier";

    if (!groups[supplierId]) {
      groups[supplierId] = {
        supplierId,
        supplierName,
        items: [],
        totalStock: 0,
        totalValue: 0,
        count: 0,
      };
    }

    groups[supplierId].items.push(accessory);
    groups[supplierId].totalStock += accessory.stock || 0;
    groups[supplierId].totalValue +=
      (accessory.price || 0) * (accessory.stock || 0);
    groups[supplierId].count += 1;

    return groups;
  }, {});
}

/**
 * Calculate stock turnover rate
 * Note: Requires sales data which should be passed as parameter
 */
export function calculateStockTurnover(accessory, soldQuantity, period = "month") {
  if (!accessory || !soldQuantity) {
    return 0;
  }

  const currentStock = accessory.stock || 0;
  const averageStock = (currentStock + soldQuantity) / 2;

  if (averageStock === 0) {
    return 0;
  }

  // Calculate turnover rate
  const turnoverRate = soldQuantity / averageStock;

  // Annualize based on period
  const periodMultiplier = {
    day: 365,
    week: 52,
    month: 12,
    quarter: 4,
    year: 1,
  };

  return turnoverRate * (periodMultiplier[period] || 1);
}

/**
 * Calculate reorder point
 * Reorder Point = (Average Daily Usage × Lead Time) + Safety Stock
 */
export function calculateReorderPoint(
  averageDailyUsage,
  leadTimeDays,
  safetyStock = 0
) {
  if (!averageDailyUsage || !leadTimeDays) {
    return safetyStock;
  }

  return averageDailyUsage * leadTimeDays + safetyStock;
}

/**
 * Calculate economic order quantity (EOQ)
 * EOQ = √((2 × Annual Demand × Order Cost) / Holding Cost)
 */
export function calculateEOQ(annualDemand, orderCost, holdingCost) {
  if (!annualDemand || !orderCost || !holdingCost || holdingCost === 0) {
    return 0;
  }

  return Math.sqrt((2 * annualDemand * orderCost) / holdingCost);
}

/**
 * Get accessories statistics summary
 */
export function getStatisticsSummary(accessories) {
  if (!Array.isArray(accessories) || accessories.length === 0) {
    return {
      totalAccessories: 0,
      totalValue: 0,
      totalStock: 0,
      averagePrice: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      categoriesCount: 0,
      suppliersCount: 0,
    };
  }

  // const uniqueCategories = new Set(
  //   accessories.map((a) => a.category).filter(Boolean)
  // );
  const uniqueSuppliers = new Set(
    accessories.map((a) => a.supplierId).filter(Boolean)
  );

  return {
    totalAccessories: accessories.length,
    totalValue: calculateTotalValue(accessories),
    totalStock: calculateTotalStock(accessories),
    averagePrice: calculateAveragePrice(accessories),
    lowStockCount: getLowStockAccessories(accessories).length,
    outOfStockCount: getOutOfStockAccessories(accessories).length,
    // categoriesCount: uniqueCategories.size,
    suppliersCount: uniqueSuppliers.size,
  };
}

/**
 * Calculate price statistics
 */
export function calculatePriceStatistics(accessories) {
  if (!Array.isArray(accessories) || accessories.length === 0) {
    return {
      min: 0,
      max: 0,
      average: 0,
      median: 0,
      total: 0,
    };
  }

  const prices = accessories.map((a) => a.price || 0).sort((a, b) => a - b);
  const total = prices.reduce((sum, price) => sum + price, 0);
  const average = total / prices.length;

  const middle = Math.floor(prices.length / 2);
  const median =
    prices.length % 2 === 0
      ? (prices[middle - 1] + prices[middle]) / 2
      : prices[middle];

  return {
    min: prices[0] || 0,
    max: prices[prices.length - 1] || 0,
    average: average,
    median: median,
    total: total,
  };
}

/**
 * Calculate stock statistics
 */
export function calculateStockStatistics(accessories) {
  if (!Array.isArray(accessories) || accessories.length === 0) {
    return {
      min: 0,
      max: 0,
      average: 0,
      median: 0,
      total: 0,
    };
  }

  const stocks = accessories.map((a) => a.stock || 0).sort((a, b) => a - b);
  const total = stocks.reduce((sum, stock) => sum + stock, 0);
  const average = total / stocks.length;

  const middle = Math.floor(stocks.length / 2);
  const median =
    stocks.length % 2 === 0
      ? (stocks[middle - 1] + stocks[middle]) / 2
      : stocks[middle];

  return {
    min: stocks[0] || 0,
    max: stocks[stocks.length - 1] || 0,
    average: average,
    median: median,
    total: total,
  };
}

/**
 * Find top accessories by value
 */
export function getTopAccessoriesByValue(accessories, limit = 10) {
  if (!Array.isArray(accessories)) {
    return [];
  }

  return accessories
    .map((accessory) => ({
      ...accessory,
      totalValue: (accessory.price || 0) * (accessory.stock || 0),
    }))
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, limit);
}

/**
 * Find top accessories by stock
 */
export function getTopAccessoriesByStock(accessories, limit = 10) {
  if (!Array.isArray(accessories)) {
    return [];
  }

  return accessories
    .sort((a, b) => (b.stock || 0) - (a.stock || 0))
    .slice(0, limit);
}

/**
 * Calculate stock health score (0-100)
 * Based on stock level, turnover, and value
 */
export function calculateStockHealthScore(
  accessory,
  optimalStock = 100,
  turnoverRate = 0
) {
  if (!accessory) {
    return 0;
  }

  const currentStock = accessory.stock || 0;
  let score = 0;

  // Stock level score (0-40 points)
  if (currentStock === 0) {
    score += 0;
  } else if (currentStock < optimalStock * 0.3) {
    score += 10;
  } else if (currentStock < optimalStock * 0.5) {
    score += 20;
  } else if (currentStock <= optimalStock) {
    score += 40;
  } else if (currentStock <= optimalStock * 1.5) {
    score += 30;
  } else {
    score += 20;
  }

  // Turnover score (0-30 points)
  if (turnoverRate > 12) {
    score += 30;
  } else if (turnoverRate > 6) {
    score += 25;
  } else if (turnoverRate > 3) {
    score += 20;
  } else if (turnoverRate > 1) {
    score += 10;
  } else {
    score += 5;
  }

  // Value score (0-30 points)
  const value = (accessory.price || 0) * currentStock;
  if (value > 0) {
    score += 30;
  } else {
    score += 0;
  }

  return Math.min(100, Math.max(0, score));
}