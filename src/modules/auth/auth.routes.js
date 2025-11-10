import * as authController from "./auth.controller.js";
import {
  signupSchema,
  verifyOTPSchema,
  resendOTPSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
} from "./auth.schema.js";
import { validateSchema } from "../../shared/utils/validateSchema.js";

const validateBody = (schema) => {
  return async (request, reply) => {
    const validation = validateSchema(request.body, schema);

    if (!validation.valid) {
      return reply.status(400).send({
        success: false,
        error: "Validation Error",
        details: validation.errors,
      });
    }
  };
};

export default async function authRoutes(fastify) {
  fastify.post("/signup", {
    preHandler: [validateBody(signupSchema)],
    handler: authController.signup,
  });

  fastify.post("/verify-otp", {
    preHandler: [validateBody(verifyOTPSchema)],
    handler: authController.verifyOTP,
  });

  fastify.post("/resend-otp", {
    preHandler: [validateBody(resendOTPSchema)],
    handler: authController.resendOTP,
  });

  fastify.post("/forgot-password", {
    preHandler: [validateBody(requestPasswordResetSchema)],
    handler: authController.requestPasswordReset,
  });

  fastify.post("/reset-password", {
    preHandler: [validateBody(resetPasswordSchema)],
    handler: authController.resetPassword,
  });

  fastify.get("/verify-reset-token/:token", {
    handler: authController.verifyResetToken,
  });
}
