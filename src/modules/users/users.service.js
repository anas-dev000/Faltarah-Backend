// ==========================================
// users.service.js
// ==========================================

import * as userRepo from "./users.repository.js";
import { hashPassword, comparePassword } from "../../shared/utils/password.js";
import { generateToken } from "../../shared/utils/jwt.js";
import { AppError } from "../../shared/errors/AppError.js";

/**
 * Fetch all users according to their permissions
 * @param {Object} prisma - Prisma client
 * @param {Object} currentUser - Current token user
 */
export const getAllUsers = async (prisma, currentUser) => {
  const { role, companyId } = currentUser;

  // Developer sees all users
  if (role === "developer") {
    return userRepo.findAllUsers(prisma, null);
  }

  // Manager can only see his company's users
  if (role === "manager") {
    return userRepo.findAllUsers(prisma, companyId);
  }

  // Employee cannot see the user list
  throw new AppError("Forbidden: Employees cannot view users list", 403);
};

/**
 * Fetch user by ID with validation
 * @param {Object} prisma - Prisma client
 * @param {Number} id - The desired user ID
 * @param {Object} currentUser - The current token user
 */
export const getUserById = async (prisma, id, currentUser) => {
  const { role, companyId, userId } = currentUser;

  let user;

  // Developer can access any user
  if (role === "developer") {
    user = await userRepo.findUserById(prisma, id, null);
  }
  // Manager can only access his company's users
  else if (role === "manager") {
    user = await userRepo.findUserById(prisma, id, companyId);
  }
  // Employee can only access their own profile
  else if (role === "employee") {
    if (id !== userId) {
      throw new AppError(
        "Forbidden: Employees can only view their own profile",
        403
      );
    }
    user = await userRepo.findUserById(prisma, id, companyId);
  }

  if (!user) {
    throw new AppError("User not found or access denied", 404);
  }

  return user;
};

/**
 * Create a new user
 * @param {Object} prisma - Prisma client
 * @param {Object} data - New user data
 * @param {Object} currentUser - Current token user
 */
export const createNewUser = async (prisma, data, currentUser) => {
  const { role, companyId } = currentUser;

  // Validation check for user creation
  if (role === "employee") {
    throw new AppError("Forbidden: Employees cannot create users", 403);
  }

  // Verify companyId
  let targetCompanyId = data.companyId;

  // Manager can only create users for their company
  if (role === "manager") {
    if (data.companyId !== companyId) {
      throw new AppError(
        "Forbidden: You can only create users for your company",
        403
      );
    }
    targetCompanyId = companyId;
  }

  // Developers can create users for any company
  // But the company must be verified.
  const companyExists = await prisma.company.findUnique({
    where: { id: targetCompanyId },
  });

  if (!companyExists) {
    throw new AppError("Company not found", 404);
  }

  //Manager cannot create a user with developer privileges
  if (role !== "developer" && data.role === "developer") {
    throw new AppError(
      "Forbidden: Only developers can create developer accounts",
      403
    );
  }

  // Check that the email address does not exist
  const emailExists = await userRepo.findUserByEmail(prisma, data.email);
  if (emailExists) {
    throw new AppError("Email already exists", 409);
  }

  // Password encryption
  const hashedPassword = await hashPassword(data.password);

  const userData = {
    companyId: targetCompanyId,
    fullName: data.fullName,
    email: data.email,
    passwordHash: hashedPassword,
    role: data.role,
    status: data.status || "Active",
  };

  return userRepo.createUser(prisma, userData);
};

/**
 * Update an existing user
 * @param {Object} prisma - Prisma client
 * @param {Number} id - The ID of the user to be updated
 * @param {Object} data - The data to be updated
 * @param {Object} currentUser - The current token user
 */
export const updateExistingUser = async (prisma, id, data, currentUser) => {
  const { role, companyId, userId } = currentUser;

  // Retrieve the user to be updated to verify eligibility
  const targetUser = await userRepo.findUserById(
    prisma,
    id,
    role === "developer" ? null : companyId
  );

  if (!targetUser) {
    throw new AppError("User not found or access denied", 404);
  }

  // Employee can only update their personal data (limited)
  if (role === "employee") {
    if (id !== userId) {
      throw new AppError(
        "Forbidden: Employees can only update their own profile",
        403
      );
    }
    // An employee cannot change their role, company ID, or status.
    if (data.role || data.companyId || data.status) {
      throw new AppError(
        "Forbidden: Employees cannot change role, company, or status",
        403
      );
    }
  }

  // Manager cannot change the developer role
  if (role !== "developer") {
    if (targetUser.role === "developer" || data.role === "developer") {
      throw new AppError(
        "Forbidden: Only developers can manage developer accounts",
        403
      );
    }
    // Manager cannot change companyId
    if (data.companyId && data.companyId !== companyId) {
      throw new AppError(
        "Forbidden: You cannot transfer users to other companies",
        403
      );
    }
  }

  // Check the email address if it has changed
  if (data.email && data.email !== targetUser.email) {
    const emailExists = await userRepo.findUserByEmail(prisma, data.email);
    if (emailExists) {
      throw new AppError("Email already exists", 409);
    }
  }

  const updateData = { ...data };

  // Encrypt the password if it is sent
  if (data.password) {
    updateData.passwordHash = await hashPassword(data.password);
    delete updateData.password;
  }

  // Delete fields that should not be updated
  // Changing the company is prohibited except for the developer
  delete updateData.companyId;

  return userRepo.updateUser(
    prisma,
    id,
    updateData,
    role === "developer" ? null : companyId
  );
};

/**
 * Delete user
 * @param {Object} prisma - Prisma client
 * @param {Number} id - ID of the user to be deleted
 * @param {Object} currentUser - Current token user
 */
export const deleteExistingUser = async (prisma, id, currentUser) => {
  const { role, companyId, userId } = currentUser;

  // Only the Developer can delete users
  if (role !== "developer") {
    throw new AppError("Forbidden: Only developers can delete users", 403);
  }

  // Prevent the user from deleting themselves
  if (id === userId) {
    throw new AppError("You cannot delete your own account", 400);
  }

  // Check user presence
  const user = await userRepo.findUserById(prisma, id, null);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  await userRepo.deleteUser(prisma, id, null);
  return { success: true };
};

/**
 * User Login
 * @param {Object} prisma - Prisma client
 * @param {String} email - Email address
 * @param {String} password - Password
 */
export const loginUser = async (prisma, email, password) => {
  const user = await userRepo.findUserByEmail(prisma, email);

  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  // Checking user status
  if (user.status !== "Active") {
    throw new AppError(
      "Your account is inactive. Please contact support.",
      403
    );
  }

  // Check if the company's subscription has expired (except for developers)
  if (user.role !== "developer") {
    const company = user.company;
    if (
      company.subscriptionExpiryDate &&
      new Date(company.subscriptionExpiryDate) < new Date()
    ) {
      throw new AppError(
        "Company subscription has expired. Please contact support.",
        403
      );
    }
  }

  const isValid = await comparePassword(password, user.passwordHash);
  if (!isValid) {
    throw new AppError("Invalid credentials", 401);
  }

  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
  });

  return {
    token,
    user: {
      id: user.id,
      companyId: user.companyId,
      companyName: user.company?.name,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    },
  };
};
