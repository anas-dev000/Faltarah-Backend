import { verifyToken } from "../utils/jwt.js";
import { AppError } from "../errors/AppError.js";

export async function authenticate(request, reply) {
  try {
    let token;

    // 1) Get token
    if (request.cookies?.token || request.cookies?.Token) {
      token = request.cookies.token || request.cookies.Token;
    } else if (
      request.headers.authorization &&
      request.headers.authorization.startsWith("Bearer ")
    ) {
      token = request.headers.authorization.split(" ")[1];
    }

    // 2) Check existence
    if (!token) {
      throw new AppError(
        "You are not logged in! Please log in to get access.",
        401
      );
    }

    // 3) Verify token
    const decoded = await verifyToken(token);
    request.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      companyId: decoded.companyId,
    };
  } catch (error) {
    throw new AppError("UNAUTHORIZED", 401);
  }
}
