// src/modules/aiQuery/aiQuery.service.js
// ==========================================
// AI Query Service - مع RAG Integration (FIXED VERSION)
// ==========================================

import * as aiQueryRepo from "./aiQuery.repository.js";
import { AppError } from "../../shared/errors/AppError.js";
import {
  createEmbedding,
  retrieveSimilarChunks,
  buildRAGContext,
  generateRAGResponse,
} from "../../shared/utils/rag.service.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
let genAI = null;

if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
}

/**
 * معالجة الاستعلام الذكي مع RAG
 */
export const processSmartQuery = async (prisma, queryText, currentUser) => {
  const startTime = Date.now();
  const { userId, companyId, role } = currentUser;

  try {
    console.log(`🔍 Processing query: "${queryText}"`);

    // 1. تحليل الاستعلام
    const queryAnalysis = await analyzeQueryWithAI(queryText);
    console.log(`📊 Query type detected: ${queryAnalysis.type}`);

    // 2. إنشاء embedding للاستعلام
    const queryEmbedding = await createEmbedding(queryText);
    console.log(`✅ Query embedding created`);

    // 3. البحث عن بيانات مشابهة (RAG Retrieval)
    const similarChunks = await retrieveSimilarChunks(
      prisma,
      companyId,
      queryEmbedding,
      10
    );
    console.log(`📚 Retrieved ${similarChunks.length} similar chunks`);

    // 4. بناء السياق
    const ragContext = buildRAGContext(similarChunks, queryAnalysis.type);

    // 5. استخراج الفلاتر من النص
    const queryBuilder = getQueryBuilder(queryAnalysis.type);
    const filters = queryBuilder(queryText, queryAnalysis);
    const extractedFilters = extractFiltersFromQuery(
      queryText,
      queryAnalysis.type
    );
    Object.assign(filters, extractedFilters);

    // ✅ FIXED: Debug filters before query execution
    console.log(
      `🔍 Extracted filters for ${queryAnalysis.type}:`,
      JSON.stringify(filters, null, 2)
    );

    // 6. تنفيذ الاستعلام
    const results = await executeQuery(
      prisma,
      queryAnalysis.type,
      filters,
      companyId,
      role
    );

    console.log(`✅ Found ${results.length} results from database`);

    // 7. توليد الإجابة بـ AI مع RAG Context
    let aiAnswer = await generateRAGResponse(queryText, ragContext, results);

    // ✅ FIXED: Improved fallback logic for empty results
    if (results.length === 0) {
      aiAnswer = `لم يتم العثور على نتائج مطابقة لاستعلامك "${queryText}". يرجى تعديل الشروط أو التحقق من البيانات.`;
    } else if (aiAnswer.includes("لم يتم العثور") && results.length > 0) {
      aiAnswer = `تم العثور على ${results.length} نتيجة مناسبة بناءً على استعلامك "${queryText}". إليك التفاصيل:`;
    }

    const executionTime = Date.now() - startTime;

    // 8. حفظ في السجل
    await aiQueryRepo.createQueryHistory(prisma, {
      userId,
      companyId,
      queryText,
      queryType: queryAnalysis.type,
      results: {
        results,
        ragContext: ragContext.substring(0, 500),
        similarChunks: similarChunks.length,
      },
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
      aiAnswer,
      ragMetadata: {
        chunksRetrieved: similarChunks.length,
        topSimilarity:
          similarChunks.length > 0
            ? (similarChunks[0].similarity * 100).toFixed(1)
            : 0,
      },
    };
  } catch (error) {
    console.error("❌ Query processing failed:", error);

    const executionTime = Date.now() - startTime;

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
 * تحليل الاستعلام بـ AI (IMPROVED PROMPT)
 */
async function analyzeQueryWithAI(queryText) {
  try {
    if (!genAI) {
      return analyzeQueryLocal(queryText);
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // ✅ FIXED: Enhanced prompt for better accuracy and context awareness
    const prompt = `أنت محلل استعلامات ذكي متخصص في أنظمة إدارة الفواتير والعملاء. حلل الاستعلام بعناية وحدد نوع البيانات المطلوبة فقط بناءً على الكلمات الرئيسية الواضحة. تجنب الافتراضات غير المدعومة.

الاستعلام: "${queryText}"

الأنواع المتاحة (اختر واحداً فقط بناءً على السياق الواضح):
- customer: إذا كان يذكر "عميل" أو "عملاء" أو "زبون"
- employee: إذا كان يذكر "موظف" أو "تكنيشن" أو "منديب"
- product: إذا كان يذكر "منتج" أو "فلتر" أو "منتجات"
- accessory: إذا كان يذكر "ملحق" أو "اكسسوار"
- invoice: إذا كان يذكر "فاتورة" أو "فواتير" أو "عقد"
- installmentPayment: إذا كان يذكر "قسط" أو "أقساط" أو "تقسيط"
- maintenance: إذا كان يذكر "صيانة" أو "صيانات"
- supplier: إذا كان يذكر "مورد" أو "موردين"

إرشادات:
- كن دقيقاً: لا تختار نوعاً إلا إذا كان مذكوراً صراحة أو في سياق واضح.
- إذا لم يكن واضحاً، اختر "unknown".
- للفلاتر: حدد الشروط العددية أو النصية فقط إذا كانت مرتبطة بالنوع (مثل "قيمة أقل من X" للفواتير).

أجب بـ JSON فقط بدون أي نص إضافي:
{
  "type": "نوع_البيانات",
  "confidence": 0.95,
  "keywords": ["كلمة1", "كلمة2"],
  "interpretation": "شرح مختصر بالعربية"
}`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        type: parsed.type,
        confidence: parsed.confidence,
        interpretation: parsed.interpretation,
        keywords: parsed.keywords,
      };
    }

    return analyzeQueryLocal(queryText);
  } catch (error) {
    console.warn("⚠️ AI analysis failed, using fallback:", error.message);
    return analyzeQueryLocal(queryText);
  }
}

/**
 * تحليل محلي (Fallback) - Enhanced
 */
function analyzeQueryLocal(queryText) {
  const lowerText = queryText.toLowerCase();

  const types = {
    customer: ["عميل", "عملاء", "زبون", "زبائن"],
    employee: ["موظف", "موظفين", "تكنيشن", "فني", "منديب"],
    product: ["منتج", "منتجات", "فلتر", "فلاتر"],
    accessory: ["ملحق", "ملحقات", "اكسسوار"],
    invoice: ["فاتورة", "فواتير", "عقد"],
    installmentPayment: ["قسط", "أقساط", "تقسيط"],
    maintenance: ["صيانة", "صيانات"],
    supplier: ["مورد", "موردين"],
  };

  for (const [type, keywords] of Object.entries(types)) {
    if (keywords.some((kw) => lowerText.includes(kw))) {
      return {
        type,
        confidence: 0.8,
        interpretation: `البحث في ${getTypeNameAr(type)}`,
        keywords,
      };
    }
  }

  return {
    type: "unknown",
    confidence: 0.3,
    interpretation: "استعلام عام غير محدد",
    keywords: [],
  };
}

/**
 * استخراج الفلاتر من النص (FIXED: Better number/year detection)
 */
function extractFiltersFromQuery(queryText, queryType) {
  const filters = {};
  const lowerText = queryText.toLowerCase();

  if (queryType === "invoice") {
    const numbers = queryText.match(/\d+(?:\.\d+)?/g); // Match floats too

    // ✅ FIXED: Extract amount filters more precisely
    if (
      (lowerText.includes("أقل") ||
        lowerText.includes("اقل") ||
        lowerText.includes("أصغر")) &&
      numbers
    ) {
      // Take the last number as the threshold
      filters.totalAmountLte = parseFloat(numbers[numbers.length - 1]);
    }

    if (
      (lowerText.includes("أكبر") ||
        lowerText.includes("اكبر") ||
        lowerText.includes("أعلى")) &&
      numbers
    ) {
      filters.totalAmountGte = parseFloat(numbers[numbers.length - 1]);
    }

    // ✅ FIXED: Year detection - Only if "سنة" mentioned OR 4-digit number in year-like context (1900-2100)
    const yearMatch = queryText.match(/\b(19|20)\d{2}\b/); // Match realistic years only
    if ((lowerText.includes("سنة") || lowerText.includes("عام")) && yearMatch) {
      filters.year = parseInt(yearMatch[0]);
    }
    // Remove the broad /\d{4}/ that was causing false positives

    // Additional: Sale type detection
    if (lowerText.includes("كاش") || lowerText.includes("نقدي")) {
      filters.saleType = "Cash";
    }
    if (lowerText.includes("تقسيط") || lowerText.includes("أقساط")) {
      filters.saleType = "Installment";
    }
  }

  if (queryType === "product" || queryType === "accessory") {
    if (
      lowerText.includes("منخفض") ||
      lowerText.includes("ينفذ") ||
      lowerText.includes("قليل")
    ) {
      filters.stockLow = true;
    }

    const numbers = queryText.match(/\d+(?:\.\d+)?/g);
    if ((lowerText.includes("أقل") || lowerText.includes("اقل")) && numbers) {
      filters.priceLte = parseFloat(numbers[numbers.length - 1]);
    }
    if ((lowerText.includes("أكبر") || lowerText.includes("اكبر")) && numbers) {
      filters.priceGte = parseFloat(numbers[numbers.length - 1]);
    }
  }

  if (queryType === "installmentPayment") {
    if (lowerText.includes("متأخر") || lowerText.includes("تأخير")) {
      filters.status = "Overdue";
    }
    if (lowerText.includes("مدفوع") || lowerText.includes("دفيع")) {
      filters.status = "Paid";
    }
    if (lowerText.includes("معلق") || lowerText.includes("مستحق")) {
      filters.status = "Pending";
    }
  }

  // ✅ FIXED: Log extracted filters for debugging
  console.log(`🔍 Extracted filters from text:`, filters);

  return filters;
}

/**
 * بناء Query Builder (Enhanced with better logic)
 */
function getQueryBuilder(type) {
  const builders = {
    customer: buildCustomerQuery,
    employee: buildEmployeeQuery,
    product: buildProductQuery,
    accessory: buildAccessoryQuery,
    invoice: buildInvoiceQuery,
    installmentPayment: buildInstallmentQuery,
    maintenance: buildMaintenanceQuery,
    supplier: buildSupplierQuery,
  };

  return builders[type] || (() => ({}));
}

function buildCustomerQuery(text, analysis) {
  const filters = {};
  const lower = text.toLowerCase();

  if (lower.includes("تركيب")) filters.customerType = "Installation";
  if (lower.includes("صيانة")) filters.customerType = "Maintenance";

  // ✅ FIXED: Governorate/City extraction from keywords
  if (
    analysis.keywords.some(
      (kw) =>
        lower.includes(kw) &&
        (lower.includes("قاهرة") || lower.includes("الإسكندرية"))
    )
  ) {
    filters.governorate = lower.includes("قاهرة") ? "القاهرة" : "الإسكندرية";
  }

  return filters;
}

function buildEmployeeQuery(text, analysis) {
  const filters = {};
  const lower = text.toLowerCase();

  if (lower.includes("تقنيين") || lower.includes("فني"))
    filters.role = "Technician";
  if (lower.includes("منديب") || lower.includes("مندوبين"))
    filters.role = "SalesRep";

  return filters;
}

function buildProductQuery(text) {
  const filters = {};
  const lower = text.toLowerCase();

  if (
    lower.includes("خلص") ||
    lower.includes("ينفذ") ||
    lower.includes("نفد")
  ) {
    filters.stock = 0;
  }

  return filters;
}

function buildAccessoryQuery(text) {
  return buildProductQuery(text);
}

function buildInvoiceQuery(text, analysis) {
  const filters = {};
  const lower = text.toLowerCase();

  if (lower.includes("كاش")) filters.saleType = "Cash";
  if (lower.includes("تقسيط")) filters.saleType = "Installment";

  // ✅ FIXED: No automatic date filter unless year is explicitly set

  return filters;
}

function buildInstallmentQuery(text) {
  const filters = {};
  const lower = text.toLowerCase();

  if (lower.includes("متأخر")) filters.status = "Overdue";
  if (lower.includes("مدفوع")) filters.status = "Paid";

  return filters;
}

function buildMaintenanceQuery(text) {
  const filters = {};
  const lower = text.toLowerCase();

  if (lower.includes("منتهي")) filters.status = "Completed";
  if (lower.includes("معلق")) filters.status = "Pending";

  return filters;
}

function buildSupplierQuery() {
  return {};
}

/**
 * تنفيذ الاستعلام
 */
async function executeQuery(prisma, type, filters, companyId, role) {
  const handlers = {
    customer: () =>
      aiQueryRepo.queryCustomers(prisma, filters, companyId, role),
    employee: () =>
      aiQueryRepo.queryEmployees(prisma, filters, companyId, role),
    product: () => aiQueryRepo.queryProducts(prisma, filters, companyId, role),
    accessory: () =>
      aiQueryRepo.queryAccessories(prisma, filters, companyId, role),
    invoice: () => aiQueryRepo.queryInvoices(prisma, filters, companyId, role),
    installmentPayment: () =>
      aiQueryRepo.queryInstallments(prisma, filters, companyId, role),
    maintenance: () =>
      aiQueryRepo.queryMaintenance(prisma, filters, companyId, role),
    supplier: () =>
      aiQueryRepo.querySuppliers(prisma, filters, companyId, role),
  };

  const handler = handlers[type];
  if (!handler) {
    throw new AppError("نوع الاستعلام غير مدعوم", 400);
  }

  return handler();
}

function getTypeNameAr(type) {
  const names = {
    customer: "العملاء",
    employee: "الموظفين",
    product: "المنتجات",
    accessory: "الملحقات",
    invoice: "الفواتير",
    installmentPayment: "الأقساط",
    maintenance: "الصيانة",
    supplier: "الموردين",
  };
  return names[type] || "البيانات";
}

// Export functions
export const getUserQueryHistory = async (prisma, currentUser, limit = 10) => {
  const { userId, companyId, role } = currentUser;
  return aiQueryRepo.getQueryHistory(prisma, userId, companyId, role, limit);
};

export const getQuerySuggestions = async () => {
  return [
    "اريد كل العملاء الذين في القاهرة",
    "المنتجات أقل من 3000 جنيه",
    "الموظفين الفنيين",
    "الأقساط المتأخرة",
    "الفواتير الخاصه بسنة 2025",
    "الصيانات المعلقة كلها",
    "المنتجات التي المخزون فيها منخفض",
    "جميع الموردين",
  ];
};

export const saveSuggestion = async () => {
  return { success: true, message: "تم الحفظ" };
};

export const deleteSuggestion = async () => {
  return { success: true, message: "تم الحذف" };
};
