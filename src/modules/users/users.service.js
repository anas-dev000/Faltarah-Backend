// ==========================================
// users.service.js
// ==========================================

import * as userRepo from "./users.repository.js";
import { hashPassword, comparePassword } from "../../shared/utils/password.js";
import { generateToken } from "../../shared/utils/jwt.js";
import { AppError } from "../../shared/errors/AppError.js";

export const getAllUsers = async (prisma) => {
  return userRepo.findAllUsers(prisma);
};

export const getUserById = async (prisma, id) => {
  const user = await userRepo.findUserById(prisma, id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};

export const createNewUser = async (prisma, data) => {
  const hashedPassword = await hashPassword(data.password);

  const userData = {
    companyId: data.companyId,
    fullName: data.fullName,
    email: data.email,
    passwordHash: hashedPassword,
    role: data.role,
    status: data.status || "Active",
  };

  return userRepo.createUser(prisma, userData);
};

export const updateExistingUser = async (prisma, id, data) => {
  await getUserById(prisma, id);

  const updateData = { ...data };

  if (data.password) {
    updateData.passwordHash = await hashPassword(data.password);
    delete updateData.password;
  }

  return userRepo.updateUser(prisma, id, updateData);
};

export const deleteExistingUser = async (prisma, id) => {
  await getUserById(prisma, id);
  await userRepo.deleteUser(prisma, id);
  return { success: true };
};

export const loginUser = async (prisma, email, password) => {
  const user = await userRepo.findUserByEmail(prisma, email);

  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  const isValid = await comparePassword(password, user.passwordHash);

  if (!isValid) {
    throw new AppError("Invalid credentials", 401);
  }

  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    },
  };
};
