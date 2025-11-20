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
  const users = await userService.getAllUsers(
    request.server.prisma,
    currentUser
  );
  return reply.send({
    success: true,
    data: users,
    count: users.length,
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
  const result = await userService.loginUser(
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
  const isProduction = process.env.NODE_ENV === "production";

  reply
    .clearCookie("token", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
    })
    .status(200)
    .send({
      success: true,
      message: "You have been logged out successfully",
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
