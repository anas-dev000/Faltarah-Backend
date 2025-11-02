import { buildApp } from "./src/app.js";
import { config } from "./src/config/env.js";

async function start() {
  try {
    const app = await buildApp();

    await app.listen({
      port: config.port,
      host: "127.0.0.1",
    });

    console.log(`🚀 Server listening on port ${config.port}`);
    console.log(`📚 Environment: ${config.nodeEnv}`);
  } catch (error) {
    console.error("❌ Error starting server:", error);
    process.exit(1);
  }
}

start();

process.on("exit", () => console.log("👋 Server stopped"));
