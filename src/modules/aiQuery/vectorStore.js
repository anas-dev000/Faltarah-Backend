// ==========================================
// vectorStore.js - نظام Embeddings المُصلح
// ==========================================
// يدعم: OpenAI + Google Gemini + PostgreSQL

import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * ========================================
 * 🔧 الإعدادات
 * ========================================
 */

// اختيار المزود: 'openai' أو 'gemini'
const EMBEDDING_PROVIDER = process.env.EMBEDDING_PROVIDER || "gemini";

// OpenAI Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";

// Gemini Configuration -  FIXED: استخدام النموذج الصحيح
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_EMBEDDING_MODEL = "models/text-embedding-004"; //  مع prefix

// Initialize Gemini
let genAI = null;
if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
}

/**
 * ========================================
 * 📊 إنشاء جدول التخزين
 * ========================================
 */
export async function ensureTable(prisma) {
  try {
    // إنشاء الجدول أولاً
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS embedding_store (
        id SERIAL PRIMARY KEY,
        company_id INTEGER,
        entity VARCHAR(50),
        row_id INTEGER,
        text TEXT,
        embedding DOUBLE PRECISION[],
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `);

    // إنشاء الـ indexes منفصلة
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_company_entity 
      ON embedding_store(company_id, entity)
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_company_id 
      ON embedding_store(company_id)
    `);

    console.log(" Embedding table ready");
  } catch (error) {
    // تجاهل الخطأ إذا كان الجدول موجود بالفعل
    if (!error.message.includes("already exists")) {
      console.warn("⚠️ Table creation warning:", error.message);
    }
  }
}

/**
 * ========================================
 * 🤖 إنشاء Embeddings
 * ========================================
 */

/**
 * إنشاء embedding باستخدام OpenAI
 */
async function createOpenAIEmbedding(text) {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_EMBEDDING_MODEL,
      input: text,
      encoding_format: "float",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

/**
 * إنشاء embedding باستخدام Google Gemini
 *  FIXED: استخدام النموذج الصحيح
 */
async function createGeminiEmbedding(text) {
  if (!GEMINI_API_KEY || !genAI) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const model = genAI.getGenerativeModel({
    model: GEMINI_EMBEDDING_MODEL, //  models/text-embedding-004
  });

  const result = await model.embedContent(text);
  return result.embedding.values;
}

/**
 * إنشاء embedding (دالة عامة)
 */
export async function createEmbedding(text) {
  try {
    if (EMBEDDING_PROVIDER === "gemini") {
      console.log("🔵 Using Gemini for embeddings");
      return await createGeminiEmbedding(text);
    } else {
      console.log("🟢 Using OpenAI for embeddings");
      return await createOpenAIEmbedding(text);
    }
  } catch (error) {
    console.error("❌ Embedding creation failed:", error.message);
    // Fallback to simple embedding
    return generateSimpleEmbedding(text);
  }
}

/**
 * Fallback: embedding بسيط محلي
 */
function generateSimpleEmbedding(text) {
  console.log("⚠️ Using fallback simple embedding");
  const vector = new Array(768).fill(0);
  const words = text.toLowerCase().split(/\s+/);

  words.forEach((word, idx) => {
    for (let i = 0; i < word.length && i < vector.length; i++) {
      const charCode = word.charCodeAt(i);
      vector[i] += Math.sin(charCode + idx) * Math.cos(idx + i);
    }
  });

  // تطبيع
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return vector.map((v) => (magnitude ? v / magnitude : 0));
}

/**
 * ========================================
 * 💾 حفظ Embeddings
 * ========================================
 */

export async function upsertEmbedding(
  prisma,
  { companyId, entity, rowId, text, embedding }
) {
  try {
    // التحقق من وجود السجل
    const exists = await prisma.$queryRawUnsafe(
      `SELECT id FROM embedding_store 
       WHERE company_id = $1 AND entity = $2 AND row_id = $3 
       LIMIT 1`,
      companyId,
      entity,
      rowId
    );

    if (exists && exists.length > 0) {
      // تحديث
      await prisma.$executeRawUnsafe(
        `UPDATE embedding_store 
         SET text = $1, embedding = $2, created_at = now() 
         WHERE id = $3`,
        text,
        embedding,
        exists[0].id
      );
      return exists[0].id;
    }

    // إنشاء جديد
    const res = await prisma.$queryRawUnsafe(
      `INSERT INTO embedding_store 
       (company_id, entity, row_id, text, embedding) 
       VALUES ($1,$2,$3,$4,$5) 
       RETURNING id`,
      companyId,
      entity,
      rowId,
      text,
      embedding
    );

    return res && res[0] ? res[0].id : null;
  } catch (error) {
    console.error("❌ Upsert embedding failed:", error);
    throw error;
  }
}

/**
 * ========================================
 * 🔍 البحث عن التشابه
 * ========================================
 */

/**
 * حساب Cosine Similarity
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

/**
 * البحث عن أقرب النتائج
 */
export async function searchSimilar(
  prisma,
  companyId,
  queryEmbedding,
  topK = 5
) {
  try {
    // جلب جميع embeddings للشركة
    const rows = await prisma.$queryRawUnsafe(
      `SELECT id, entity, row_id, text, embedding 
       FROM embedding_store 
       WHERE company_id = $1`,
      companyId
    );

    if (!rows || rows.length === 0) {
      return [];
    }

    // حساب التشابه
    const scored = [];
    for (const r of rows) {
      if (!r.embedding) continue;
      const sim = cosine(r.embedding, queryEmbedding);
      scored.push({
        id: r.id,
        entity: r.entity,
        rowId: r.row_id,
        text: r.text,
        similarity: sim,
      });
    }

    // ترتيب وإرجاع أفضل النتائج
    scored.sort((a, b) => b.similarity - a.similarity);
    return scored.slice(0, topK);
  } catch (error) {
    console.error("❌ Search similar failed:", error);
    return [];
  }
}

/**
 * ========================================
 * 🧹 تنظيف البيانات
 * ========================================
 */

/**
 * حذف embeddings لشركة معينة
 */
export async function deleteCompanyEmbeddings(prisma, companyId) {
  await prisma.$executeRawUnsafe(
    `DELETE FROM embedding_store WHERE company_id = $1`,
    companyId
  );
}

/**
 * حذف embeddings لكيان معين
 */
export async function deleteEntityEmbeddings(prisma, companyId, entity) {
  await prisma.$executeRawUnsafe(
    `DELETE FROM embedding_store WHERE company_id = $1 AND entity = $2`,
    companyId,
    entity
  );
}
