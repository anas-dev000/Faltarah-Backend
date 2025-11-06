// ==========================================
// companies.controller.js
// ==========================================

import * as companyService from "./companies.service.js";

/**
 * Get all companies
 */
export const getAll = async (request, reply) => {
  const currentUser = request.user;

  const companies = await companyService.getAllCompanies(
    request.server.prisma,
    currentUser
  );

  return reply.send({
    success: true,
    data: companies,
    count: companies.length,
  });
};

/**
 * Get company by ID
 */
export const getById = async (request, reply) => {
  const { id } = request.params;
  const currentUser = request.user;

  const company = await companyService.getCompanyById(
    request.server.prisma,
    Number(id),
    currentUser
  );

  return reply.send({
    success: true,
    data: company,
  });
};

/**
 * Create a new company
 */
export const create = async (request, reply) => {
  const currentUser = request.user;

  const company = await companyService.createNewCompany(
    request.server.prisma,
    request.body,
    currentUser
  );

  return reply.status(201).send({
    success: true,
    message: "Company created successfully",
    data: company,
  });
};

/**
 * Update existing company
 */
export const update = async (request, reply) => {
  const { id } = request.params;
  const currentUser = request.user;

  const company = await companyService.updateExistingCompany(
    request.server.prisma,
    Number(id),
    request.body,
    currentUser
  );

  return reply.send({
    success: true,
    message: "Company updated successfully",
    data: company,
  });
};

/**
 * Update company subscription expiry date
 */
export const updateSubscription = async (request, reply) => {
  const { id } = request.params;
  const currentUser = request.user;
  const { subscriptionExpiryDate } = request.body;

  const company = await companyService.updateCompanySubscription(
    request.server.prisma,
    Number(id),
    subscriptionExpiryDate,
    currentUser
  );

  return reply.send({
    success: true,
    message: "Subscription expiry date updated successfully",
    data: company,
  });
};

/**
 * Delete company
 */
export const deleteById = async (request, reply) => {
  const { id } = request.params;
  const currentUser = request.user;

  await companyService.deleteExistingCompany(
    request.server.prisma,
    Number(id),
    currentUser
  );

  return reply.send({
    success: true,
    message: "Company deleted successfully",
  });
};
