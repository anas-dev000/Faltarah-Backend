// ==========================================
// customers.service.js
// ==========================================

import * as customerRepo from "./customers.repository.js";
import { AppError } from "../../shared/errors/AppError.js";

/**
 * Fetch all customers according to user permissions with pagination
 * @param {Object} prisma - Prisma client
 * @param {Object} currentUser - Current token user
 * @param {Number} page - Page number
 * @param {Number} limit - Records per page
 */
export const getAllCustomers = async (prisma, currentUser, page = 1, limit = 10) => {
  const { role, companyId } = currentUser;

  // Validate role
  if (!["developer", "manager", "employee"].includes(role)) {
    throw new AppError("Forbidden: Invalid role access", 403);
  }

  // developer sees all companies, others see their own
  const targetCompanyId = role === "developer" ? null : companyId;

  return customerRepo.findAllCustomers(prisma, targetCompanyId, page, limit);
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
 * Fetch all governorates (distinct)
 * @param {Object} prisma - Prisma client
 * @param {Object} currentUser - Current token user
 */
export const getAllTypes = async (prisma, currentUser) => {
  const { role, companyId } = currentUser;

  return customerRepo.findAllTypes(
    prisma,
    role === "developer" ? null : companyId
  );
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
 * Fetch all Cities (distinct)
 * @param {Object} prisma - Prisma client
 * @param {Object} currentUser - Current token user
 */
export const getAllCities = async (prisma, currentUser) => {
  const { role, companyId } = currentUser;

  return customerRepo.findAllCities(
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
 * @param {Object} prisma - Prisma client instance
 * @param {Object} data - Customer data
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} - Created customer
 */
export const createNewCustomer = async (prisma, data, currentUser) => {
  // Validate required fields
  if (!data.fullName || !data.nationalId || !data.primaryNumber) {
    throw new Error("Missing required fields: fullName, nationalId, or primaryNumber");
  }

  // Check if customer already exists
  const existingCustomer = await prisma.customer.findFirst({
    where: {
      nationalId: data.nationalId,
      companyId: currentUser.companyId,
    },
  });

  if (existingCustomer) {
    throw new Error("Customer with this National ID already exists");
  }

  // Prepare customer data
  const customerData = {
    companyId: currentUser.companyId,
    fullName: data.fullName,
    nationalId: data.nationalId,
    customerType: data.customerType || "Maintenance",
    primaryNumber: data.primaryNumber,
    secondaryNumber: data.secondaryNumber || null,
    governorate: data.governorate || null,
    city: data.city || null,
    district: data.district || null,
    // ✅ Include image URL and public_id
    idCardImage: data.idCardImage || null,
    idCardImagePublicId: data.idCardImagePublicId || null,
  };

  // Create customer
  const customer = await prisma.customer.create({
    data: customerData,
    include: {
      company: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return customer;
};

export default {
  createNewCustomer,
  // ... other customer service methods
};

/**
 * Update an existing customer
 * @param {Object} prisma - Prisma client instance
 * @param {Number} id - Customer ID
 * @param {Object} data - Update data
 * @param {Object} currentUser - Current authenticated user
 * @returns {Promise<Object>} - Updated customer
 */
export const updateExistingCustomer = async (prisma, id, data, currentUser) => {
  // Verify customer exists and belongs to user's company
  const customer = await prisma.customer.findFirst({
    where: {
      id: id,
      companyId: currentUser.companyId,
    },
  });

  if (!customer) {
    throw new Error("Customer not found or access denied");
  }

  // Prepare update data (only include provided fields)
  const updateData = {};

  // Basic fields
  if (data.fullName !== undefined) updateData.fullName = data.fullName;
  if (data.nationalId !== undefined) updateData.nationalId = data.nationalId;
  if (data.customerType !== undefined) updateData.customerType = data.customerType;
  if (data.primaryNumber !== undefined) updateData.primaryNumber = data.primaryNumber;
  if (data.secondaryNumber !== undefined) updateData.secondaryNumber = data.secondaryNumber;
  
  // Address fields
  if (data.governorate !== undefined) updateData.governorate = data.governorate;
  if (data.city !== undefined) updateData.city = data.city;
  if (data.district !== undefined) updateData.district = data.district;
  
  // ✅ Image fields (URL and public_id)
  if (data.idCardImage !== undefined) updateData.idCardImage = data.idCardImage;
  if (data.idCardImagePublicId !== undefined) updateData.idCardImagePublicId = data.idCardImagePublicId;

  // Check if there's anything to update
  if (Object.keys(updateData).length === 0) {
    throw new Error("No fields to update");
  }

  // If updating nationalId, check for duplicates
  if (data.nationalId && data.nationalId !== customer.nationalId) {
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        nationalId: data.nationalId,
        companyId: currentUser.companyId,
        id: { not: id },
      },
    });

    if (existingCustomer) {
      throw new Error("Customer with this National ID already exists");
    }
  }

  // Update customer
  const updatedCustomer = await prisma.customer.update({
    where: { id: id },
    data: updateData,
    include: {
      company: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return updatedCustomer;
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
