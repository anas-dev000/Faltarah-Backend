import fp from "fastify-plugin";
import cors from "@fastify/cors";

async function corsPlugin(app) {
  app.register(cors, {
    origin: true,
    credentials: true,
  });
}

export default fp(corsPlugin);
