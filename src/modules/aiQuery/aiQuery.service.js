// ==========================================
// aiQuery.service.js - نظام AI متطور
// ==========================================

import * as aiQueryRepo from "./aiQuery.repository.js";
import { AppError } from "../../shared/errors/AppError.js";
import * as vectorStore from "./vectorStore.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// إعدادات AI
const AI_PROVIDER = process.env.AI_PROVIDER || "openai";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

let genAI = null;
if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
}

/**
 * ========================================
 * 🎯 المعالجة الرئيسية
 * ========================================
 */
export const processSmartQuery = async (prisma, queryText, currentUser) => {
  const startTime = Date.now();
  const { userId, companyId, role } = currentUser;

  try {
    console.log(`🔍 Processing query: "${queryText}"`);

    // 1. تحليل الاستعلام باستخدام AI
    const queryAnalysis = await analyzeQueryWithAI(queryText);
    console.log(`📊 Query type detected: ${queryAnalysis.type}`);

    // 2. التأكد من وجود جدول embeddings
    await vectorStore.ensureTable(prisma);

    // 3. إنشاء embedding للاستعلام
    let queryEmbedding = null;
    let similarRows = [];

    try {
      queryEmbedding = await vectorStore.createEmbedding(queryText);
      similarRows = await vectorStore.searchSimilar(
        prisma,
        companyId,
        queryEmbedding,
        5
      );
      console.log(`✅ Found ${similarRows.length} similar records`);
    } catch (error) {
      console.warn("⚠️ Embedding search failed:", error.message);
    }

    // 4. بناء الفلاتر وتنفيذ الاستعلام
    const queryBuilder = getQueryBuilder(queryAnalysis.type);
    const filters = queryBuilder(queryText, queryAnalysis);

    const results = await executeQuery(
      prisma,
      queryAnalysis.type,
      filters,
      companyId,
      role
    );

    console.log(`✅ Found ${results.length} results`);

    // 5. إنشاء إجابة ذكية باستخدام AI
    const aiAnswer = await generateAIAnswer(
      queryText,
      queryAnalysis,
      results,
      similarRows
    );

    const executionTime = Date.now() - startTime;

    // 6. حفظ في السجل
    await aiQueryRepo.createQueryHistory(prisma, {
      userId,
      companyId,
      queryText,
      queryType: queryAnalysis.type,
      results: { results, similarRows },
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
      similar: similarRows,
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
 * ========================================
 * 🤖 تحليل الاستعلام بالذكاء الاصطناعي
 * ========================================
 */
async function analyzeQueryWithAI(queryText) {
  try {
    console.log("🤖 Analyzing query with AI...");

    if (AI_PROVIDER === "gemini" && genAI) {
      return await analyzeWithGemini(queryText);
    } else if (AI_PROVIDER === "openai" && OPENAI_API_KEY) {
      return await analyzeWithOpenAI(queryText);
    } else {
      console.warn("⚠️ No AI provider configured, using fallback");
      return analyzeQueryLocal(queryText);
    }
  } catch (error) {
    console.warn("⚠️ AI analysis failed, using fallback:", error.message);
    return analyzeQueryLocal(queryText);
  }
}

/**
 * تحليل باستخدام Gemini
 */
async function analyzeWithGemini(queryText) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `أنت محلل استعلامات ذكي. حلل الاستعلام التالي وحدد نوع البيانات المطلوب.

الاستعلام: "${queryText}"

أنواع البيانات المتاحة:
- customers (العملاء)
- employees (الموظفين)
- products (المنتجات)
- accessories (الملحقات)
- invoices (الفواتير)
- installments (الأقساط)
- maintenance (الصيانة)
- suppliers (الموردين)

أجب بصيغة JSON فقط:
{
  "type": "نوع البيانات",
  "confidence": 0.95,
  "keywords": ["كلمة1", "كلمة2"],
  "interpretation": "تفسير مختصر بالعربية"
}`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();

  // استخراج JSON من الرد
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      type: parsed.type,
      confidence: parsed.confidence,
      interpretation: parsed.interpretation,
      rawText: queryText,
    };
  }

  throw new Error("Invalid response format");
}

/**
 * تحليل باستخدام OpenAI
 */
async function analyzeWithOpenAI(queryText) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `أنت محلل استعلامات. حدد نوع البيانات: customers, employees, products, accessories, invoices, installments, maintenance, suppliers. أجب بـ JSON فقط: {"type":"...", "confidence":0.95, "interpretation":"..."}`,
        },
        {
          role: "user",
          content: queryText,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI error: ${response.status}`);
  }

  const data = await response.json();
  const parsed = JSON.parse(data.choices[0].message.content);

  return {
    type: parsed.type,
    confidence: parsed.confidence || 0.9,
    interpretation: parsed.interpretation,
    rawText: queryText,
  };
}

/**
 * تحليل محلي (fallback)
 */
function analyzeQueryLocal(queryText) {
  const lowerText = queryText.toLowerCase();

  const types = {
    customers: ["عميل", "عملاء", "زبون", "زبائن"],
    employees: ["موظف", "موظفين", "تكنيشن", "فني", "مندوب"],
    products: ["منتج", "منتجات", "فلتر", "فلاتر"],
    accessories: ["ملحق", "ملحقات", "اكسسوار"],
    invoices: ["فاتورة", "فواتير", "عقد"],
    installments: ["قسط", "أقساط", "تقسيط"],
    maintenance: ["صيانة", "صيانات"],
    suppliers: ["مورد", "موردين"],
  };

  for (const [type, keywords] of Object.entries(types)) {
    if (keywords.some((kw) => lowerText.includes(kw))) {
      return {
        type,
        confidence: 0.8,
        interpretation: `البحث في ${getTypeNameAr(type)}`,
        rawText: queryText,
      };
    }
  }

  return {
    type: "unknown",
    confidence: 0.3,
    interpretation: "استعلام عام",
    rawText: queryText,
  };
}

/**
 * ========================================
 * 💬 إنشاء إجابة ذكية
 * ========================================
 */
async function generateAIAnswer(queryText, analysis, results, similarRows) {
  if (results.length === 0) {
    return `لم أجد أي نتائج تطابق استعلامك: "${queryText}"`;
  }

  try {
    const context = buildContext(analysis.type, results, similarRows);

    if (AI_PROVIDER === "gemini" && genAI) {
      return await generateAnswerWithGemini(queryText, context, results.length);
    } else if (AI_PROVIDER === "openai" && OPENAI_API_KEY) {
      return await generateAnswerWithOpenAI(queryText, context, results.length);
    }
  } catch (error) {
    console.warn("⚠️ AI answer generation failed:", error.message);
  }

  return generateSimpleAnswer(analysis.type, results, queryText);
}

/**
 * إنشاء إجابة باستخدام Gemini
 */
async function generateAnswerWithGemini(queryText, context, resultCount) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `أنت مساعد ذكي للإجابة على استعلامات قاعدة البيانات.

الاستعلام: "${queryText}"

البيانات المتاحة (${resultCount} نتيجة):
${context}

قدم إجابة واضحة ومختصرة بالعربية (2-3 جمل فقط). ركز على أهم المعلومات.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

/**
 * إنشاء إجابة باستخدام OpenAI
 */
async function generateAnswerWithOpenAI(queryText, context, resultCount) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "أنت مساعد ذكي. أجب بالعربية بشكل مختصر (2-3 جمل فقط).",
        },
        {
          role: "user",
          content: `الاستعلام: "${queryText}"\n\nالبيانات (${resultCount} نتيجة):\n${context}\n\nما الإجابة المختصرة؟`,
        },
      ],
      max_tokens: 150,
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * بناء السياق من النتائج
 */
function buildContext(type, results, similarRows) {
  const items = results.slice(0, 5).map((r, i) => {
    if (type === "customers") {
      return `${i + 1}. ${r.fullName} - ${r.governorate} - ${r.customerType}`;
    } else if (type === "products") {
      return `${i + 1}. ${r.name} - السعر: ${r.price} - المخزون: ${r.stock}`;
    } else if (type === "employees") {
      return `${i + 1}. ${r.fullName} - ${r.role} - ${r.city}`;
    } else if (type === "maintenance") {
      return `${i + 1}. العميل: ${r.customer?.fullName} - الحالة: ${r.status}`;
    }
    return `${i + 1}. ${JSON.stringify(r).substring(0, 100)}`;
  });

  return items.join("\n");
}

/**
 * إجابة بسيطة (fallback)
 */
function generateSimpleAnswer(type, results, queryText) {
  const typeAr = getTypeNameAr(type);
  const count = results.length;

  if (count === 0) {
    return `لم أجد أي ${typeAr} تطابق: "${queryText}"`;
  }

  return `وجدت ${count} ${
    count === 1 ? "نتيجة" : "نتائج"
  } من ${typeAr}. استخدم الجدول أدناه لعرض التفاصيل.`;
}

/**
 * ========================================
 * 🛠️ دوال مساعدة
 * ========================================
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

function buildCustomerQuery(text) {
  const filters = {};
  const lower = text.toLowerCase();

  if (lower.includes("تركيب")) filters.customerType = "Installation";
  if (lower.includes("صيانة")) filters.customerType = "Maintenance";

  const govs = ["القاهرة", "الجيزة", "الإسكندرية"];
  for (const gov of govs) {
    if (lower.includes(gov.toLowerCase())) {
      filters.governorate = gov;
      break;
    }
  }

  return filters;
}

function buildEmployeeQuery(text) {
  const filters = {};
  const lower = text.toLowerCase();

  if (lower.includes("تكنيشن") || lower.includes("فني"))
    filters.role = "Technician";
  if (lower.includes("مندوب")) filters.role = "SalesRep";
  if (lower.includes("شغال")) filters.isEmployed = true;

  return filters;
}

function buildProductQuery(text) {
  const filters = {};
  const lower = text.toLowerCase();

  if (lower.includes("خلص") || lower.includes("نفذ")) {
    filters.stock = 0;
  }
  if (lower.includes("منخفض")) {
    filters.stockLow = true;
  }

  return filters;
}

function buildAccessoryQuery(text) {
  return buildProductQuery(text);
}

function buildInvoiceQuery(text) {
  const filters = {};
  const lower = text.toLowerCase();

  if (lower.includes("كاش")) filters.saleType = "Cash";
  if (lower.includes("تقسيط")) filters.saleType = "Installment";

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

// دوال أخرى
export const getUserQueryHistory = async (prisma, currentUser, limit = 10) => {
  const { userId, companyId, role } = currentUser;
  return aiQueryRepo.getQueryHistory(prisma, userId, companyId, role, limit);
};

export const getQuerySuggestions = async () => {
  return [
    "هات العملاء اللي في القاهرة",
    "اعرض الموظفين التكنيشن",
    "المنتجات اللي المخزون بتها خلص",
    "الأقساط المتأخرة",
    "الفواتير بتاعت شهر 11",
    "الصيانات المعلقة",
  ];
};

export const saveSuggestion = async () => {
  return { success: true, message: "تم الحفظ" };
};

export const deleteSuggestion = async () => {
  return { success: true, message: "تم الحذف" };
};
