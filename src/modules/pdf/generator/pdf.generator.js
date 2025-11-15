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
    const data = {
      invoiceId: this.invoiceData.id,
      contractDate: new Date(this.invoiceData.contractDate).toLocaleDateString("ar-EG"),
      customerName: this.invoiceData.customer.fullName,
      customerNationalId: this.invoiceData.customer.nationalId,
      customerCity: this.invoiceData.customer.city,
      customerDistrict: this.invoiceData.customer.district,
      customerPhone: this.invoiceData.customer.primaryNumber,
      invoiceItems: this.invoiceData.invoiceItems.map(item => {
        const name = item.product?.name || item.accessory?.name || item.service?.name || "";
        return {
          name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
        };
      }),
      totalAmount: this.invoiceData.totalAmount,
      discountAmount: this.invoiceData.discountAmount,
      netAmount: this.invoiceData.totalAmount - this.invoiceData.discountAmount,
      companyName: this.invoiceData.company.name,
      companyAddress: this.invoiceData.company.address,
      companyPhone: this.invoiceData.company.phone,
    };

    // 4️⃣ توليد HTML النهائي
    const html = template(data);

    // 5️⃣ توليد PDF باستخدام Puppeteer
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });

    await browser.close();
    return pdfBuffer;
  }
}
