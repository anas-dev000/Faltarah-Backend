// ==========================================
// customers.service.js
// ==========================================

import * as customerRepo from "./customers.repository.js";
import { AppError } from "../../shared/errors/AppError.js";

/**
 * Fetch all customers according to user permissions
 * @param {Object} prisma - Prisma client
 * @param {Object} currentUser - Current token user
 */
export const getAllCustomers = async (prisma, currentUser) => {
  const { role, companyId } = currentUser;

  if (role === "developer") {
    return customerRepo.findAllCustomers(prisma, null);
  }

  if (role === "manager" || role === "employee") {
    return customerRepo.findAllCustomers(prisma, companyId);
  }

  throw new AppError("Forbidden: Invalid role access", 403);
};

/**
 * Fetch a customer by ID with role-based access control
 * @param {Object} prisma - Prisma client
 * @param {Number} id - Customer ID
 * @param {Object} currentUser - Current token user
 */
export const getCustomerById = async (prisma, id, currentUser) => {
  const { role, companyId } = currentUser;

  const customer = await customerRepo.findCustomerById(
    prisma,
    id,
    role === "developer" ? null : companyId
  );

  if (!customer) {
    throw new AppError("Customer not found or access denied", 404);
  }

  return customer;
};

/**
 * Fetch customers by type (Installation / Maintenance)
 * @param {Object} prisma - Prisma client
 * @param {String} customerType - The type of customers to filter
 * @param {Object} currentUser - Current token user
 */
export const getCustomersByType = async (
  prisma,
  customerType,
  currentUser
) => {
  const { role, companyId } = currentUser;

  return customerRepo.findCustomersByType(
    prisma,
    customerType,
    role === "developer" ? null : companyId
  );
};

/**
 * Fetch all governorates (distinct)
 * @param {Object} prisma - Prisma client
 * @param {Object} currentUser - Current token user
 */
export const getAllGovernorates = async (prisma, currentUser) => {
  const { role, companyId } = currentUser;

  return customerRepo.findAllGovernorates(
    prisma,
    role === "developer" ? null : companyId
  );
};

/**
 * Fetch all cities for a specific governorate
 * @param {Object} prisma - Prisma client
 * @param {String} governorate - Governorate name
 * @param {Object} currentUser - Current token user
 */
export const getCitiesByGovernorate = async (
  prisma,
  governorate,
  currentUser
) => {
  const { role, companyId } = currentUser;

  return customerRepo.findCitiesByGovernorate(
    prisma,
    governorate,
    role === "developer" ? null : companyId
  );
};

/**
 * Count all customers within a company
 * @param {Object} prisma - Prisma client
 * @param {Object} currentUser - Current token user
 */
export const countCustomers = async (prisma, currentUser) => {
  const { role, companyId } = currentUser;

  if (role === "developer") {
    return customerRepo.countCustomersByCompany(prisma, null);
  }

  return customerRepo.countCustomersByCompany(prisma, companyId);
};

/**
 * Create a new customer
 * @param {Object} prisma - Prisma client
 * @param {Object} data - Customer data
 * @param {Object} currentUser - Current token user
 */
export const createNewCustomer = async (prisma, data, currentUser) => {
  const { role, companyId } = currentUser;
  console.log(role,companyId,data.companyId);

  if (role === "employee") {
    throw new AppError("Forbidden: Employees cannot create customers", 403);
  }

  let targetCompanyId = data.companyId;
  
  // Manager can only create customers in their own company
  if (role === "manager") {
    if (data.companyId != companyId) {
      throw new AppError(
        "Forbidden: You can only create customers for your company",
        403
      );
    }
    targetCompanyId = companyId;
  }

  // Verify company existence
  const companyExists = await prisma.company.findUnique({
    where: { id: targetCompanyId },
  });

  if (!companyExists) {
    throw new AppError("Company not found", 404);
  }

  // Check nationalId uniqueness inside company
  const existingCustomer = await prisma.customer.findFirst({
    where: { nationalId: data.nationalId, companyId: targetCompanyId },
  });

  if (existingCustomer) {
    throw new AppError("Customer with this National ID already exists", 409);
  }

  const customerData = {
    companyId: targetCompanyId,
    fullName: data.fullName,
    nationalId: data.nationalId,
    customerType: data.customerType,
    idCardImage: data.idCardImage || null,
    primaryNumber: data.primaryNumber,
    secondaryNumber: data.secondaryNumber || null,
    governorate: data.governorate,
    city: data.city,
    district: data.district,
  };

  return customerRepo.createCustomer(prisma, customerData);
};

/**
 * Update a customer's data
 * @param {Object} prisma - Prisma client
 * @param {Number} id - Customer ID
 * @param {Object} data - Fields to update
 * @param {Object} currentUser - Current token user
 */
export const updateExistingCustomer = async (
  prisma,
  id,
  data,
  currentUser
) => {
  const { role, companyId } = currentUser;

  const customer = await customerRepo.findCustomerById(
    prisma,
    id,
    role === "developer" ? null : companyId
  );

  if (!customer) {
    throw new AppError("Customer not found or access denied", 404);
  }

  if (role === "employee") {
    throw new AppError("Forbidden: Employees cannot update customers", 403);
  }

  // Manager cannot update other companies' customers
  if (role === "manager" && customer.companyId !== companyId) {
    throw new AppError(
      "Forbidden: You can only update customers from your company",
      403
    );
  }

  // Check if nationalId already exists for another customer
  if (data.nationalId && data.nationalId !== customer.nationalId) {
    const exists = await prisma.customer.findFirst({
      where: {
        nationalId: data.nationalId,
        companyId: customer.companyId,
        id: { not: id },
      },
    });
    if (exists) {
      throw new AppError("National ID already used by another customer", 409);
    }
  }

  return customerRepo.updateCustomer(
    prisma,
    id,
    data,
    role === "developer" ? null : companyId
  );
};

/**
 * Delete a customer by ID
 * @param {Object} prisma - Prisma client
 * @param {Number} id - Customer ID
 * @param {Object} currentUser - Current token user
 */
export const deleteExistingCustomer = async (prisma, id, currentUser) => {
  const { role, companyId } = currentUser;

  if (role === "employee") {
    throw new AppError("Forbidden: Employees cannot delete customers", 403);
  }

  const customer = await customerRepo.findCustomerById(
    prisma,
    id,
    role === "developer" ? null : companyId
  );

  if (!customer) {
    throw new AppError("Customer not found or access denied", 404);
  }

  return customerRepo.deleteCustomer(
    prisma,
    id,
    role === "developer" ? null : companyId
  );
};
