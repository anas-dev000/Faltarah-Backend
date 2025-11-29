// ==========================================
// employees.service.js
// ==========================================

import * as employeeRepo from "./employees.repository.js";
import { AppError } from "../../shared/errors/AppError.js";

/**
 * Fetch all employees according to user permissions with pagination
 */
export const getAllEmployees = async (
  prisma,
  currentUser,
  page = 1,
  limit = 10
) => {
  const { role, companyId } = currentUser;

  if (!["developer", "manager", "employee"].includes(role)) {
    throw new AppError("Forbidden: Invalid role access", 403);
  }

  const targetCompanyId = role === "developer" ? null : companyId;

  return employeeRepo.findAllEmployees(prisma, targetCompanyId, page, limit);
};

/**
 * Fetch an employee by ID with role-based access control
 */
export const getEmployeeById = async (prisma, id, currentUser) => {
  const { role, companyId } = currentUser;

  const employee = await employeeRepo.findEmployeeById(
    prisma,
    id,
    role === "developer" ? null : companyId
  );

  if (!employee) {
    throw new AppError("Employee not found or access denied", 404);
  }

  return employee;
};

/**
 * Fetch employees by role (SalesRep / Technician)
 */
export const getEmployeesByRole = async (prisma, employeeRole, currentUser) => {
  const { role, companyId } = currentUser;

  return employeeRepo.findEmployeesByRole(
    prisma,
    employeeRole,
    role === "developer" ? null : companyId
  );
};

/**
 * Fetch all Roles (distinct)
 */
export const getAllRoles = async (prisma, currentUser) => {
  const { role, companyId } = currentUser;

  return employeeRepo.findAllRoles(
    prisma,
    role === "developer" ? null : companyId
  );
};

/**
 * Fetch all Status (distinct)
 */
export const getAllStatus = async (prisma, currentUser) => {
  const { role, companyId } = currentUser;

  return employeeRepo.findAllStatus(
    prisma,
    role === "developer" ? null : companyId
  );
};

/**
 * Get employees filtered by status word
 */
export const getEmployeesByStatus = async (prisma, statusWord, currentUser) => {
  const { role, companyId } = currentUser;

  if (!["developer", "manager", "employee"].includes(role)) {
    throw new AppError("Forbidden: Invalid role access", 403);
  }

  let isEmployed;
  if (statusWord.toLowerCase() === "active") isEmployed = true;
  else if (statusWord.toLowerCase() === "inactive") isEmployed = false;
  else
    throw new AppError(
      "Invalid status parameter, use 'active' or 'inactive'",
      400
    );

  const targetCompanyId = role === "developer" ? null : companyId;

  return employeeRepo.findEmployeesByStatus(
    prisma,
    isEmployed,
    targetCompanyId
  );
};

/**
 * Count all employees within a company
 */
export const countEmployees = async (prisma, currentUser) => {
  const { role, companyId } = currentUser;

  if (role === "developer") {
    return employeeRepo.countEmployeesByCompany(prisma, null);
  }

  return employeeRepo.countEmployeesByCompany(prisma, companyId);
};

/**
 * Create a new employee
 */
export const createNewEmployee = async (prisma, data, currentUser) => {
  if (!data.fullName || !data.nationalId || !data.primaryNumber) {
    throw new Error(
      "Missing required fields: fullName, nationalId, or primaryNumber"
    );
  }

  const existingEmployee = await prisma.employee.findFirst({
    where: {
      nationalId: data.nationalId,
      companyId: currentUser.companyId,
    },
  });

  if (existingEmployee) {
    throw new Error("Employee with this National ID already exists");
  }

  const employeeData = {
    companyId: currentUser.companyId,
    fullName: data.fullName,
    nationalId: data.nationalId,
    role: data.role || "Technician",
    primaryNumber: data.primaryNumber,
    secondaryNumber: data.secondaryNumber || null,
    governorate: data.governorate || null,
    city: data.city || null,
    district: data.district || null,
    isEmployed: data.isEmployed ?? true,
    idCardImage: data.idCardImage || null,
    idCardImagePublicId: data.idCardImagePublicId || null,
  };

  const employee = await prisma.employee.create({
    data: employeeData,
    include: {
      company: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return employee;
};

/**
 * Update an existing employee
 */
export const updateExistingEmployee = async (prisma, id, data, currentUser) => {
  const employee = await prisma.employee.findFirst({
    where: {
      id: id,
      companyId: currentUser.companyId,
    },
  });

  if (!employee) {
    throw new Error("Employee not found or access denied");
  }

  const updateData = {};

  if (data.fullName !== undefined) updateData.fullName = data.fullName;
  if (data.nationalId !== undefined) updateData.nationalId = data.nationalId;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.primaryNumber !== undefined)
    updateData.primaryNumber = data.primaryNumber;
  if (data.secondaryNumber !== undefined)
    updateData.secondaryNumber = data.secondaryNumber;
  if (data.governorate !== undefined) updateData.governorate = data.governorate;
  if (data.city !== undefined) updateData.city = data.city;
  if (data.district !== undefined) updateData.district = data.district;
  if (data.isEmployed !== undefined) updateData.isEmployed = data.isEmployed;

  if (data.idCardImage !== undefined) updateData.idCardImage = data.idCardImage;
  if (data.idCardImagePublicId !== undefined)
    updateData.idCardImagePublicId = data.idCardImagePublicId;

  if (Object.keys(updateData).length === 0) {
    throw new Error("No fields to update");
  }

  if (data.nationalId && data.nationalId !== employee.nationalId) {
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        nationalId: data.nationalId,
        companyId: currentUser.companyId,
        id: { not: id },
      },
    });

    if (existingEmployee) {
      throw new Error("Employee with this National ID already exists");
    }
  }

  const updatedEmployee = await prisma.employee.update({
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

  return updatedEmployee;
};

/**
 *  Delete an employee by ID with cascading deletion
 */
export const deleteExistingEmployee = async (prisma, id, currentUser) => {
  const { role, companyId } = currentUser;

  if (role === "employee") {
    throw new AppError("Forbidden: Employees cannot delete employees", 403);
  }

  const employee = await employeeRepo.findEmployeeById(
    prisma,
    id,
    role === "developer" ? null : companyId
  );

  if (!employee) {
    throw new AppError("Employee not found or access denied", 404);
  }

  //  Delete employee with all related records using transaction
  return employeeRepo.deleteEmployeeWithRelations(
    prisma,
    id,
    role === "developer" ? null : companyId
  );
};

export default {
  getAllEmployees,
  getEmployeeById,
  countEmployees,
  createNewEmployee,
  updateExistingEmployee,
  deleteExistingEmployee,
};
