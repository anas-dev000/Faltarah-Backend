import * as serviceRepo from "./services.repository.js";
import { AppError } from "../../shared/errors/AppError.js";

export const getAllServices = async (prisma, currentUser, page = 1, limit = 10) => {
  const { role, companyId } = currentUser;
  const skip = (page - 1) * limit;
  const take = limit;

  if (role === "developer") return serviceRepo.findAllServices(prisma, null, skip, take);
  return serviceRepo.findAllServices(prisma, companyId, skip, take);
};

export const getServiceById = async (prisma, id, currentUser) => {
  const { role, companyId } = currentUser;
  let service;
  if (role === "developer") service = await serviceRepo.findServiceById(prisma, id);
  else service = await serviceRepo.findServiceById(prisma, id, companyId);

  if (!service) throw new AppError("Service not found or access denied", 404);
  return service;
};

export const createNewService = async (prisma, data, currentUser) => {
  const { role, companyId } = currentUser;
  if (role === "employee") throw new AppError("Forbidden: Employees cannot create services", 403);

  if (!data.companyId) data.companyId = companyId;

  const nameExists = await serviceRepo.findServiceByName(prisma, data.name);
  if (nameExists) throw new AppError("Service name already exists", 409);

  return serviceRepo.createService(prisma, data);
};

export const updateExistingService = async (prisma, id, data, currentUser) => {
  const { role, companyId } = currentUser;
  if (role === "employee") throw new AppError("Forbidden: Employees cannot update services", 403);

  let service;
  if (role === "developer") service = await serviceRepo.findServiceById(prisma, id);
  else service = await serviceRepo.findServiceById(prisma, id, companyId);

  if (!service) throw new AppError("Service not found or access denied", 404);

  if (data.name && data.name !== service.name) {
    const nameExists = await serviceRepo.findServiceByName(prisma, data.name, id);
    if (nameExists) throw new AppError("Service name already exists", 409);
  }

  return serviceRepo.updateService(prisma, id, data);
};

export const deleteExistingService = async (prisma, id, currentUser) => {
  const { role, companyId } = currentUser;
  let service;
  if (role === "developer") service = await serviceRepo.findServiceById(prisma, id);
  else service = await serviceRepo.findServiceById(prisma, id, companyId);

  if (!service) throw new AppError("Service not found or access denied", 404);

  const relations = await serviceRepo.checkServiceRelations(prisma, id);
  if (relations && relations.hasRelations) {
    throw new AppError(`Cannot delete service. It has ${relations.totalRelations} related records`, 400);
  }

  return serviceRepo.deleteService(prisma, id);
};
