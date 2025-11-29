// ==========================================
// users.controller.js
// ==========================================

import * as userService from "./users.service.js";

/**
 * Get all users
 */
export const getAll = async (request, reply) => {
  // From the authenticate middleware
  const currentUser = request.user;

  const pagination = {
    page: request.query.page || 1,
    limit: request.query.limit || 10,
  };

  const result = await userService.getAllUsers(
    request.server.prisma,
    currentUser,
    pagination
  );

  return reply.send({
    success: true,
    data: result.data,
    pagination: result.pagination,
  });
};

/**
 * Get user by ID
 */
export const getById = async (request, reply) => {
  const { id } = request.params;
  const currentUser = request.user;

  const user = await userService.getUserById(
    request.server.prisma,
    Number(id),
    currentUser
  );

  return reply.send({
    success: true,
    data: user,
  });
};

/**
 * Create a new user
 */
export const create = async (request, reply) => {
  const currentUser = request.user;
  const user = await userService.createNewUser(
    request.server.prisma,
    request.body,
    currentUser
  );

  return reply.status(201).send({
    success: true,
    message: "User created successfully",
    data: user,
  });
};

/**
 * Update existing user
 */
export const update = async (request, reply) => {
  const { id } = request.params;
  const currentUser = request.user;

  const user = await userService.updateExistingUser(
    request.server.prisma,
    Number(id),
    request.body,
    currentUser
  );

  return reply.send({
    success: true,
    message: "User updated successfully",
    data: user,
  });
};

/**
 * Delete user
 */
export const deleteById = async (request, reply) => {
  const { id } = request.params;
  const currentUser = request.user;

  await userService.deleteExistingUser(
    request.server.prisma,
    Number(id),
    currentUser
  );

  return reply.send({
    success: true,
    message: "User deleted successfully",
  });
};

/**
 * User Login
 */
export const login = async (request, reply) => {
  const { email, password } = request.body;

  const result = await usersService.login(request.server.prisma, {
    email,
    password,
  });

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  if (process.env.NODE_ENV !== "production") {
    cookieOptions.domain = "localhost";
  }

  reply.setCookie("token", result.token, cookieOptions);

  console.log("✅ Cookie set successfully:", {
    token: result.token.substring(0, 20) + "...",
    options: cookieOptions,
  });

  return reply.status(200).send({
    success: true,
    message: "Login successful",
    data: {
      user: result.user,
      token: result.token,
    },
  });
};

/**
 * Developer Login
 */
export const loginDev = async (request, reply) => {
  const { email, password } = request.body;
  const result = await userService.loginDevUser(
    request.server.prisma,
    email,
    password
  );

  const isProduction = process.env.NODE_ENV === "production";

  reply
    .setCookie("token", result.token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    })
    .status(200)
    .send({
      success: true,
      message: "Login successful",
      data: result,
    });
};

/**
 * User Logout
 */
export const logout = async (request, reply) => {
  reply.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });

  return reply.status(200).send({
    success: true,
    message: "Logged out successfully",
  });
};

/**
 * Retrieved the current user's file
 */
export const getProfile = async (request, reply) => {
  const currentUser = request.user;

  const user = await userService.getUserById(
    request.server.prisma,
    currentUser.userId,
    currentUser
  );

  return reply.send({
    success: true,
    data: user,
  });
};

/**
 * Update current user profile
 */
export const updateProfile = async (request, reply) => {
  const currentUser = request.user;

  const user = await userService.updateExistingUser(
    request.server.prisma,
    currentUser.userId,
    request.body,
    currentUser
  );

  return reply.send({
    success: true,
    message: "Profile updated successfully",
    data: user,
  });
};
