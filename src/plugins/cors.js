import fp from "fastify-plugin";
import cors from "@fastify/cors";

async function corsPlugin(app) {
  app.register(cors, {
    origin: (origin, cb) => {
      const allowed = [
        "https://faltarah.vercel.app",
        "https://faltra-system.vercel.app",
        "http://localhost:5173",
      ];

      // allow origin any (Postman, mobile apps)
      if (!origin) {
        return cb(null, true);
      }

      if (allowed.includes(origin)) {
        cb(null, true);
      } else {
        console.error(`❌ CORS blocked origin: ${origin}`);
        cb(new Error("Not allowed by CORS"), false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cookie",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    exposedHeaders: ["Set-Cookie"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
}

export default fp(corsPlugin);
