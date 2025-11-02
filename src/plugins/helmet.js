import fp from "fastify-plugin";
import helmet from "@fastify/helmet";

async function helmetPlugin(app) {
  app.register(helmet, {
    contentSecurityPolicy: false,
  });
}

export default fp(helmetPlugin);
