import { InvoicePDFGenerator } from "./generator/pdf.generator.js";

export class PDFService {
  constructor(invoiceService) {
    this.invoiceService = invoiceService; // inject service الفواتير
  }

  async generateInvoicePDF(prisma, invoiceId, currentUser) {
    // جلب بيانات الفاتورة باستخدام Service الأساسي
    const invoiceData = await this.invoiceService.getInvoiceById(
      prisma,
      invoiceId,
      currentUser
    );

    if (!invoiceData) {
      throw new Error("Invoice not found");
    }

    // استدعاء Generator مع البيانات
    const pdfGenerator = new InvoicePDFGenerator(invoiceData, "standard");
    const pdfBuffer = await pdfGenerator.generatePDF();

    return pdfBuffer;
  }
}
