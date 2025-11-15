import Fastify from "fastify";
import { config } from "./config/env.js";
import { errorHandler } from "./shared/middlewares/errorHandler.middleware.js";

// Plugins
import prismaPlugin from "./plugins/prisma.js";
import corsPlugin from "./plugins/cors.js";
import helmetPlugin from "./plugins/helmet.js";
import fastifyCookie from "@fastify/cookie";
import fastifyMultipart from "@fastify/multipart";
// Routes
import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/users/users.routes.js";
import companyRoutes from "./modules/companies/companies.routes.js";
import productRoutes from "./modules/products/products.routes.js";
import accessoryRoutes from "./modules/accessories/accessories.routes.js";
import suppliersRoutes from "./modules/suppliers/suppliers.routes.js";
import maintenanceRoutes from "./modules/maintenances/maintenances.routes.js";
import invoicesRoutes from "./modules/invoices/invoices.routes.js";
import installmentsRoutes from "./modules/installments/installments.routes.js";
import customerRoutes from "./modules/customers/customers.routes.js";
import employeeRoutes from "./modules/employees/employees.routes.js";
import serviceRoutes from "./modules/services/services.routes.js";
import dashboardRoutes from "./modules/dashboard/dashboard.routes.js";
import installmentPaymentsRoutes from "./modules/installmentPayments/installmentPayments.routes.js";

export async function buildApp(opts = {}) {
  const app = Fastify({
    logger: {
      level: config.logging.level,
      transport:
        config.nodeEnv === "development"
          ? {
              target: "pino-pretty",
              options: {
                translateTime: "HH:MM:ss Z",
                ignore: "pid,hostname",
              },
            }
          : undefined,
    },
    ...opts,
  });

  await app.register(corsPlugin);
  await app.register(helmetPlugin);

  await app.register(fastifyCookie, {
    secret: config.cookieSecret,
    parseOptions: {},
  });

  await app.register(prismaPlugin);
  await app.register(fastifyMultipart, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
      files: 1, // Max 1 file
    },
  });
  // Health Check
  app.get("/", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  // Register Routes
  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(userRoutes, { prefix: "/api/users" });
  await app.register(companyRoutes, { prefix: "/api/companies" });
  await app.register(productRoutes, { prefix: "/api/products" });
  await app.register(accessoryRoutes, { prefix: "/api/accessories" });
  await app.register(suppliersRoutes, { prefix: "/api/suppliers" });
  await app.register(maintenanceRoutes, { prefix: "/api/maintenances" });
  await app.register(installmentPaymentsRoutes, {
    prefix: "/api/installment-payments",
  });
  await app.register(installmentsRoutes, { prefix: "/api/installments" });
  await app.register(invoicesRoutes, { prefix: "/api/invoices" });
  await app.register(customerRoutes, { prefix: "/api/customers" });
  await app.register(employeeRoutes, { prefix: "/api/employees" });
  await app.register(serviceRoutes,{prefix:"/api/services"})
  await app.register(dashboardRoutes, { prefix: "/api/dashboard" });
  
  
  // --- Error Handler ---
  app.setErrorHandler(errorHandler);

  return app;
}
