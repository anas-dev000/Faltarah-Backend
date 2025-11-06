// ==========================================
// customers.controller.js
// ==========================================
import cloudinary from "../../shared/utils/Cloudinary.js";
import * as customerService from "./customers.service.js";
// import fs from 'fs'
// import path from "path";
// import { promisify } from "util";
// import { pipeline } from "stream";
/**
 * Get all customers
 */
export const getAll = async (request, reply) => {
  const currentUser = request.user;

  const customers = await customerService.getAllCustomers(
    request.server.prisma,
    currentUser
  );

  return reply.send({
    success: true,
    data: customers,
    count: customers.length,
  });
};

/**
 * Get customer by ID
 */
export const getById = async (request, reply) => {
  const { id } = request.params;
  const currentUser = request.user;

  const customer = await customerService.getCustomerById(
    request.server.prisma,
    Number(id),
    currentUser
  );

  return reply.send({
    success: true,
    data: customer,
  });
};

/**
 * Get customers by type (Installation or Maintenance)
 */
export const getByType = async (request, reply) => {
  const { customerType } = request.params;
  const currentUser = request.user;

  const customers = await customerService.getCustomersByType(
    request.server.prisma,
    customerType,
    currentUser
  );

  return reply.send({
    success: true,
    data: customers,
    count: customers.length,
  });
};

/**
 * Get all available governorates
 */
export const getGovernorates = async (request, reply) => {
  const currentUser = request.user;

  const governorates = await customerService.getAllGovernorates(
    request.server.prisma,
    currentUser
  );

  return reply.send({
    success: true,
    data: governorates,
  });
};

/**
 * Get all cities in a governorate
 */
export const getCitiesByGovernorate = async (request, reply) => {
  const { governorate } = request.params;
  const currentUser = request.user;

  const cities = await customerService.getCitiesByGovernorate(
    request.server.prisma,
    governorate,
    currentUser
  );

  return reply.send({
    success: true,
    data: cities,
  });
};

/**
 * Get total customer count
 */
export const getCount = async (request, reply) => {
  const currentUser = request.user;

  const count = await customerService.countCustomers(
    request.server.prisma,
    currentUser
  );

  return reply.send({
    success: true,
    data: { totalCustomers: count },
  });
};

/**
 * Create a new customer
 */
// export const create = async (request, reply) => {
//   const currentUser = request.user;

//   const customer = await customerService.createNewCustomer(
//     request.server.prisma,
//     request.body,
//     currentUser
//   );

//   return reply.status(201).send({
//     success: true,
//     message: "Customer created successfully",
//     data: customer,
//   });
// };

export const create = async (request, reply) => {
  try {
    const currentUser = request.user;
    const parts = request.parts();
    console.log(parts);
    
    const body = {};
    let imageUrl = null;

    // ✅ نقرأ الـ form-data اللي فيها بيانات وصورة
    for await (const part of parts) {
      if (part.file) {
        // تحقق من نوع الملف قبل الرفع (اختياري)
        const allowed = ["image/jpeg", "image/png", "image/jpg"];
        if (!allowed.includes(part.mimetype)) {
          return reply.status(400).send({
            success: false,
            message: "Only JPG and PNG images are allowed",
          });
        }

        // ✅ نرفع الصورة إلى Cloudinary
        const uploadResult = await cloudinary.uploader.upload(part.filepath || part, {
          folder: "customers",
        });
        imageUrl = uploadResult.secure_url;
        console.log(imageUrl);
        
      } else {
        body[part.fieldname] = part.value;
      }
    }

    // ✅ نحط رابط الصورة في body
    if (imageUrl) {
      body.idCardImage = imageUrl;
    }

    // ✅ نمررها للدالة اللي بتتعامل مع Prisma
    const customer = await customerService.createNewCustomer(request.server.prisma, body, currentUser);

    return reply.status(201).send({
      success: true,
      message: "Customer created successfully",
      data: customer,
    });
  } catch (error) {
    console.error("❌ Error creating customer:", error);
    return reply.status(error.statusCode || 500).send({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

/**
 * Update an existing customer
 */
export const update = async (request, reply) => {
  const { id } = request.params;
  const currentUser = request.user;

  const customer = await customerService.updateExistingCustomer(
    request.server.prisma,
    Number(id),
    request.body,
    currentUser
  );

  return reply.send({
    success: true,
    message: "Customer updated successfully",
    data: customer,
  });
};

/**
 * Delete a customer
 */
export const deleteById = async (request, reply) => {
  const { id } = request.params;
  const currentUser = request.user;

  await customerService.deleteExistingCustomer(
    request.server.prisma,
    Number(id),
    currentUser
  );

  return reply.send({
    success: true,
    message: "Customer deleted successfully",
  });
};
