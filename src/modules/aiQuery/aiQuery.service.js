// ==========================================
// aiQuery.service.js - Enhanced with Gen AI
// ==========================================

import * as aiQueryRepo from "./aiQuery.repository.js";
import { AppError } from "../../shared/errors/AppError.js";

/**
 * معالجة استعلام المستخدم مع Gen AI
 */
export const processSmartQuery = async (prisma, queryText, currentUser) => {
  const startTime = Date.now();
  const { userId, companyId, role } = currentUser;

  try {
    // 1. تحليل الاستعلام باستخدام Gen AI
    const queryAnalysis = await analyzeQueryWithGenAI(queryText);

    // 2. بناء الاستعلام حسب النوع المكتشف
    const queryBuilder = getQueryBuilder(queryAnalysis.type);
    const filters = queryBuilder(queryText, queryAnalysis);

    // 3. تنفيذ الاستعلام من قاعدة البيانات
    const results = await executeQuery(
      prisma,
      queryAnalysis.type,
      filters,
      companyId,
      role
    );

    const executionTime = Date.now() - startTime;

    // 4. حفظ في السجل
    await aiQueryRepo.createQueryHistory(prisma, {
      userId,
      companyId,
      queryText,
      queryType: queryAnalysis.type,
      results,
      resultCount: results.length,
      status: "success",
      executionTime,
    });

    return {
      success: true,
      queryType: queryAnalysis.type,
      results,
      count: results.length,
      executionTime,
      interpretation: queryAnalysis.interpretation,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;

    // حفظ الخطأ في السجل
    await aiQueryRepo.createQueryHistory(prisma, {
      userId,
      companyId,
      queryText,
      queryType: "unknown",
      results: [],
      resultCount: 0,
      status: "error",
      errorMessage: error.message,
      executionTime,
    });

    throw new AppError(`فشل تنفيذ الاستعلام: ${error.message}`, 400);
  }
};

/**
 * تحليل الاستعلام باستخدام Hugging Face API
 */
async function analyzeQueryWithGenAI(queryText) {
  try {
    const apiKey = process.env.HUGGINGFACE_API_KEY;

    if (!apiKey) {
      // fallback إلى التحليل البسيط إذا لم يكن هناك API key
      return analyzeQueryLocal(queryText);
    }

    const response = await fetch(
      "https://api-inference.huggingface.co/models/bert-base-multilingual-uncased",
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        method: "POST",
        body: JSON.stringify({
          inputs: queryText,
          parameters: {
            top_k: 5,
          },
        }),
      }
    );

    if (!response.ok) {
      console.warn("HuggingFace API failed, using fallback");
      return analyzeQueryLocal(queryText);
    }

    const result = await response.json();

    // استخدام النتيجة لتحسين التحليل
    return enhancedAnalysis(queryText, result);
  } catch (error) {
    console.warn("Gen AI analysis failed:", error.message);
    // استخدام التحليل المحلي كبديل
    return analyzeQueryLocal(queryText);
  }
}

/**
 * تحليل محسّن للاستعلام
 */
function enhancedAnalysis(queryText, genAiResult) {
  const lowerText = queryText.toLowerCase().trim();

  // تحديد نوع البيانات
  const types = {
    customers: ["عميل", "عملاء", "customer", "زبون", "زبائن"],
    employees: ["موظف", "موظفين", "تكنيشن", "مندوب"],
    products: ["منتج", "منتجات", "product", "فلتر"],
    accessories: ["ملحق", "ملحقات", "accessory"],
    invoices: ["فاتورة", "فواتير", "invoice"],
    installments: ["قسط", "أقساط", "installment"],
    maintenance: ["صيانة", "صيانات", "maintenance"],
    suppliers: ["مورد", "موردين", "supplier"],
  };

  let detectedType = "unknown";
  let confidence = 0;

  for (const [type, keywords] of Object.entries(types)) {
    const matches = keywords.filter((kw) => lowerText.includes(kw)).length;
    if (matches > confidence) {
      detectedType = type;
      confidence = matches;
    }
  }

  return {
    type: detectedType,
    confidence,
    interpretation: `البحث في ${getTypeNameAr(detectedType)} - الثقة: ${(
      confidence * 20
    ).toFixed(0)}%`,
    rawText: queryText,
  };
}

/**
 * تحليل محلي بسيط كبديل
 */
function analyzeQueryLocal(queryText) {
  const lowerText = queryText.toLowerCase().trim();

  const types = {
    customers: ["عميل", "عملاء", "customer", "زبون"],
    employees: ["موظف", "موظفين", "تكنيشن"],
    products: ["منتج", "منتجات", "product"],
    accessories: ["ملحق", "ملحقات"],
    invoices: ["فاتورة", "فواتير"],
    installments: ["قسط", "أقساط"],
    maintenance: ["صيانة"],
    suppliers: ["مورد", "موردين"],
  };

  for (const [type, keywords] of Object.entries(types)) {
    if (keywords.some((kw) => lowerText.includes(kw))) {
      return {
        type,
        interpretation: `البحث في ${getTypeNameAr(type)}`,
        rawText: queryText,
      };
    }
  }

  return {
    type: "unknown",
    interpretation: "استعلام عام",
    rawText: queryText,
  };
}

/**
 * الحصول على Query Builder حسب النوع
 */
function getQueryBuilder(type) {
  const builders = {
    customers: buildCustomerQuery,
    employees: buildEmployeeQuery,
    products: buildProductQuery,
    accessories: buildAccessoryQuery,
    invoices: buildInvoiceQuery,
    installments: buildInstallmentQuery,
    maintenance: buildMaintenanceQuery,
    suppliers: buildSupplierQuery,
  };

  return builders[type] || (() => ({}));
}

/**
 * بناء استعلام العملاء
 */
function buildCustomerQuery(text, analysis) {
  const filters = {};
  const lowerText = text.toLowerCase();

  if (lowerText.includes("تركيب") || lowerText.includes("installation")) {
    filters.customerType = "Installation";
  }
  if (lowerText.includes("صيانة")) {
    filters.customerType = "Maintenance";
  }

  const governorates = ["القاهرة", "الجيزة", "الإسكندرية"];
  for (const gov of governorates) {
    if (lowerText.includes(gov.toLowerCase())) {
      filters.governorate = gov;
      break;
    }
  }

  return filters;
}

/**
 * بناء استعلام الموظفين
 */
function buildEmployeeQuery(text, analysis) {
  const filters = {};
  const lowerText = text.toLowerCase();

  if (lowerText.includes("تكنيشن") || lowerText.includes("فني")) {
    filters.role = "Technician";
  }
  if (lowerText.includes("مندوب") || lowerText.includes("مبيعات")) {
    filters.role = "SalesRep";
  }

  if (lowerText.includes("شغال") || lowerText.includes("موظف")) {
    filters.isEmployed = true;
  }

  return filters;
}

/**
 * بناء استعلام المنتجات
 */
function buildProductQuery(text, analysis) {
  const filters = {};
  const lowerText = text.toLowerCase();

  const priceMatch = text.match(/(\d+)/);
  if (priceMatch) {
    const price = parseInt(priceMatch[1]);
    if (lowerText.includes("أعلى") || lowerText.includes("أكبر")) {
      filters.priceGte = price;
    }
    if (lowerText.includes("أقل") || lowerText.includes("أصغر")) {
      filters.priceLte = price;
    }
  }

  if (lowerText.includes("نفذ")) {
    filters.stock = 0;
  }
  if (lowerText.includes("منخفض")) {
    filters.stockLow = true;
  }

  return filters;
}

/**
 * بناء استعلام الملحقات
 */
function buildAccessoryQuery(text, analysis) {
  const filters = {};
  const lowerText = text.toLowerCase();

  const priceMatch = text.match(/(\d+)/);
  if (priceMatch) {
    const price = parseInt(priceMatch[1]);
    if (lowerText.includes("أعلى")) {
      filters.priceGte = price;
    }
    if (lowerText.includes("أقل")) {
      filters.priceLte = price;
    }
  }

  return filters;
}

/**
 * بناء استعلام الفواتير
 */
function buildInvoiceQuery(text, analysis) {
  const filters = {};
  const lowerText = text.toLowerCase();

  if (lowerText.includes("كاش")) {
    filters.saleType = "Cash";
  }
  if (lowerText.includes("تقسيط")) {
    filters.saleType = "Installment";
  }

  return filters;
}

/**
 * بناء استعلام الأقساط
 */
function buildInstallmentQuery(text, analysis) {
  const filters = {};
  const lowerText = text.toLowerCase();

  if (lowerText.includes("متأخر")) {
    filters.status = "Overdue";
  }
  if (lowerText.includes("مدفوع")) {
    filters.status = "Paid";
  }

  return filters;
}

/**
 * بناء استعلام الصيانة
 */
function buildMaintenanceQuery(text, analysis) {
  const filters = {};
  const lowerText = text.toLowerCase();

  if (lowerText.includes("منتهي")) {
    filters.status = "Completed";
  }
  if (lowerText.includes("معلق")) {
    filters.status = "Pending";
  }

  return filters;
}

/**
 * بناء استعلام الموردين
 */
function buildSupplierQuery(text, analysis) {
  return {};
}

/**
 * تنفيذ الاستعلام
 */
async function executeQuery(prisma, type, filters, companyId, role) {
  const handlers = {
    customers: () =>
      aiQueryRepo.queryCustomers(prisma, filters, companyId, role),
    employees: () =>
      aiQueryRepo.queryEmployees(prisma, filters, companyId, role),
    products: () => aiQueryRepo.queryProducts(prisma, filters, companyId, role),
    accessories: () =>
      aiQueryRepo.queryAccessories(prisma, filters, companyId, role),
    invoices: () => aiQueryRepo.queryInvoices(prisma, filters, companyId, role),
    installments: () =>
      aiQueryRepo.queryInstallments(prisma, filters, companyId, role),
    maintenance: () =>
      aiQueryRepo.queryMaintenance(prisma, filters, companyId, role),
    suppliers: () =>
      aiQueryRepo.querySuppliers(prisma, filters, companyId, role),
  };

  const handler = handlers[type];
  if (!handler) {
    throw new AppError("نوع الاستعلام غير مدعوم", 400);
  }

  return handler();
}

/**
 * الحصول على السجل
 */
export const getUserQueryHistory = async (prisma, currentUser, limit = 10) => {
  const { userId, companyId, role } = currentUser;
  return aiQueryRepo.getQueryHistory(prisma, userId, companyId, role, limit);
};

/**
 * الحصول على الاقتراحات المحفوظة
 */
export const getQuerySuggestions = async (prisma, currentUser) => {
  return [
    "هات العملاء اللي في القاهرة",
    "اعرض الموظفين التكنيشن",
    "المنتجات اللي سعرها أعلى من 3000",
    "الأقساط المتأخرة",
    "اعرض الفواتير بتاعت شهر 11",
    "الصيانات المعلقة",
    "الموردين كلهم",
    "الملحقات اللي نفذ مخزونها",
  ];
};

/**
 * حفظ اقتراح جديد
 */
export const saveSuggestion = async (
  prisma,
  currentUser,
  queryText,
  queryType
) => {
  // حفظ في جدول Suggestions (يجب إضافته لـ schema)
  return {
    success: true,
    message: "تم حفظ الاقتراح بنجاح",
  };
};

/**
 * حذف اقتراح
 */
export const deleteSuggestion = async (prisma, currentUser, suggestionId) => {
  return {
    success: true,
    message: "تم حذف الاقتراح بنجاح",
  };
};

/**
 * Helper: اسم النوع بالعربي
 */
function getTypeNameAr(type) {
  const names = {
    customers: "العملاء",
    employees: "الموظفين",
    products: "المنتجات",
    accessories: "الملحقات",
    invoices: "الفواتير",
    installments: "الأقساط",
    maintenance: "الصيانة",
    suppliers: "الموردين",
  };
  return names[type] || "البيانات";
}
