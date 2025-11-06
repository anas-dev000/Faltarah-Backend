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
import userRoutes from "./modules/users/users.routes.js";
import customerRoutes from "./modules/customers/customers.routes.js";
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

  // Register Plugins
  await app.register(prismaPlugin);
  await app.register(corsPlugin);
  await app.register(helmetPlugin);
  await app.register(fastifyCookie, {
    secret: config.cookieSecret,
    parseOptions: {},
  });
  await app.register(fastifyMultipart, {
  limits: { fileSize: 5 * 1024 * 1024 }, // حد أقصى 5 ميجا
  });
  // Health Check
  app.get("/", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  // Register Routes
  await app.register(userRoutes, { prefix: "/api/users" });
  await app.register(customerRoutes, { prefix: "/api/customers" })
  // --- Error Handler ---
  app.setErrorHandler(errorHandler);

  return app;
}
