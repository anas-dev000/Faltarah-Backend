import { PDFService } from "./pdf.service.js";
// افترض إن invoiceService موجود ومهيأ مسبقاً
import * as invoicesService  from "../../modules/invoices/invoices.service.js";

const pdfService = new PDFService(invoicesService);

export async function generateInvoicePDFController(request, reply) {
  try {
    const { id } = request.params;
    const currentUser = request.user;

    const pdfBuffer = await pdfService.generateInvoicePDF(
      request.server.prisma,
      Number(id),
      currentUser
    );
    console.log("PDF buffer length:", pdfBuffer.length);
    reply
      .header("Content-Type", "application/pdf")
      .header(
        "Content-Disposition",
        `attachment; filename=invoice_${id}.pdf`
      )
      .send(pdfBuffer);
  } catch (error) {
    request.log.error(error);
    reply.status(500).send({
      success: false,
      error: error.message,
    });
  }
}
