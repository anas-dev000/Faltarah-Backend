// ==========================================
// customers.repository.js
// ==========================================

/**
 * Fetch all customers with filtering by company + pagination
 */
export const findAllCustomers = async (
  prisma,
  companyId = null,
  page = 1,
  limit = 10
) => {
  const whereClause = companyId ? { companyId } : {};

  const skip = (page - 1) * limit;

  const customers = await prisma.customer.findMany({
    where: whereClause,
    select: {
      id: true,
      companyId: true,
      fullName: true,
      nationalId: true,
      customerType: true,
      idCardImage: true,
      primaryNumber: true,
      secondaryNumber: true,
      governorate: true,
      city: true,
      district: true,
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

  const total = await prisma.customer.count({
    where: whereClause,
  });

  const totalPages = Math.ceil(total / limit);

  return {
    data: customers,
    total,
    totalPages,
    page,
  };
};

/**
 * Retrieve customer by ID with company verification
 */
export const findCustomerById = async (prisma, id, companyId = null) => {
  const whereClause = {
    id,
    ...(companyId && { companyId }),
  };

  return prisma.customer.findFirst({
    where: whereClause,
    select: {
      id: true,
      companyId: true,
      fullName: true,
      nationalId: true,
      customerType: true,
      idCardImage: true,
      primaryNumber: true,
      secondaryNumber: true,
      governorate: true,
      city: true,
      district: true,
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
 * Get distinct types for a company
 */
export const findAllTypes = async (prisma, companyId = null) => {
  const whereClause = companyId ? { companyId } : {};

  return prisma.customer.findMany({
    where: whereClause,
    distinct: ["customerType"],
    select: { customerType: true },
  });
};

/**
 * Fetch customers by type (Installation / Maintenance)
 */
export const findCustomersByType = async (
  prisma,
  customerType,
  companyId = null
) => {
  const whereClause = {
    customerType,
    ...(companyId && { companyId }),
  };

  return prisma.customer.findMany({
    where: whereClause,
    select: {
      id: true,
      fullName: true,
      nationalId: true,
      customerType: true,
      primaryNumber: true,
      city: true,
      createdAt: true,
    },
  });
};

/**
 * Get distinct governorates for a company
 */
export const findAllGovernorates = async (prisma, companyId = null) => {
  const whereClause = companyId ? { companyId } : {};

  return prisma.customer.findMany({
    where: whereClause,
    distinct: ["governorate"],
    select: { governorate: true },
  });
};

/**
 * Get distinct cities for a company
 */
export const findAllCities = async (prisma, companyId = null) => {
  const whereClause = companyId ? { companyId } : {};

  return prisma.customer.findMany({
    where: whereClause,
    distinct: ["city"],
    select: { city: true },
  });
};

/**
 * Get distinct cities for a specific governorate
 */
export const findCitiesByGovernorate = async (
  prisma,
  governorate,
  companyId = null
) => {
  const whereClause = {
    governorate,
    ...(companyId && { companyId }),
  };

  return prisma.customer.findMany({
    where: whereClause,
    distinct: ["city"],
    select: { city: true },
  });
};

/**
 * Count customers for a specific company
 */
export const countCustomersByCompany = async (prisma, companyId) => {
  return prisma.customer.count({
    where: { companyId },
  });
};

/**
 * Create a new customer
 */
export const createCustomer = async (prisma, data) => {
  return prisma.customer.create({
    data,
    select: {
      id: true,
      companyId: true,
      fullName: true,
      nationalId: true,
      customerType: true,
      primaryNumber: true,
      governorate: true,
      city: true,
      district: true,
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
 * Update customer with company verification
 */
export const updateCustomer = async (prisma, id, data, companyId = null) => {
  const whereClause = {
    id,
    ...(companyId && { companyId }),
  };

  return prisma.customer.update({
    where: whereClause,
    data,
    select: {
      id: true,
      companyId: true,
      fullName: true,
      nationalId: true,
      customerType: true,
      primaryNumber: true,
      governorate: true,
      city: true,
      district: true,
      createdAt: true,
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
 * Delete customer (simple - without relations check)
 */
export const deleteCustomer = async (prisma, id, companyId = null) => {
  const whereClause = {
    id,
    ...(companyId && { companyId }),
  };

  return prisma.customer.delete({
    where: whereClause,
  });
};

/**
 * ✅ Delete customer with all related records using transaction
 */
export const deleteCustomerWithRelations = async (
  prisma,
  id,
  companyId = null
) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Get all invoices for this customer
    const invoices = await tx.invoice.findMany({
      where: { customerId: id },
      select: { id: true },
    });

    const invoiceIds = invoices.map((inv) => inv.id);

    if (invoiceIds.length > 0) {
      // 2. Delete all installment payments related to this customer
      await tx.installmentPayment.deleteMany({
        where: { customerId: id },
      });

      // 3. Delete all installments related to these invoices
      await tx.installment.deleteMany({
        where: { invoiceId: { in: invoiceIds } },
      });

      // 4. Delete all invoice items related to these invoices
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: { in: invoiceIds } },
      });

      // 5. Delete all invoices
      await tx.invoice.deleteMany({
        where: { id: { in: invoiceIds } },
      });
    }

    // 6. Delete all maintenances for this customer
    await tx.maintenance.deleteMany({
      where: { customerId: id },
    });

    // 7. Delete all customer maintenance statuses (already CASCADE in schema, but being explicit)
    await tx.customerMaintenanceStatus.deleteMany({
      where: { customerId: id },
    });

    // 8. Finally delete the customer
    const whereClause = {
      id,
      ...(companyId && { companyId }),
    };

    await tx.customer.delete({
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
  excludeCustomerId = null
) => {
  const whereClause = {
    nationalId,
    companyId,
    ...(excludeCustomerId && { id: { not: excludeCustomerId } }),
  };

  const customer = await prisma.customer.findFirst({
    where: whereClause,
  });

  return !!customer;
};
