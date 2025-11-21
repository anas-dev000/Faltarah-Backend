// ==========================================
// companies.service.js
// ==========================================

import * as companyRepo from "./companies.repository.js";
import { AppError } from "../../shared/errors/AppError.js";

/**
 * Fetch all companies according to user permissions
 * @param {Object} prisma - Prisma client
 * @param {Object} currentUser - Current token user
 */
export const getAllCompanies = async (prisma, currentUser) => {
  const { role, companyId } = currentUser;

  // Developer sees all companies
  if (role === "developer") {
    return companyRepo.findAllCompanies(prisma, null);
  }

  // Manager and Employee can only see their own company
  if (role === "manager" || role === "employee") {
    return companyRepo.findAllCompanies(prisma, companyId);
  }

  throw new AppError("Forbidden: Invalid role", 403);
};

/**
 * Fetch company by ID with validation
 * @param {Object} prisma - Prisma client
 * @param {Number} id - The desired company ID
 * @param {Object} currentUser - The current token user
 */
export const getCompanyById = async (prisma, id, currentUser) => {
  const { role, companyId } = currentUser;

  let company;

  // Developer can access any company
  if (role === "developer") {
    company = await companyRepo.findCompanyById(prisma, id, null);
  }
  // Manager and Employee can only access their own company
  else if (role === "manager" || role === "employee") {
    company = await companyRepo.findCompanyById(prisma, id, companyId);
  }

  if (!company) {
    throw new AppError("Company not found or access denied", 404);
  }

  return company;
};

/**
 * Create a new company
 * @param {Object} prisma - Prisma client
 * @param {Object} data - New company data
 * @param {Object} currentUser - Current token user
 */
export const createNewCompany = async (prisma, data, currentUser) => {
  const { role } = currentUser;

  // Only developers can create companies
  if (role !== "developer") {
    throw new AppError("Forbidden: Only developers can create companies", 403);
  }

  // Check if company name already exists
  const nameExists = await companyRepo.findCompanyByName(prisma, data.name);
  if (nameExists) {
    throw new AppError("Company name already exists", 409);
  }

  const companyData = {
    name: data.name,
    logo: data.logo || null,
    address: data.address || null,
    email: data.email || null,
    phone: data.phone || null,
    subscriptionExpiryDate: data.subscriptionExpiryDate
      ? new Date(data.subscriptionExpiryDate)
      : null,
  };

  return companyRepo.createCompany(prisma, companyData);
};

/**
 * Update an existing company
 * @param {Object} prisma - Prisma client
 * @param {Number} id - The ID of the company to be updated
 * @param {Object} data - The data to be updated
 * @param {Object} currentUser - The current token user
 */
export const updateExistingCompany = async (prisma, id, data, currentUser) => {
  const { role, companyId } = currentUser;

  // Check if company exists and user has access
  let targetCompany;

  if (role === "developer") {
    targetCompany = await companyRepo.findCompanyById(prisma, id, null);
  } else if (role === "manager") {
    // Manager can only update their own company
    if (id !== companyId) {
      throw new AppError(
        "Forbidden: You can only update your own company",
        403
      );
    }
    targetCompany = await companyRepo.findCompanyById(prisma, id, companyId);
  } else {
    // Employee cannot update companies
    throw new AppError("Forbidden: Employees cannot update companies", 403);
  }

  if (!targetCompany) {
    throw new AppError("Company not found or access denied", 404);
  }

  // Check if new name already exists (if name is being changed)
  if (data.name && data.name !== targetCompany.name) {
    const nameExists = await companyRepo.findCompanyByName(
      prisma,
      data.name,
      id
    );
    if (nameExists) {
      throw new AppError("Company name already exists", 409);
    }
  }

  const updateData = { ...data };

  // Convert subscriptionExpiryDate to Date object if provided
  if (updateData.subscriptionExpiryDate) {
    updateData.subscriptionExpiryDate = new Date(
      updateData.subscriptionExpiryDate
    );
  }

  // Manager cannot update subscription expiry date
  if (role === "manager" && updateData.subscriptionExpiryDate) {
    throw new AppError(
      "Forbidden: Only developers can update subscription expiry date",
      403
    );
  }

  return companyRepo.updateCompany(prisma, id, updateData);
};

/**
 * Update company subscription expiry date
 * @param {Object} prisma - Prisma client
 * @param {Number} id - Company ID
 * @param {String} newExpiryDate - New expiry date
 * @param {Object} currentUser - Current token user
 */
export const updateCompanySubscription = async (
  prisma,
  id,
  newExpiryDate,
  currentUser
) => {
  const { role } = currentUser;

  if (role !== "developer") {
    throw new AppError(
      "Forbidden: Only developers can update subscription expiry dates",
      403
    );
  }

  const company = await companyRepo.findCompanyById(prisma, id, null);
  if (!company) {
    throw new AppError("Company not found", 404);
  }

  const currentExpiry = new Date(company.subscriptionExpiryDate);
  const newDate = new Date(newExpiryDate);

  // 🔥 منع تقليل الاشتراك
  if (newDate < currentExpiry) {
    throw new AppError(
      `Cannot reduce subscription period. Current expiry is ${currentExpiry.toISOString().split('T')[0]}`,
      400
    );
  }

  const updateData = {
    subscriptionExpiryDate: newDate,
  };

  return companyRepo.updateCompany(prisma, id, updateData);
};


/**
 * ✅ Delete company with cascading deletion (Developer only)
 */
export const deleteExistingCompany = async (prisma, id, currentUser) => {
  const { role, companyId } = currentUser;

  // Only developers can delete companies
  if (role !== "developer") {
    throw new AppError("Forbidden: Only developers can delete companies", 403);
  }

  // Prevent developer from deleting their own company
  if (id === companyId) {
    throw new AppError("You cannot delete your own company", 400);
  }

  // Check if company exists
  const company = await companyRepo.findCompanyById(prisma, id, null);
  if (!company) {
    throw new AppError("Company not found", 404);
  }

  // ✅ Delete company with all related records using transaction
  return companyRepo.deleteCompanyWithRelations(prisma, id);
};
