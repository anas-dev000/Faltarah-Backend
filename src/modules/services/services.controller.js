import * as serviceService from "./services.service.js";

export const getAll = async (request, reply) => {
  const services = await serviceService.getAllServices(request.server.prisma, request.user);
  return reply.send({ success: true, data: services, count: services.length });
};

export const getById = async (request, reply) => {
  const service = await serviceService.getServiceById(
    request.server.prisma,
    Number(request.params.id),
    request.user
  );
  return reply.send({ success: true, data: service });
};

export const create = async (request, reply) => {
  const service = await serviceService.createNewService(
    request.server.prisma,
    request.body,
    request.user
  );
  return reply.status(201).send({ success: true, message: "Service created successfully", data: service });
};

export const update = async (request, reply) => {
  const service = await serviceService.updateExistingService(
    request.server.prisma,
    Number(request.params.id),
    request.body,
    request.user
  );
  return reply.send({ success: true, message: "Service updated successfully", data: service });
};

export const deleteById = async (request, reply) => {
  await serviceService.deleteExistingService(
    request.server.prisma,
    Number(request.params.id),
    request.user
  );
  return reply.send({ success: true, message: "Service deleted successfully" });
};
