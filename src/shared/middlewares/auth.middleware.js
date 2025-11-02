import { verifyToken } from "../utils/jwt.js";
import { AppError } from "../errors/AppError.js";

export async function authenticate(request, reply) {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("UNAUTHORIZED", 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    request.user = decoded;
  } catch (error) {
    throw new AppError("UNAUTHORIZED", 401);
  }
}
