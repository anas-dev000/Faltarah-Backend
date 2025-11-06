import fp from "fastify-plugin";
import cors from "@fastify/cors";

async function corsPlugin(app) {
  app.register(cors, {
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });
}

export default fp(corsPlugin);
