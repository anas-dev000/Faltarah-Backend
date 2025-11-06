import { verifyToken } from "../utils/jwt.js";
import { AppError } from "../errors/AppError.js";

export async function authenticate(request, reply) {
  try {
    let token = null;

    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }

    // 1) Get token
    if (!token && request.cookies?.token) {
      token = request.cookies.token;
    }

    // 2) Check existence
    if (!token) {
      throw new AppError(
        "Unauthorized: No token provided. You are not logged in! Please log in to get access.",
        401
      );
    }

    // 3) Verify token
    try {
      const decoded = await verifyToken(token);
      request.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        companyId: decoded.companyId,
      };
    } catch (err) {
      return reply.status(401).send({
        success: false,
        error: "Unauthorized: Invalid token",
      });
    }
  } catch (error) {
    return reply.status(500).send({
      success: false,
      error: "Authentication error",
    });
  }
}
