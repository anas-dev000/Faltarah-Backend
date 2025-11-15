import { generateInvoicePDFController } from "./pdf.controller.js";
import { authenticate } from "../../shared/middlewares/auth.middleware.js";
import { checkCompanyAccess } from "../../shared/middlewares/companyAccess.middleware.js";
export default async function pdfRoutes(fastify) {
  fastify.get(
    "/:id/pdf",
    {
      preHandler: [authenticate, checkCompanyAccess()],
      schema: {
        description: "Generate PDF for invoice",
        tags: ["Invoices"],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "integer", minimum: 1 } },
        },
      },
    },
    generateInvoicePDFController
  );
}
