import fp from "fastify-plugin";
import cors from "@fastify/cors";

async function corsPlugin(app) {
  app.register(cors, {
    origin: [
      "https://faltarah.vercel.app/",
      "https://faltra-system.vercel.app/",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposedHeaders: ["Set-Cookie"],
  });
}

export default fp(corsPlugin);
