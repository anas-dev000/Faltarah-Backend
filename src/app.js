import Fastify from "fastify";
import { config } from "./config/env.js";
import { errorHandler } from "./shared/middlewares/errorHandler.middleware.js";

// Plugins
import prismaPlugin from "./plugins/prisma.js";
import corsPlugin from "./plugins/cors.js";
import helmetPlugin from "./plugins/helmet.js";

// Routes
import userRoutes from "./modules/users/users.routes.js";

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

  // Health Check
  app.get("/", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  // Register Routes
  await app.register(userRoutes, { prefix: "/api/users" });

  // --- Error Handler ---
  app.setErrorHandler(errorHandler);

  return app;
}
