import fp from "fastify-plugin";
import prisma from "../config/database.js";

async function prismaPlugin(app) {
  app.decorate("prisma", prisma);
  console.log("database connected");
  app.addHook("onClose", async (instance) => {
    await instance.prisma.$disconnect();
  });
}

export default fp(prismaPlugin);
