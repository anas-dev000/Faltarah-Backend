// ==========================================
// products.calculations.js
// ==========================================

/**
 * Calculate total value of products
 */
export function calculateTotalValue(products) {
  if (!Array.isArray(products) || products.length === 0) {
    return 0;
  }

  return products.reduce((total, product) => {
    const value = (product.price || 0) * (product.stock || 0);
    return total + value;
  }, 0);
}

/**
 * Calculate average price of products
 */
export function calculateAveragePrice(products) {
  if (!Array.isArray(products) || products.length === 0) {
    return 0;
  }

  const total = products.reduce((sum, product) => {
    return sum + (product.price || 0);
  }, 0);

  return total / products.length;
}

/**
 * Calculate total stock quantity
 */
export function calculateTotalStock(products) {
  if (!Array.isArray(products) || products.length === 0) {
    return 0;
  }

  return products.reduce((total, product) => {
    return total + (product.stock || 0);
  }, 0);
}

/**
 * Get low stock products
 */
export function getLowStockProducts(products, threshold = 10) {
  if (!Array.isArray(products)) {
    return [];
  }

  return products.filter((product) => (product.stock || 0) <= threshold);
}

/**
 * Get out of stock products
 */
export function getOutOfStockProducts(products) {
  if (!Array.isArray(products)) {
    return [];
  }

  return products.filter((product) => (product.stock || 0) === 0);
}

/**
 * Group products by category
 */
export function groupByCategory(products) {
  if (!Array.isArray(products)) {
    return {};
  }

  return products.reduce((groups, product) => {
    const category = product.category || "Uncategorized";

    if (!groups[category]) {
      groups[category] = {
        category,
        items: [],
        totalStock: 0,
        totalValue: 0,
        count: 0,
      };
    }

    groups[category].items.push(product);
    groups[category].totalStock += product.stock || 0;
    groups[category].totalValue +=
      (product.price || 0) * (product.stock || 0);
    groups[category].count += 1;

    return groups;
  }, {});
}

/**
 * Group products by supplier
 */
export function groupBySupplier(products) {
  if (!Array.isArray(products)) {
    return {};
  }

  return products.reduce((groups, product) => {
    const supplierId = product.supplierId || "Unknown";
    const supplierName = product.supplier?.name || "Unknown Supplier";

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

    groups[supplierId].items.push(product);
    groups[supplierId].totalStock += product.stock || 0;
    groups[supplierId].totalValue +=
      (product.price || 0) * (product.stock || 0);
    groups[supplierId].count += 1;

    return groups;
  }, {});
}

/**
 * Calculate product profitability
 * Assuming cost is a percentage of price (default 60%)
 */
export function calculateProfitability(product, costPercentage = 0.6) {
  if (!product || !product.price) {
    return {
      cost: 0,
      profit: 0,
      profitMargin: 0,
      totalProfit: 0,
    };
  }

  const cost = product.price * costPercentage;
  const profit = product.price - cost;
  const profitMargin = (profit / product.price) * 100;
  const totalProfit = profit * (product.stock || 0);

  return {
    cost: parseFloat(cost.toFixed(2)),
    profit: parseFloat(profit.toFixed(2)),
    profitMargin: parseFloat(profitMargin.toFixed(2)),
    totalProfit: parseFloat(totalProfit.toFixed(2)),
  };
}

/**
 * Calculate stock turnover rate
 * Note: Requires sales data which should be passed as parameter
 */
export function calculateStockTurnover(product, soldQuantity, period = "month") {
  if (!product || !soldQuantity) {
    return 0;
  }

  const currentStock = product.stock || 0;
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
 * Get products statistics summary
 */
export function getStatisticsSummary(products) {
  if (!Array.isArray(products) || products.length === 0) {
    return {
      totalProducts: 0,
      totalValue: 0,
      totalStock: 0,
      averagePrice: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      categoriesCount: 0,
      suppliersCount: 0,
    };
  }

  const uniqueCategories = new Set(
    products.map((p) => p.category).filter(Boolean)
  );
  const uniqueSuppliers = new Set(
    products.map((p) => p.supplierId).filter(Boolean)
  );

  return {
    totalProducts: products.length,
    totalValue: calculateTotalValue(products),
    totalStock: calculateTotalStock(products),
    averagePrice: calculateAveragePrice(products),
    lowStockCount: getLowStockProducts(products).length,
    outOfStockCount: getOutOfStockProducts(products).length,
    categoriesCount: uniqueCategories.size,
    suppliersCount: uniqueSuppliers.size,
  };
}

/**
 * Calculate price statistics
 */
export function calculatePriceStatistics(products) {
  if (!Array.isArray(products) || products.length === 0) {
    return {
      min: 0,
      max: 0,
      average: 0,
      median: 0,
      total: 0,
    };
  }

  const prices = products.map((p) => p.price || 0).sort((a, b) => a - b);
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
export function calculateStockStatistics(products) {
  if (!Array.isArray(products) || products.length === 0) {
    return {
      min: 0,
      max: 0,
      average: 0,
      median: 0,
      total: 0,
    };
  }

  const stocks = products.map((p) => p.stock || 0).sort((a, b) => a - b);
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
 * Find top products by value
 */
export function getTopProductsByValue(products, limit = 10) {
  if (!Array.isArray(products)) {
    return [];
  }

  return products
    .map((product) => ({
      ...product,
      totalValue: (product.price || 0) * (product.stock || 0),
    }))
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, limit);
}

/**
 * Find top products by stock
 */
export function getTopProductsByStock(products, limit = 10) {
  if (!Array.isArray(products)) {
    return [];
  }

  return products.sort((a, b) => (b.stock || 0) - (a.stock || 0)).slice(0, limit);
}

/**
 * Calculate product with accessories total cost
 */
export function calculateProductWithAccessoriesCost(product) {
  if (!product) {
    return {
      productValue: 0,
      accessoriesValue: 0,
      totalValue: 0,
      accessoriesCount: 0,
    };
  }

  const productValue = (product.price || 0) * (product.stock || 0);

  let accessoriesValue = 0;
  let accessoriesCount = 0;

  if (product.productAccessories && Array.isArray(product.productAccessories)) {
    product.productAccessories.forEach((pa) => {
      if (pa.accessory) {
        accessoriesValue +=
          (pa.accessory.price || 0) * (pa.accessory.stock || 0);
        accessoriesCount += 1;
      }
    });
  }

  return {
    productValue: parseFloat(productValue.toFixed(2)),
    accessoriesValue: parseFloat(accessoriesValue.toFixed(2)),
    totalValue: parseFloat((productValue + accessoriesValue).toFixed(2)),
    accessoriesCount,
  };
}

/**
 * Calculate stock health score (0-100)
 * Based on stock level, turnover, and value
 */
export function calculateStockHealthScore(
  product,
  optimalStock = 100,
  turnoverRate = 0
) {
  if (!product) {
    return 0;
  }

  const currentStock = product.stock || 0;
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
  const value = (product.price || 0) * currentStock;
  if (value > 0) {
    score += 30;
  } else {
    score += 0;
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Compare products performance
 */
export function compareProductsPerformance(products, salesData = {}) {
  if (!Array.isArray(products) || products.length === 0) {
    return [];
  }

  return products.map((product) => {
    const sales = salesData[product.id] || 0;
    const revenue = sales * (product.price || 0);
    const stockValue = (product.price || 0) * (product.stock || 0);
    const turnover = calculateStockTurnover(product, sales);

    return {
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock,
      sales,
      revenue,
      stockValue,
      turnover,
      profitability: calculateProfitability(product),
    };
  });
}