// ==========================================
// companies.controller.js
// ==========================================

import * as companyService from "./companies.service.js";
import { uploadBufferToCloudinary, deleteFromCloudinary } from "../../shared/utils/fileUpload.js";

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
  let uploadedImage = null;
  let oldImagePublicId = null;

  try {
    const { id } = request.params;
    const currentUser = request.user;

    // ✅ Check if company exists
    const existingCompany = await request.server.prisma.company.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        name: true,
        logo: true,
        logoPublicId: true,
        address: true,
        email: true,
        phone: true,
        subscriptionExpiryDate: true,
      },
    });

    if (!existingCompany) {
      return reply.status(404).send({
        success: false,
        message: "Company not found",
      });
    }

    // ✅ Authorization check
    const { role, companyId } = currentUser;
    
    if (role === "manager" && Number(id) !== companyId) {
      return reply.status(403).send({
        success: false,
        message: "Forbidden: You can only update your own company",
      });
    }
    
    if (role === "employee") {
      return reply.status(403).send({
        success: false,
        message: "Forbidden: Employees cannot update companies",
      });
    }

    oldImagePublicId = existingCompany.logoPublicId;
    let data = {};

    // ✅ Handle multipart/form-data request (with image)
    if (request.isMultipart()) {
      const parts = request.parts();
      const fileBuffers = [];

      for await (const part of parts) {
        if (part.type === "file" && part.fieldname === "logo") {
          const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
          if (!allowedTypes.includes(part.mimetype)) {
            return reply.status(400).send({
              success: false,
              message: "Only JPEG and PNG images are allowed",
            });
          }

          // ✅ Read file into buffer
          const chunks = [];
          for await (const chunk of part.file) {
            chunks.push(chunk);
          }
          const buffer = Buffer.concat(chunks);

          fileBuffers.push({
            buffer,
            mimetype: part.mimetype,
            filename: part.filename,
          });
        } else if (part.type !== "file") {
          data[part.fieldname] = part.value;
        }
      }

      // ✅ Upload image if exists
      if (fileBuffers.length > 0) {
        // Use existing name or new name for folder structure
        const companyName = data.name || existingCompany.name || "unknown-company";

        uploadedImage = await uploadBufferToCloudinary(
          fileBuffers[0].buffer,
          "company",
          {
            companyName: companyName,
          }
        );

        data.logo = uploadedImage.url;
        data.logoPublicId = uploadedImage.public_id;
      }
    } else {
      // ✅ Regular update without image
      data = request.body || {};
    }

    // ✅ Manager cannot update subscription expiry date
    if (currentUser.role === "manager" && data.subscriptionExpiryDate) {
      return reply.status(403).send({
        success: false,
        message: "Forbidden: Only developers can update subscription expiry date",
      });
    }

    // ✅ Update company
    const updatedCompany = await companyService.updateExistingCompany(
      request.server.prisma,
      Number(id),
      data,
      currentUser
    );

    // ✅ Delete old image only if new one was uploaded
    if (uploadedImage && oldImagePublicId) {
      await deleteFromCloudinary(oldImagePublicId);
    }

    return reply.send({
      success: true,
      message: "Company updated successfully",
      data: updatedCompany,
    });
  } catch (error) {
    // ✅ Rollback: delete uploaded image if update failed
    if (uploadedImage?.public_id) {
      await deleteFromCloudinary(uploadedImage.public_id);
    }

    console.error("❌ Error updating company:", error);
    
    // Handle specific errors
    if (error.message?.includes("already exists")) {
      return reply.status(409).send({
        success: false,
        message: error.message,
      });
    }
    
    if (error.message?.includes("Forbidden")) {
      return reply.status(403).send({
        success: false,
        message: error.message,
      });
    }

    if (error.message?.includes("not found")) {
      return reply.status(404).send({
        success: false,
        message: error.message,
      });
    }

    return reply.status(500).send({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
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
