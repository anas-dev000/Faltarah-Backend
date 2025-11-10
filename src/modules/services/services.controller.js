import * as serviceService from "./services.service.js";

export const getAll = async (request, reply) => {
  try {
    const { page = 1, limit = 10 } = request.query;
    const pageNumber = parseInt(page);
    const itemsPerPage = parseInt(limit);

    const { services, total } = await serviceService.getAllServices(
      request.server.prisma,
      request.user,
      pageNumber,
      itemsPerPage
    );

    const totalPages = Math.ceil(total / itemsPerPage);

    return reply.send({
      success: true,
      data: services,
      total,
      page: pageNumber,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    return reply.status(500).send({
      success: false,
      message: "حدث خطأ أثناء جلب الخدمات",
    });
  }
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
