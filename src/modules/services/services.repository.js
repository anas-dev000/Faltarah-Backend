export const findAllServices = async (prisma, companyId = null, skip = 0, take = 10) => {
  const whereClause = companyId ? { companyId } : {};

  const [services, total] = await Promise.all([
    prisma.service.findMany({
      where: whereClause,
      skip,
      take,
      orderBy: { id: 'desc' },
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
    }),
    prisma.service.count({ where: whereClause }),
  ]);

  return { services, total };
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

/**
 * ✅ Delete service with cascading deletion using transaction
 */
export const deleteServiceWithRelations = async (prisma, id) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Delete all maintenances referencing this service
    await tx.maintenance.deleteMany({
      where: { serviceId: id },
    });

    // 2. Delete all invoice items referencing this service
    await tx.invoiceItem.deleteMany({
      where: { serviceId: id },
    });

    // 3. Finally delete the service itself
    await tx.service.delete({
      where: { id },
    });

    return { success: true };
  });
};

/**
 * ✅ Check service relations (for information only)
 */
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