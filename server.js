import { buildApp } from "./src/app.js";
import { config } from "./src/config/env.js";

async function start() {
  try {
    const app = await buildApp();

    await app.listen({
      port: config.port,
      host: "0.0.0.0",
    });

    await app.ready();
    app.log.info(`🚀 Server listening on port ${config.port}`);
    app.log.info(`📚 Environment: ${config.nodeEnv}`);

    const closeApp = async () => {
      await app.close();
      console.log("🛑 Server gracefully stopped");
      process.exit(0);
    };

    process.on("SIGINT", closeApp);
    process.on("SIGTERM", closeApp);
  } catch (error) {
    console.error("❌ Error starting server:", error);
    process.exit(1);
  }
}

start();
