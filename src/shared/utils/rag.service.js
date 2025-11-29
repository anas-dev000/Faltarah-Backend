// src/shared/utils/rag.service.js
// ==========================================
// RAG Pipeline - FIXED VERSION
// ==========================================

import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
let genAI = null;

if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
}

/**
 * ========================================
 * CREATE EMBEDDINGS
 *  FIXED: استخدام النموذج الصحيح
 * ========================================
 */
export async function createEmbedding(text) {
  try {
    if (!genAI) {
      console.warn("⚠️ Gemini not configured, using fallback");
      return generateSimpleEmbedding(text);
    }

    //  FIXED: استخدام النموذج الصحيح
    const model = genAI.getGenerativeModel({
      model: "models/text-embedding-004", //  مع prefix
    });

    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error("❌ Embedding error:", error.message);
    return generateSimpleEmbedding(text);
  }
}

function generateSimpleEmbedding(text) {
  const vector = new Array(768).fill(0);
  const words = text.toLowerCase().split(/\s+/);

  words.forEach((word, idx) => {
    for (let i = 0; i < word.length && i < vector.length; i++) {
      const charCode = word.charCodeAt(i);
      vector[i] += Math.sin(charCode + idx) * Math.cos(idx + i);
    }
  });

  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return vector.map((v) => (magnitude ? v / magnitude : 0));
}

/**
 * ========================================
 * STORE CHUNKS
 *  FIXED: استخدام Raw SQL
 * ========================================
 */
export async function storeChunks(prisma, companyId, chunks) {
  const stored = [];

  for (const chunk of chunks) {
    try {
      const embedding = await createEmbedding(chunk.text);

      //  Delete old embedding if exists (Raw SQL)
      await prisma.$executeRawUnsafe(
        `DELETE FROM embedding_store 
         WHERE company_id = $1 AND entity = $2 AND row_id = $3`,
        companyId,
        chunk.entity,
        chunk.recordId
      );

      //  Create new embedding (Raw SQL)
      await prisma.$executeRawUnsafe(
        `INSERT INTO embedding_store 
         (company_id, entity, row_id, text, embedding) 
         VALUES ($1, $2, $3, $4, $5)`,
        companyId,
        chunk.entity,
        chunk.recordId,
        chunk.text,
        embedding
      );

      stored.push({
        entity: chunk.entity,
        recordId: chunk.recordId,
        success: true,
      });
    } catch (error) {
      console.error(`❌ Store chunk error:`, error.message);
      stored.push({
        entity: chunk.entity,
        recordId: chunk.recordId,
        success: false,
        error: error.message,
      });
    }
  }

  return stored;
}

/**
 * ========================================
 * RETRIEVE SIMILAR CHUNKS
 *  FIXED: استخدام Raw SQL
 * ========================================
 */
function cosine(a, b) {
  if (!a || !b || a.length !== b.length) return -1;

  let dot = 0;
  let na = 0;
  let nb = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }

  if (na === 0 || nb === 0) return -1;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export async function retrieveSimilarChunks(
  prisma,
  companyId,
  queryEmbedding,
  topK = 10
) {
  try {
    //  استخدام Raw SQL
    const rows = await prisma.$queryRawUnsafe(
      `SELECT id, entity, row_id, text, embedding 
       FROM embedding_store 
       WHERE company_id = $1 
       LIMIT 100`,
      companyId
    );

    if (!rows || rows.length === 0) {
      return [];
    }

    const scored = [];
    for (const r of rows) {
      if (!r.embedding || r.embedding.length === 0) continue;

      const sim = cosine(r.embedding, queryEmbedding);
      if (sim > 0.3) {
        scored.push({
          id: r.id,
          entity: r.entity,
          recordId: r.row_id,
          text: r.text,
          similarity: sim,
        });
      }
    }

    scored.sort((a, b) => b.similarity - a.similarity);
    return scored.slice(0, topK);
  } catch (error) {
    console.error("❌ Retrieval error:", error);
    return [];
  }
}

/**
 * ========================================
 * BUILD RAG CONTEXT
 * ========================================
 */
export function buildRAGContext(similarChunks, queryType) {
  if (!similarChunks || similarChunks.length === 0) {
    return "لم يتم العثور على بيانات مرتبطة بالاستعلام.";
  }

  const contextParts = [
    `📊 البيانات المسترجعة من نظام البحث الذكي (${similarChunks.length} نتيجة):`,
    "---",
  ];

  const grouped = {};
  similarChunks.forEach((chunk) => {
    if (!grouped[chunk.entity]) {
      grouped[chunk.entity] = [];
    }
    grouped[chunk.entity].push(chunk);
  });

  for (const [entity, chunks] of Object.entries(grouped)) {
    contextParts.push(`\n${getTypeIcon(entity)} ${getTypeNameAr(entity)}:`);
    chunks.slice(0, 3).forEach((chunk, idx) => {
      const confidence = (chunk.similarity * 100).toFixed(0);
      contextParts.push(
        `${idx + 1}. [ثقة ${confidence}%] ${chunk.text.substring(0, 120)}`
      );
    });
  }

  return contextParts.join("\n");
}

/**
 * ========================================
 * GENERATE AI RESPONSE
 *  FIXED: استخدام النموذج الصحيح
 * ========================================
 */
export async function generateRAGResponse(queryText, ragContext, results) {
  try {
    if (!genAI) {
      return generateSimpleAnswer(results);
    }

    //  استخدام النموذج الصحيح
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash", //  بدون prefix للـ generation models
    });

    const prompt = `
أنت مساعد متخصص في تحليل نتائج قاعدة البيانات.

استعلام المستخدم: "${queryText}"

هذه هي النتائج المباشرة والمقطعية من قاعدة البيانات (يجب الاعتماد عليها أولاً):
${JSON.stringify(results, null, 2)}

السياق المسترجع من نظام RAG (اختياري وقد يكون فارغاً):
${ragContext}

المهمة:
- اعتمد اعتماد كامل على النتائج القادمة من قاعدة البيانات فقط.
- لو النتائج > 0 → لخصها بشكل واضح.
- لو النتائج = 0 → استخدم سياق RAG إن وجد.
- ممنوع تماماً تجاهل نتائج قاعدة البيانات حتى لو سياق RAG غير موجود.

اكتب إجابة قصيرة بالعربية (جملة أو جملتين).
`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("❌ AI generation error:", error);
    return generateSimpleAnswer(results);
  }
}

function generateSimpleAnswer(results) {
  if (!results || results.length === 0) {
    return "لم يتم العثور على نتائج تطابق البحث.";
  }
  return `تم العثور على ${results.length} نتيجة.`;
}

/**
 * ========================================
 * CHUNK AND ENRICH DATA
 * ========================================
 */
export async function chunkAndEnrichData(entity, records) {
  const chunks = [];

  for (const record of records) {
    const text = buildSearchableText(entity, record);
    const metadata = extractMetadata(entity, record);

    chunks.push({
      entity,
      recordId: record.id,
      text,
      metadata,
      originalData: record,
    });
  }

  return chunks;
}

function buildSearchableText(entity, record) {
  const textParts = [];

  switch (entity) {
    case "customer":
      textParts.push(`العميل: ${record.fullName}`);
      textParts.push(`النوع: ${record.customerType}`);
      textParts.push(`رقم الهاتف: ${record.primaryNumber}`);
      textParts.push(`المحافظة: ${record.governorate}`);
      textParts.push(`المدينة: ${record.city}`);
      textParts.push(`المنطقة: ${record.district}`);
      break;

    case "product":
      textParts.push(`المنتج: ${record.name}`);
      textParts.push(`الفئة: ${record.category}`);
      textParts.push(`السعر: ${record.price} جنيه`);
      textParts.push(`المخزون: ${record.stock} وحدة`);
      if (record.supplier) {
        textParts.push(`المورد: ${record.supplier.name}`);
      }
      break;

    case "invoice":
      textParts.push(`فاتورة رقم: ${record.id}`);
      textParts.push(`المبلغ الإجمالي: ${record.totalAmount} جنيه`);
      textParts.push(`نوع البيع: ${record.saleType}`);
      textParts.push(
        `التاريخ: ${new Date(record.contractDate).toLocaleDateString("ar-EG")}`
      );
      if (record.customer) {
        textParts.push(`العميل: ${record.customer.fullName}`);
      }
      break;

    case "installmentPayment":
      textParts.push(`قسط رقم: ${record.id}`);
      textParts.push(`المبلغ المستحق: ${record.amountDue} جنيه`);
      textParts.push(`المبلغ المدفوع: ${record.amountPaid} جنيه`);
      textParts.push(`الحالة: ${getStatusAr(record.status)}`);
      textParts.push(
        `تاريخ الاستحقاق: ${new Date(record.dueDate).toLocaleDateString(
          "ar-EG"
        )}`
      );
      if (record.customer) {
        textParts.push(`العميل: ${record.customer.fullName}`);
      }
      break;

    case "maintenance":
      textParts.push(`صيانة رقم: ${record.id}`);
      textParts.push(`السعر: ${record.price} جنيه`);
      textParts.push(`الحالة: ${record.status}`);
      textParts.push(
        `التاريخ: ${new Date(record.maintenanceDate).toLocaleDateString(
          "ar-EG"
        )}`
      );
      if (record.customer) {
        textParts.push(`العميل: ${record.customer.fullName}`);
      }
      if (record.technician) {
        textParts.push(`الفني: ${record.technician.fullName}`);
      }
      break;

    case "employee":
      textParts.push(`الموظف: ${record.fullName}`);
      textParts.push(`الوظيفة: ${record.role}`);
      textParts.push(`رقم الهاتف: ${record.primaryNumber}`);
      textParts.push(`المدينة: ${record.city}`);
      textParts.push(`الحالة: ${record.isEmployed ? "نشط" : "غير نشط"}`);
      break;

    case "accessory":
      textParts.push(`الملحق: ${record.name}`);
      textParts.push(`السعر: ${record.price} جنيه`);
      textParts.push(`المخزون: ${record.stock} وحدة`);
      if (record.supplier) {
        textParts.push(`المورد: ${record.supplier.name}`);
      }
      break;

    case "supplier":
      textParts.push(`المورد: ${record.name}`);
      textParts.push(`معلومات الاتصال: ${record.contactInfo}`);
      break;

    default:
      textParts.push(JSON.stringify(record).substring(0, 200));
  }

  return textParts.join(" | ");
}

function extractMetadata(entity, record) {
  const metadata = {
    entity,
    recordId: record.id,
  };

  switch (entity) {
    case "customer":
      metadata.customerType = record.customerType;
      metadata.governorate = record.governorate;
      metadata.city = record.city;
      break;

    case "product":
      metadata.category = record.category;
      metadata.priceRange = getPriceRange(record.price);
      break;

    case "invoice":
      metadata.saleType = record.saleType;
      metadata.year = new Date(record.contractDate).getFullYear();
      metadata.month = new Date(record.contractDate).getMonth() + 1;
      break;

    case "installmentPayment":
      metadata.status = record.status;
      break;

    case "maintenance":
      metadata.status = record.status;
      break;

    case "employee":
      metadata.role = record.role;
      break;
  }

  return metadata;
}

function getPriceRange(price) {
  const p = parseFloat(price);
  if (p < 1000) return "low";
  if (p < 5000) return "medium";
  return "high";
}

function getStatusAr(status) {
  const statuses = {
    Paid: "مدفوع",
    Pending: "معلق",
    Partial: "جزئي",
    Overdue: "متأخر",
  };
  return statuses[status] || status;
}

/**
 * ========================================
 * INDEX ALL COMPANY DATA
 * ========================================
 */
export async function indexCompanyData(prisma, companyId) {
  try {
    console.log(`🔄 بدء فهرسة البيانات للشركة ${companyId}...`);

    const results = [];

    // 1. Customers
    try {
      const customers = await prisma.customer.findMany({
        where: { companyId },
      });
      if (customers.length > 0) {
        const chunks = await chunkAndEnrichData("customer", customers);
        const storeResults = await storeChunks(prisma, companyId, chunks);
        const success = storeResults.filter((r) => r.success).length;
        results.push({
          entity: "customer",
          total: customers.length,
          indexed: success,
        });
        console.log(` العملاء: ${success}/${customers.length}`);
      }
    } catch (error) {
      console.error(`❌ خطأ في العملاء:`, error.message);
      results.push({ entity: "customer", error: error.message });
    }

    // 2. Products
    try {
      const products = await prisma.product.findMany({
        where: { companyId },
        include: { supplier: true },
      });
      if (products.length > 0) {
        const chunks = await chunkAndEnrichData("product", products);
        const storeResults = await storeChunks(prisma, companyId, chunks);
        const success = storeResults.filter((r) => r.success).length;
        results.push({
          entity: "product",
          total: products.length,
          indexed: success,
        });
        console.log(` المنتجات: ${success}/${products.length}`);
      }
    } catch (error) {
      console.error(`❌ خطأ في المنتجات:`, error.message);
      results.push({ entity: "product", error: error.message });
    }

    // 3. Invoices
    try {
      const invoices = await prisma.invoice.findMany({
        where: { companyId },
        include: { customer: true },
      });
      if (invoices.length > 0) {
        const chunks = await chunkAndEnrichData("invoice", invoices);
        const storeResults = await storeChunks(prisma, companyId, chunks);
        const success = storeResults.filter((r) => r.success).length;
        results.push({
          entity: "invoice",
          total: invoices.length,
          indexed: success,
        });
        console.log(` الفواتير: ${success}/${invoices.length}`);
      }
    } catch (error) {
      console.error(`❌ خطأ في الفواتير:`, error.message);
      results.push({ entity: "invoice", error: error.message });
    }

    // 4. Installment Payments
    try {
      const payments = await prisma.installmentPayment.findMany({
        include: {
          customer: true,
          installment: { include: { invoice: { where: { companyId } } } },
        },
        where: {
          installment: { invoice: { companyId } },
        },
      });
      if (payments.length > 0) {
        const chunks = await chunkAndEnrichData("installmentPayment", payments);
        const storeResults = await storeChunks(prisma, companyId, chunks);
        const success = storeResults.filter((r) => r.success).length;
        results.push({
          entity: "installmentPayment",
          total: payments.length,
          indexed: success,
        });
        console.log(` الأقساط: ${success}/${payments.length}`);
      }
    } catch (error) {
      console.error(`❌ خطأ في الأقساط:`, error.message);
      results.push({ entity: "installmentPayment", error: error.message });
    }

    // 5. Maintenance
    try {
      const maintenance = await prisma.maintenance.findMany({
        where: { companyId },
        include: { customer: true, technician: true },
      });
      if (maintenance.length > 0) {
        const chunks = await chunkAndEnrichData("maintenance", maintenance);
        const storeResults = await storeChunks(prisma, companyId, chunks);
        const success = storeResults.filter((r) => r.success).length;
        results.push({
          entity: "maintenance",
          total: maintenance.length,
          indexed: success,
        });
        console.log(` الصيانة: ${success}/${maintenance.length}`);
      }
    } catch (error) {
      console.error(`❌ خطأ في الصيانة:`, error.message);
      results.push({ entity: "maintenance", error: error.message });
    }

    // 6. Employees
    try {
      const employees = await prisma.employee.findMany({
        where: { companyId },
      });
      if (employees.length > 0) {
        const chunks = await chunkAndEnrichData("employee", employees);
        const storeResults = await storeChunks(prisma, companyId, chunks);
        const success = storeResults.filter((r) => r.success).length;
        results.push({
          entity: "employee",
          total: employees.length,
          indexed: success,
        });
        console.log(` الموظفين: ${success}/${employees.length}`);
      }
    } catch (error) {
      console.error(`❌ خطأ في الموظفين:`, error.message);
      results.push({ entity: "employee", error: error.message });
    }

    // 7. Accessories
    try {
      const accessories = await prisma.accessory.findMany({
        where: { companyId },
        include: { supplier: true },
      });
      if (accessories.length > 0) {
        const chunks = await chunkAndEnrichData("accessory", accessories);
        const storeResults = await storeChunks(prisma, companyId, chunks);
        const success = storeResults.filter((r) => r.success).length;
        results.push({
          entity: "accessory",
          total: accessories.length,
          indexed: success,
        });
        console.log(` الملحقات: ${success}/${accessories.length}`);
      }
    } catch (error) {
      console.error(`❌ خطأ في الملحقات:`, error.message);
      results.push({ entity: "accessory", error: error.message });
    }

    // 8. Suppliers
    try {
      const suppliers = await prisma.supplier.findMany({
        where: { companyId },
      });
      if (suppliers.length > 0) {
        const chunks = await chunkAndEnrichData("supplier", suppliers);
        const storeResults = await storeChunks(prisma, companyId, chunks);
        const success = storeResults.filter((r) => r.success).length;
        results.push({
          entity: "supplier",
          total: suppliers.length,
          indexed: success,
        });
        console.log(` الموردين: ${success}/${suppliers.length}`);
      }
    } catch (error) {
      console.error(`❌ خطأ في الموردين:`, error.message);
      results.push({ entity: "supplier", error: error.message });
    }

    console.log(` انتهت الفهرسة`);
    return results;
  } catch (error) {
    console.error("❌ فهرسة عام:", error);
    throw error;
  }
}

/**
 * Helper Functions
 */
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

function getTypeIcon(type) {
  const icons = {
    customer: "👥",
    employee: "👷",
    product: "📦",
    accessory: "🔧",
    invoice: "🧾",
    installmentPayment: "💳",
    maintenance: "🛠️",
    supplier: "🚚",
  };
  return icons[type] || "📊";
}
