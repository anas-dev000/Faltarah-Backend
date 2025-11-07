import Fastify from "fastify";
import { config } from "./config/env.js";
import { errorHandler } from "./shared/middlewares/errorHandler.middleware.js";

// Plugins
import prismaPlugin from "./plugins/prisma.js";
import corsPlugin from "./plugins/cors.js";
import helmetPlugin from "./plugins/helmet.js";
import fastifyCookie from "@fastify/cookie";

// Routes
import userRoutes from "./modules/users/users.routes.js";
import companyRoutes from "./modules/companies/companies.routes.js";
import productRoutes from "./modules/products/products.routes.js";
import accessoryRoutes from "./modules/accessories/accessories.routes.js";
import supplierRoutes from "./modules/suppliers/suppliers.routes.js";


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

  // Health Check
  app.get("/", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  // Register Routes
  await app.register(userRoutes, { prefix: "/api/users" });
  await app.register(companyRoutes, { prefix: "/api/companies" });
  await app.register(productRoutes, { prefix: "/api/products" });
  await app.register(accessoryRoutes, { prefix: "/api/accessories" });
    await app.register(supplierRoutes, { prefix: "/api/suppliers" });


  // --- Error Handler ---
  app.setErrorHandler(errorHandler);

  return app;
}
