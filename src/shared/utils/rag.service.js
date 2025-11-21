// ==========================================
// shared/utils/rag.service.js
// نظام RAG متكامل مع Embeddings و Vector DB
// ==========================================

import { HfInference } from "@huggingface/inference";
import { config } from "../../config/env.js";

/**
 * نظام RAG متطور:
 * 1. تحويل البيانات إلى embeddings
 * 2. تخزينها في vector database
 * 3. البحث عن البيانات ذات الصلة
 * 4. إرسالها لـ LLM مع السؤال
 * 5. الحصول على إجابة ذكية
 */
export class RAGService {
  constructor() {
    // Hugging Face Inference API (مجاني)
    this.hf = new HfInference(config.genAI.huggingface.apiKey);

    // Vector database (في الذاكرة - يمكن استخدام Weaviate أو Pinecone للإنتاج)
    this.vectorDB = {
      embeddings: new Map(), // id -> embedding vector
      metadata: new Map(), // id -> metadata
      documents: new Map(), // id -> original text
      index: [], // array من IDs للبحث السريع
    };

    // نماذج مجانية من Hugging Face
    this.models = {
      // نموذج embeddings عربي مجاني
      embedding: "sbarta/DM-SimCSE-Dan-Arabic",

      // نموذج LLM عربي خفيف مجاني
      llm: "HuggingFaceH4/zephyr-7b-beta",

      // أو نموذج أخف وأسرع
      lightLLM: "mistralai/Mistral-7B-Instruct-v0.1",
    };

    console.log("✅ RAG Service initialized with Hugging Face");
  }

  /**
   * ===================== EMBEDDINGS =====================
   * تحويل النصوص إلى vectors رياضية
   */

  /**
   * تحويل نص إلى embedding
   */
  async getEmbedding(text) {
    try {
      const response = await this.hf.featureExtraction({
        model: this.models.embedding,
        inputs: text,
      });

      return response;
    } catch (error) {
      console.error("❌ Embedding error:", error);
      // fallback: embedding بسيط محلي
      return this.generateSimpleEmbedding(text);
    }
  }

  /**
   * embedding بسيط محلي (للـ fallback)
   * يستخدم TF-IDF مبسط
   */
  generateSimpleEmbedding(text) {
    const vector = new Array(768).fill(0);
    const words = text.split(/\s+/);

    words.forEach((word, idx) => {
      const charCode = word.charCodeAt(0) || 0;
      for (let i = 0; i < vector.length; i++) {
        vector[i] += Math.sin(charCode + i) * Math.cos(idx + i);
      }
    });

    // تطبيع الـ vector
    const magnitude = Math.sqrt(
      vector.reduce((sum, val) => sum + val * val, 0)
    );
    return vector.map((v) => (magnitude ? v / magnitude : 0));
  }

  /**
   * حساب التشابه بين embeddings (Cosine Similarity)
   */
  cosineSimilarity(vec1, vec2) {
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      magnitude1 += vec1[i] * vec1[i];
      magnitude2 += vec2[i] * vec2[i];
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) return 0;
    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * ===================== CHUNKING =====================
   * تقسيم النصوص الطويلة إلى أجزاء صغيرة
   */

  /**
   * تقسيم النص إلى chunks ذكية
   */
  chunkDocument(text, chunkSize = 200, overlap = 50) {
    const chunks = [];
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim());

    let currentChunk = "";
    let chunkStart = 0;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();

      if ((currentChunk + sentence).length > chunkSize) {
        if (currentChunk) {
          chunks.push({
            text: currentChunk.trim(),
            startIdx: chunkStart,
            endIdx: chunkStart + currentChunk.length,
          });
        }

        // إضافة overlap
        const overlapText = currentChunk.slice(-overlap);
        currentChunk = overlapText + sentence;
        chunkStart += chunkSize - overlap;
      } else {
        currentChunk += sentence + ". ";
      }
    }

    if (currentChunk) {
      chunks.push({
        text: currentChunk.trim(),
        startIdx: chunkStart,
        endIdx: chunkStart + currentChunk.length,
      });
    }

    return chunks;
  }

  /**
   * ===================== INDEXING =====================
   * تخزين البيانات في Vector Database
   */

  /**
   * فهرسة مستند جديد
   */
  async indexDocument(documentId, text, metadata = {}) {
    try {
      console.log(`🔄 Indexing document: ${documentId}`);

      // 1. تقسيم النص إلى chunks
      const chunks = this.chunkDocument(text);

      // 2. تحويل كل chunk إلى embedding
      const embeddings = await Promise.all(
        chunks.map((chunk) => this.getEmbedding(chunk.text))
      );

      // 3. تخزين في Vector DB
      chunks.forEach((chunk, idx) => {
        const chunkId = `${documentId}_chunk_${idx}`;

        this.vectorDB.embeddings.set(chunkId, embeddings[idx]);
        this.vectorDB.documents.set(chunkId, chunk.text);
        this.vectorDB.metadata.set(chunkId, {
          documentId,
          chunkIndex: idx,
          ...metadata,
          createdAt: new Date(),
        });

        this.vectorDB.index.push(chunkId);
      });

      console.log(
        `✅ Indexed ${chunks.length} chunks from document ${documentId}`
      );
      return {
        success: true,
        chunksCount: chunks.length,
        chunkIds: chunks.map((_, idx) => `${documentId}_chunk_${idx}`),
      };
    } catch (error) {
      console.error("❌ Indexing error:", error);
      throw error;
    }
  }

  /**
   * ===================== RETRIEVAL =====================
   * البحث عن أكثر الـ chunks صلة بالسؤال
   */

  /**
   * البحث عن أكثر البيانات صلة
   */
  async retrieveRelevantChunks(query, topK = 3) {
    try {
      // 1. تحويل السؤال إلى embedding
      const queryEmbedding = await this.getEmbedding(query);

      // 2. حساب التشابه مع جميع الـ chunks
      const similarities = [];

      for (const chunkId of this.vectorDB.index) {
        const chunkEmbedding = this.vectorDB.embeddings.get(chunkId);
        const similarity = this.cosineSimilarity(
          queryEmbedding,
          chunkEmbedding
        );

        similarities.push({
          chunkId,
          similarity,
          text: this.vectorDB.documents.get(chunkId),
          metadata: this.vectorDB.metadata.get(chunkId),
        });
      }

      // 3. ترتيب والحصول على أفضل K chunks
      const topChunks = similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);

      return topChunks;
    } catch (error) {
      console.error("❌ Retrieval error:", error);
      return [];
    }
  }

  /**
   * ===================== GENERATION =====================
   * إنشاء إجابة بناءً على البيانات المسترجعة
   */

  /**
   * RAG Query: البحث + الإجابة
   */
  async ragQuery(query, topK = 3) {
    try {
      console.log(`🔍 RAG Query: ${query}`);

      // 1. استرجاع البيانات ذات الصلة
      const relevantChunks = await this.retrieveRelevantChunks(query, topK);

      if (relevantChunks.length === 0) {
        return {
          query,
          answer: "لم أعثر على بيانات ذات صلة",
          sources: [],
          confidence: 0,
        };
      }

      // 2. بناء السياق (Context) من البيانات المسترجعة
      const context = relevantChunks
        .map((chunk, idx) => `[المصدر ${idx + 1}]: ${chunk.text}`)
        .join("\n\n");

      // 3. بناء الـ prompt للـ LLM
      const systemPrompt = `أنت مساعد ذكي يجيب على الأسئلة بناءً على البيانات المعطاة فقط.
استخدم المعلومات المقدمة للإجابة بدقة وموثوقية.
إذا لم تجد الإجابة في البيانات، قل "لا توجد معلومات كافية".`;

      const userPrompt = `البيانات المتاحة:
${context}

السؤال: ${query}

الرجاء الإجابة بناءً على البيانات المعطاة فقط.`;

      // 4. استدعاء LLM
      const answer = await this.generateAnswer(systemPrompt, userPrompt);

      return {
        query,
        answer,
        sources: relevantChunks.map((chunk) => ({
          text: chunk.text.substring(0, 100) + "...",
          metadata: chunk.metadata,
          similarity: (chunk.similarity * 100).toFixed(2) + "%",
        })),
        confidence: relevantChunks[0]?.similarity || 0,
      };
    } catch (error) {
      console.error("❌ RAG Query error:", error);
      return {
        query,
        answer: `خطأ: ${error.message}`,
        sources: [],
        confidence: 0,
      };
    }
  }

  /**
   * استدعاء LLM لإنشاء الإجابة
   */
  async generateAnswer(systemPrompt, userPrompt) {
    try {
      const response = await this.hf.textGeneration({
        model: this.models.lightLLM,
        inputs: `${systemPrompt}\n\n${userPrompt}`,
        parameters: {
          max_new_tokens: 256,
          temperature: 0.7,
          top_p: 0.9,
        },
      });

      return response.generated_text || "لم أتمكن من إنشاء إجابة";
    } catch (error) {
      console.error("❌ LLM Generation error:", error);
      return "عذراً، حدث خطأ في إنشاء الإجابة";
    }
  }

  /**
   * ===================== ADVANCED FEATURES =====================
   */

  /**
   * تحديث المستند
   */
  async updateDocument(documentId, newText, metadata = {}) {
    // حذف المستند القديم
    await this.deleteDocument(documentId);
    // فهرسة المستند الجديد
    return this.indexDocument(documentId, newText, metadata);
  }

  /**
   * حذف المستند
   */
  async deleteDocument(documentId) {
    const toDelete = [];

    for (const chunkId of this.vectorDB.index) {
      if (chunkId.startsWith(documentId)) {
        toDelete.push(chunkId);
      }
    }

    toDelete.forEach((chunkId) => {
      this.vectorDB.embeddings.delete(chunkId);
      this.vectorDB.documents.delete(chunkId);
      this.vectorDB.metadata.delete(chunkId);
      this.vectorDB.index = this.vectorDB.index.filter((id) => id !== chunkId);
    });

    console.log(`🗑️ Deleted ${toDelete.length} chunks`);
    return toDelete.length;
  }

  /**
   * إحصائيات قاعدة البيانات
   */
  getStats() {
    return {
      totalChunks: this.vectorDB.index.length,
      totalDocuments: new Set(
        Array.from(this.vectorDB.metadata.values()).map((m) => m.documentId)
      ).size,
      memoryUsage:
        (this.vectorDB.index.length * 768 * 4) / (1024 * 1024) + " MB",
      models: this.models,
    };
  }

  /**
   * تنظيف الذاكرة
   */
  clear() {
    this.vectorDB.embeddings.clear();
    this.vectorDB.metadata.clear();
    this.vectorDB.documents.clear();
    this.vectorDB.index = [];
  }
}

// تصدير instance واحد
export const ragService = new RAGService();

export default ragService;
