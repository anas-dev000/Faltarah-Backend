export const findAllServices = async (prisma, companyId = null) => {
  const whereClause = companyId ? { companyId } : {};
  return prisma.service.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      companyId: true,
      _count: {
        select: {
          maintenances: true,
          invoiceItems: true,
        },
      },
    }
  });
};

export const findServiceById = async (prisma, id, restrictToCompanyId = null) => {
  const whereClause = { id, ...(restrictToCompanyId && { companyId: restrictToCompanyId }) };
  return prisma.service.findFirst({
    where: whereClause,
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      companyId: true,
      _count: {
        select: {
          maintenances: true,
          invoiceItems: true,
        },
      },
    },
  });
};

export const findServiceByName = async (prisma, name, excludeServiceId = null) => {
  const whereClause = { name, ...(excludeServiceId && { id: { not: excludeServiceId } }) };
  return prisma.service.findFirst({ where: whereClause, select: { id: true, name: true } });
};

export const createService = async (prisma, data) => {
  return prisma.service.create({ data });
};

export const updateService = async (prisma, id, data) => {
  return prisma.service.update({ where: { id }, data });
};

export const deleteService = async (prisma, id) => {
  return prisma.service.delete({ where: { id } });
};

export const checkServiceRelations = async (prisma, id) => {
  const service = await prisma.service.findUnique({
    where: { id },
    select: {
      _count: { select: { maintenances: true, invoiceItems: true } },
    },
  });
  if (!service) return null;

  const totalRelations = Object.values(service._count).reduce((sum, count) => sum + count, 0);
  return { hasRelations: totalRelations > 0, counts: service._count, totalRelations };
};
