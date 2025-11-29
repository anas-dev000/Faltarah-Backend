// ==========================================
// employees.repository.js
// ==========================================

/**
 * Fetch all employees with filtering by company + pagination
 */
export const findAllEmployees = async (
  prisma,
  companyId = null,
  page = 1,
  limit = 10
) => {
  const whereClause = companyId ? { companyId } : {};

  const skip = (page - 1) * limit;

  const employees = await prisma.employee.findMany({
    where: whereClause,
    select: {
      id: true,
      fullName: true,
      nationalId: true,
      role: true,
      idCardImage: true,
      idCardImagePublicId: true,
      primaryNumber: true,
      secondaryNumber: true,
      governorate: true,
      city: true,
      district: true,
      isEmployed: true,
      createdAt: true,
      company: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    skip,
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
  });

  const total = await prisma.employee.count({
    where: whereClause,
  });

  const totalPages = Math.ceil(total / limit);

  return {
    data: employees,
    total,
    totalPages,
    page,
  };
};

/**
 * Retrieve employee by ID with company verification
 */
export const findEmployeeById = async (prisma, id, companyId = null) => {
  const whereClause = {
    id,
    ...(companyId && { companyId }),
  };

  return prisma.employee.findFirst({
    where: whereClause,
    select: {
      id: true,
      fullName: true,
      nationalId: true,
      role: true,
      idCardImage: true,
      idCardImagePublicId: true,
      primaryNumber: true,
      secondaryNumber: true,
      governorate: true,
      city: true,
      district: true,
      isEmployed: true,
      createdAt: true,
      company: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });
};

/**
 * Get distinct roles for a company
 */
export const findAllRoles = async (prisma, companyId = null) => {
  const whereClause = companyId ? { companyId } : {};

  return prisma.employee.findMany({
    where: whereClause,
    distinct: ["role"],
    select: { role: true },
  });
};

/**
 * Get distinct Status for a company
 */
export const findAllStatus = async (prisma, companyId = null) => {
  const whereClause = companyId ? { companyId } : {};

  return prisma.employee.findMany({
    where: whereClause,
    distinct: ["isEmployed"],
    select: { isEmployed: true },
  });
};

/**
 * Fetch employees by role (SalesRep / Technician)
 */
export const findEmployeesByRole = async (prisma, role, companyId = null) => {
  const whereClause = {
    role,
    ...(companyId && { companyId }),
  };

  return prisma.employee.findMany({
    where: whereClause,
    select: {
      id: true,
      fullName: true,
      nationalId: true,
      role: true,
      primaryNumber: true,
      city: true,
      createdAt: true,
    },
  });
};

/**
 * Fetch employees by status with company filtering
 */
export const findEmployeesByStatus = async (
  prisma,
  isEmployed,
  companyId = null
) => {
  const whereClause = {
    isEmployed,
    ...(companyId && { companyId }),
  };

  return prisma.employee.findMany({
    where: whereClause,
    select: {
      id: true,
      fullName: true,
      nationalId: true,
      role: true,
      primaryNumber: true,
      secondaryNumber: true,
      governorate: true,
      city: true,
      district: true,
      isEmployed: true,
      createdAt: true,
      company: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

/**
 * Count employees for a specific company
 */
export const countEmployeesByCompany = async (prisma, companyId) => {
  return prisma.employee.count({
    where: { companyId },
  });
};

/**
 * Create a new employee
 */
export const createEmployee = async (prisma, data) => {
  return prisma.employee.create({
    data,
    select: {
      id: true,
      fullName: true,
      nationalId: true,
      role: true,
      primaryNumber: true,
      governorate: true,
      city: true,
      district: true,
      isEmployed: true,
      createdAt: true,
      idCardImage: true,
      idCardImagePublicId: true,
      company: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
};

/**
 * Update employee with company verification
 */
export const updateEmployee = async (prisma, id, data, companyId = null) => {
  const whereClause = {
    id,
    ...(companyId && { companyId }),
  };

  return prisma.employee.update({
    where: whereClause,
    data,
    select: {
      id: true,
      fullName: true,
      nationalId: true,
      role: true,
      primaryNumber: true,
      governorate: true,
      city: true,
      district: true,
      isEmployed: true,
      createdAt: true,
      idCardImage: true,
      idCardImagePublicId: true,
      company: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
};

/**
 * Delete employee (simple - without relations check)
 */
export const deleteEmployee = async (prisma, id, companyId = null) => {
  const whereClause = {
    id,
    ...(companyId && { companyId }),
  };

  return prisma.employee.delete({
    where: whereClause,
  });
};

/**
 *  Delete employee with all related records using transaction
 */
export const deleteEmployeeWithRelations = async (
  prisma,
  id,
  companyId = null
) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Get all invoices where this employee is salesRep or technician
    const invoicesAsSalesRep = await tx.invoice.findMany({
      where: { salesRepId: id },
      select: { id: true },
    });

    const invoicesAsTechnician = await tx.invoice.findMany({
      where: { technicianId: id },
      select: { id: true },
    });

    const allInvoiceIds = [
      ...invoicesAsSalesRep.map((inv) => inv.id),
      ...invoicesAsTechnician.map((inv) => inv.id),
    ];

    // Remove duplicates
    const uniqueInvoiceIds = [...new Set(allInvoiceIds)];

    if (uniqueInvoiceIds.length > 0) {
      // 2. Delete all installment payments related to these invoices
      const installments = await tx.installment.findMany({
        where: { invoiceId: { in: uniqueInvoiceIds } },
        select: { id: true },
      });

      const installmentIds = installments.map((inst) => inst.id);

      if (installmentIds.length > 0) {
        await tx.installmentPayment.deleteMany({
          where: { installmentId: { in: installmentIds } },
        });
      }

      // 3. Delete all installments
      await tx.installment.deleteMany({
        where: { invoiceId: { in: uniqueInvoiceIds } },
      });

      // 4. Delete all invoice items
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: { in: uniqueInvoiceIds } },
      });

      // 5. Delete all invoices
      await tx.invoice.deleteMany({
        where: { id: { in: uniqueInvoiceIds } },
      });
    }

    // 6. Delete all maintenances where this employee is the technician
    await tx.maintenance.deleteMany({
      where: { technicianId: id },
    });

    // 7. Finally delete the employee
    const whereClause = {
      id,
      ...(companyId && { companyId }),
    };

    await tx.employee.delete({
      where: whereClause,
    });

    return { success: true };
  });
};

/**
 * Check if national ID exists in the same company
 */
export const isNationalIdExistsInCompany = async (
  prisma,
  nationalId,
  companyId,
  excludeEmployeeId = null
) => {
  const whereClause = {
    nationalId,
    companyId,
    ...(excludeEmployeeId && { id: { not: excludeEmployeeId } }),
  };

  const employee = await prisma.employee.findFirst({
    where: whereClause,
  });

  return !!employee;
};
