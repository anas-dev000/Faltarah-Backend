// ==========================================
// companies.repository.js
// ==========================================

/**
 * Fetch all companies with optional filtering
 */
export const findAllCompanies = async (prisma, companyId = null) => {
  const whereClause = companyId ? { id: companyId } : {};

  return prisma.company.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      logo: true,
      address: true,
      email: true,
      phone: true,
      subscriptionExpiryDate: true,
      createdAt: true,
      _count: {
        select: {
          users: true,
          customers: true,
          invoices: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

/**
 * Retrieve company by ID
 */
export const findCompanyById = async (
  prisma,
  id,
  restrictToCompanyId = null
) => {
  const whereClause = {
    id,
    ...(restrictToCompanyId && { id: restrictToCompanyId }),
  };

  return prisma.company.findFirst({
    where: whereClause,
    select: {
      id: true,
      name: true,
      logo: true,
      address: true,
      email: true,
      phone: true,
      subscriptionExpiryDate: true,
      createdAt: true,
      _count: {
        select: {
          users: true,
          customers: true,
          employees: true,
          suppliers: true,
          products: true,
          accessories: true,
          services: true,
          maintenances: true,
          invoices: true,
        },
      },
    },
  });
};

/**
 * Check if company name exists
 */
export const findCompanyByName = async (
  prisma,
  name,
  excludeCompanyId = null
) => {
  const whereClause = {
    name,
    ...(excludeCompanyId && { id: { not: excludeCompanyId } }),
  };

  return prisma.company.findFirst({
    where: whereClause,
    select: {
      id: true,
      name: true,
    },
  });
};

/**
 * Create a new company
 */
export const createCompany = async (prisma, data) => {
  return prisma.company.create({
    data,
    select: {
      id: true,
      name: true,
      logo: true,
      address: true,
      email: true,
      phone: true,
      subscriptionExpiryDate: true,
      createdAt: true,
    },
  });
};

/**
 * Update existing company
 */
export const updateCompany = async (prisma, id, data) => {
  return prisma.company.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      logo: true,
      address: true,
      email: true,
      phone: true,
      subscriptionExpiryDate: true,
      createdAt: true,
    },
  });
};

/**
 * Delete company (simple - without relations check)
 */
export const deleteCompany = async (prisma, id) => {
  return prisma.company.delete({
    where: { id },
  });
};

/**
 * Count total companies
 */
export const countCompanies = async (prisma) => {
  return prisma.company.count();
};

/**
 * Check if company has related records
 */
export const checkCompanyRelations = async (prisma, id) => {
  const company = await prisma.company.findUnique({
    where: { id },
    select: {
      _count: {
        select: {
          users: true,
          customers: true,
          employees: true,
          suppliers: true,
          products: true,
          accessories: true,
          services: true,
          maintenances: true,
          invoices: true,
        },
      },
    },
  });

  if (!company) return null;

  const totalRelations = Object.values(company._count).reduce(
    (sum, count) => sum + count,
    0
  );

  return {
    hasRelations: totalRelations > 0,
    counts: company._count,
    totalRelations,
  };
};

/**
 * ✅ Delete company with all related records using transaction
 * Note: Most relations already have CASCADE in schema, but we handle everything explicitly
 */
export const deleteCompanyWithRelations = async (prisma, id) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Get all invoices for this company
    const invoices = await tx.invoice.findMany({
      where: { companyId: id },
      select: { id: true },
    });

    const invoiceIds = invoices.map((inv) => inv.id);

    if (invoiceIds.length > 0) {
      // 2. Get all installments
      const installments = await tx.installment.findMany({
        where: { invoiceId: { in: invoiceIds } },
        select: { id: true },
      });

      const installmentIds = installments.map((inst) => inst.id);

      // 3. Delete all installment payments
      if (installmentIds.length > 0) {
        await tx.installmentPayment.deleteMany({
          where: { installmentId: { in: installmentIds } },
        });
      }

      // 4. Delete all installments
      await tx.installment.deleteMany({
        where: { invoiceId: { in: invoiceIds } },
      });

      // 5. Delete all invoice items
      await tx.invoiceItem.deleteMany({
        where: { companyId: id },
      });

      // 6. Delete all invoices
      await tx.invoice.deleteMany({
        where: { companyId: id },
      });
    }

    // 7. Delete all maintenances
    await tx.maintenance.deleteMany({
      where: { companyId: id },
    });

    // 8. Delete all customer maintenance statuses
    await tx.customerMaintenanceStatus.deleteMany({
      where: { companyId: id },
    });

    // 9. Delete all product accessories (junction table)
    const products = await tx.product.findMany({
      where: { companyId: id },
      select: { id: true },
    });

    const productIds = products.map((p) => p.id);

    if (productIds.length > 0) {
      await tx.productAccessory.deleteMany({
        where: { productId: { in: productIds } },
      });
    }

    // 10. Delete all products
    await tx.product.deleteMany({
      where: { companyId: id },
    });

    // 11. Delete all accessories
    await tx.accessory.deleteMany({
      where: { companyId: id },
    });

    // 12. Delete all services
    await tx.service.deleteMany({
      where: { companyId: id },
    });

    // 13. Delete all suppliers
    await tx.supplier.deleteMany({
      where: { companyId: id },
    });

    // 14. Delete all employees
    await tx.employee.deleteMany({
      where: { companyId: id },
    });

    // 15. Delete all customers
    await tx.customer.deleteMany({
      where: { companyId: id },
    });

    // 16. Delete all users
    await tx.user.deleteMany({
      where: { companyId: id },
    });

    // 17. Finally delete the company itself
    await tx.company.delete({
      where: { id },
    });

    return { success: true };
  });
};
