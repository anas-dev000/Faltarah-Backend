// ==========================================
// users.controller.js
// ==========================================

import * as userService from "./users.service.js";

export const getAll = async (request, reply) => {
  const users = await userService.getAllUsers(request.server.prisma);
  return reply.send({ data: users });
};

export const getById = async (request, reply) => {
  const { id } = request.params;
  const user = await userService.getUserById(request.server.prisma, Number(id));
  return reply.send({ data: user });
};

export const create = async (request, reply) => {
  const user = await userService.createNewUser(
    request.server.prisma,
    request.body
  );
  return reply.status(201).send({ data: user });
};

export const update = async (request, reply) => {
  const { id } = request.params;
  const user = await userService.updateExistingUser(
    request.server.prisma,
    Number(id),
    request.body
  );
  return reply.send({ data: user });
};

export const deleteById = async (request, reply) => {
  const { id } = request.params;
  await userService.deleteExistingUser(request.server.prisma, Number(id));
  return reply.send({ success: true });
};

export const login = async (request, reply) => {
  const { email, password } = request.body;
  const result = await userService.loginUser(
    request.server.prisma,
    email,
    password
  );
  return reply.send(result);
};
