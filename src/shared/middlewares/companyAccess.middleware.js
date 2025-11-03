import { AppError } from "../errors/AppError.js";

/**
 * Middleware to verify that the user has access to the requested company data
 * - Developer: Access to all companies
 * - Admin/Manager: Access to their company only
 * - Employee: Access to their company only
 */

export function checkCompanyAccess() {
  return async function (request, reply) {
    const userRole = request.user?.role;
    const userCompanyId = request.user?.companyId;
    // The developer has access to everything
    if (userRole === "developer") {
      return;
    }

    // Extract companyId from the request (can be in params, body or query)
    const requestedCompanyId =
      Number(request.params?.companyId) ||
      Number(request.body?.companyId) ||
      Number(request.query?.companyId);

    // If the request contains a companyId, we check access rights
    if (requestedCompanyId) {
      if (requestedCompanyId !== userCompanyId) {
        throw new AppError(
          "Forbidden: You don't have access to this company's data",
          403
        );
      }
    }

    // Add companyId to the request to be used in queries
    request.userCompanyId = userCompanyId;
  };
}
