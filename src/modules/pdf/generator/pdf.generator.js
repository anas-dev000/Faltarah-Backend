import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import Handlebars from "handlebars";
import { fileURLToPath } from "url";

// تعريف __filename و __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class InvoicePDFGenerator {
  constructor(invoiceData, templateName = "standard") {
    this.invoiceData = invoiceData;
    this.templateName = templateName;
  }

  async generatePDF() {
    // 1️⃣ تحميل HTML Template
    const templatePath = path.join(
      __dirname,
      "templates",
      `${this.templateName}.html`
    );
    const templateHtml = fs.readFileSync(templatePath, "utf-8");

    // 2️⃣ Compile Template باستخدام Handlebars
    const template = Handlebars.compile(templateHtml);

    // 3️⃣ تجهيز البيانات للـ Template
    const data = this.prepareTemplateData();

    // 4️⃣ توليد HTML النهائي
    const html = template(data);

    // 5️⃣ توليد PDF باستخدام Puppeteer
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ 
      format: "A4", 
      printBackground: true,
      margin: { top: "20px", right: "20px", bottom: "20px", left: "20px" }
    });

    await browser.close();
    return pdfBuffer;
  }

  prepareTemplateData() {
    const invoice = this.invoiceData;
    
    // حساب الصافي
    const netAmount = parseFloat(invoice.totalAmount) - parseFloat(invoice.discountAmount || 0);
    
    // حساب المتبقي
    const paidAtContract = parseFloat(invoice.paidAtContract || 0);
    const paidAtInstallation = parseFloat(invoice.paidAtInstallation || 0);
    const totalPaid = paidAtContract + paidAtInstallation;
    const remainingAmount = netAmount - totalPaid;

    // معالجة بيانات الأقساط
    let installmentData = {};
    if (invoice.installment) {
      const installment = invoice.installment;
      const payments = installment.installmentPayments || [];
      
      // حساب إجمالي المدفوع والمتبقي
      const totalPaidInstallments = payments.reduce((sum, payment) => {
        return sum + parseFloat(payment.amountPaid || 0);
      }, 0);
      
      const remainingInstallments = payments.reduce((sum, payment) => {
        return sum + (parseFloat(payment.amountDue || 0) - parseFloat(payment.amountPaid || 0));
      }, 0);

      // معالجة جدول الأقساط
      const processedPayments = payments.map((payment, index) => {
        const isPaid = payment.status === 'Paid';
        const dueDate = new Date(payment.dueDate);
        const today = new Date();
        const isOverdue = !isPaid && dueDate < today;

        return {
          number: index + 1,
          dueDate: new Date(payment.dueDate).toLocaleDateString("ar-EG"),
          amountDue: parseFloat(payment.amountDue).toFixed(2),
          amountPaid: parseFloat(payment.amountPaid).toFixed(2),
          status: payment.status,
          isPaid: isPaid,
          isOverdue: isOverdue,
          paymentDate: payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString("ar-EG") : '-',
          notes: payment.notes || ''
        };
      });

      installmentData = {
        hasInstallment: true,
        numberOfMonths: installment.numberOfMonths,
        monthlyInstallment: parseFloat(installment.monthlyInstallment).toFixed(2),
        collectionStartDate: new Date(installment.collectionStartDate).toLocaleDateString("ar-EG"),
        collectionEndDate: new Date(installment.collectionEndDate).toLocaleDateString("ar-EG"),
        totalPaidInstallments: totalPaidInstallments.toFixed(2),
        remainingInstallments: remainingInstallments.toFixed(2),
        installmentPayments: processedPayments
      };
    } else {
      installmentData = { hasInstallment: false };
    }

    // تجهيز بيانات المنتجات
    const invoiceItems = invoice.invoiceItems.map(item => {
      const name = item.product?.name || item.accessory?.name || item.service?.name || "غير محدد";
      const category = item.product?.category || item.service?.description || "";
      
      return {
        name: name,
        category: category,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unitPrice).toFixed(2),
        subtotal: parseFloat(item.subtotal).toFixed(2),
      };
    });

    // البيانات النهائية
    return {
      // معلومات الفاتورة
      invoiceId: invoice.id,
      contractDate: new Date(invoice.contractDate).toLocaleDateString("ar-EG"),
      installationDate: invoice.installationDate 
        ? new Date(invoice.installationDate).toLocaleDateString("ar-EG") 
        : null,
      saleType: invoice.saleType === 'Installment' ? 'تقسيط' : 'كاش',
      
      // معلومات العميل
      customerName: invoice.customer.fullName,
      customerNationalId: invoice.customer.nationalId,
      customerType: invoice.customer.customerType === 'Maintenance' ? 'صيانة' : 'عادي',
      customerGovernorate: invoice.customer.governorate,
      customerCity: invoice.customer.city,
      customerDistrict: invoice.customer.district,
      customerPhone: invoice.customer.primaryNumber,
      customerSecondaryPhone: invoice.customer.secondaryNumber,
      
      // معلومات الموظفين
      salesRepName: invoice.salesRep.fullName,
      salesRepPhone: invoice.salesRep.primaryNumber,
      technicianName: invoice.technician?.fullName,
      technicianPhone: invoice.technician?.primaryNumber,
      maintenancePeriod: invoice.maintenancePeriod,
      
      // المنتجات والخدمات
      invoiceItems: invoiceItems,
      
      // الملخص المالي
      totalAmount: parseFloat(invoice.totalAmount).toFixed(2),
      discountAmount: invoice.discountAmount ? parseFloat(invoice.discountAmount).toFixed(2) : null,
      netAmount: netAmount.toFixed(2),
      paidAtContract: invoice.paidAtContract ? parseFloat(invoice.paidAtContract).toFixed(2) : null,
      paidAtInstallation: invoice.paidAtInstallation ? parseFloat(invoice.paidAtInstallation).toFixed(2) : null,
      installationCost: invoice.installationCostValue ? parseFloat(invoice.installationCostValue).toFixed(2) : null,
      installationCostType: invoice.installationCostType === 'Fixed' ? 'ثابت' : 'نسبة مئوية',
      remainingAmount: remainingAmount > 0 ? remainingAmount.toFixed(2) : null,
      
      // الملاحظات
      contractNotes: invoice.contractNotes,
      
      // معلومات الشركة
      companyName: invoice.company.name,
      companyAddress: invoice.company.address,
      companyPhone: invoice.company.phone,
      companyEmail: invoice.company.email,
      companyLogo: invoice.company.logo,
      
      // بيانات التقسيط
      ...installmentData
    };
  }

  // دالة مساعدة لحفظ الـ PDF في ملف
  async savePDF(outputPath) {
    const pdfBuffer = await this.generatePDF();
    fs.writeFileSync(outputPath, pdfBuffer);
    return outputPath;
  }

  // دالة مساعدة لإرجاع الـ PDF كـ Base64
  async generatePDFBase64() {
    const pdfBuffer = await this.generatePDF();
    return pdfBuffer.toString('base64');
  }
}

// مثال على الاستخدام:
/*
import { InvoicePDFGenerator } from './InvoicePDFGenerator.js';

// استخدام البيانات من الـ API
const generator = new InvoicePDFGenerator(invoiceData);

// توليد وحفظ الـ PDF
await generator.savePDF('./invoices/invoice-2.pdf');

// أو الحصول على Buffer
const pdfBuffer = await generator.generatePDF();

// أو الحصول على Base64
const pdfBase64 = await generator.generatePDFBase64();
*/