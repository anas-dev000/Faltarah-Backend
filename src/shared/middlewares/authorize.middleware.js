import { AppError } from "../errors/AppError.js";

export function authorize(allowedRoles = []) {
  return async function (request, reply) {
    const userRole = request.user?.role;

    if (!userRole) {
      throw new AppError("Unauthorized: missing user role", 401);
    }

    if (!allowedRoles.includes(userRole)) {
      throw new AppError("Forbidden: insufficient permissions", 403);
    }
  };
}
