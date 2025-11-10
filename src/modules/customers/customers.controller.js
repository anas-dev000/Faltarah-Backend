// ==========================================
// customers.controller.js
// ==========================================

// import cloudinary from "../../shared/utils/cloudinary.js";
// import { uploadFile,deleteFile } from "../../shared/utils/fileUpload.js";
import { uploadToCloudinary, deleteFromCloudinary, deleteCloudinaryFolder, uploadBufferToCloudinary } from "../../shared/utils/fileUpload.js";

import * as customerService from "./customers.service.js";

/**
 * Get all customers (with pagination)
 */
export const getAll = async (request, reply) => {
  const currentUser = request.user;
  const page = parseInt(request.query.page) || 1;
  const limit = parseInt(request.query.limit) || 10;

  const result = await customerService.getAllCustomers(
    request.server.prisma,
    currentUser,
    page,
    limit
  );

  return reply.send({
    success: true,
    data: result.data,
    count: result.data.length,
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
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

export const getAllTypes = async (request, reply) => {
  const currentUser = request.user;

  const governorates = await customerService.getAllTypes(
    request.server.prisma,
    currentUser
  );

  return reply.send({
    success: true,
    data: governorates,
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
 * Get all available cities
 */
export const getCities = async (request, reply) => {
  const currentUser = request.user;

  const cities = await customerService.getAllCities(
    request.server.prisma,
    currentUser
  );

  return reply.send({
    success: true,
    data: cities,
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


// cloudinary 2 
// export const create = async (request, reply) => {
//   let uploadedImageUrl = null; // Track uploaded file URL

//   try {
//     const currentUser = request.user;

//     // Check if request is multipart
//     if (!request.isMultipart()) {
//       return reply.status(400).send({
//         success: false,
//         message: "Request must be multipart/form-data",
//       });
//     }

//     // Parse multipart data
//     const parts = request.parts();
//     const data = {};
//     let imageFile = null;

//     for await (const part of parts) {
//       if (part.type === "file") {
//         // Handle file upload - store file for later upload
//         if (part.fieldname === "idCardImage") {
//           // Validate file type
//           const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
//           if (!allowedTypes.includes(part.mimetype)) {
//             return reply.status(400).send({
//               success: false,
//               message: "Only JPEG and PNG images are allowed",
//             });
//           }

//           imageFile = part;
//         }
//       } else {
//         // Handle form fields
//         data[part.fieldname] = part.value;
//       }
//     }
//     console.log(imageFile);

//     // Get company name before uploading image
//     let companyName = "unknown-company";
//     if (data.companyId) {
//       const company = await request.server.prisma.company.findUnique({
//         where: { id: data.companyId },
//         select: { name: true },
//       });
//       if (company) {
//         companyName = company.name;
//       }
//     }
//     console.log(companyName);


//     // Upload image to Cloudinary with proper folder structure
//     if (imageFile) {
//       uploadedImageUrl = await uploadToCloudinary(imageFile, {
//         companyName: companyName,
//         customerType: data.customerType || "unknown",
//         customerName: data.fullName || "unknown",
//       });
//       data.idCardImage = uploadedImageUrl;
//     }

//     // Create customer
//     const customer = await customerService.createNewCustomer(
//       request.server.prisma,
//       data,
//       currentUser
//     );

//     return reply.status(201).send({
//       success: true,
//       message: "Customer created successfully",
//       data: customer,
//     });
//   } catch (error) {
//     // Clean up uploaded file if customer creation fails
//     if (uploadedImageUrl) {
//       await deleteFromCloudinary(uploadedImageUrl);
//     }
//     throw error;
//   }
// };

// local save 
// export const create = async (request, reply) => {
//   let uploadedFilePath = null; // Track uploaded file outside try block

//   try {
//     const currentUser = request.user;

//     // Check if request is multipart
//     if (!request.isMultipart()) {
//       return reply.status(400).send({
//         success: false,
//         message: "Request must be multipart/form-data",
//       });
//     }

//     // Parse multipart data
//     const parts = request.parts();
//     const data = {};

//     for await (const part of parts) {
//       if (part.type === "file") {
//         // Handle file upload
//         if (part.fieldname === "idCardImage") {
//           // Validate file type
//           const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
//           if (!allowedTypes.includes(part.mimetype)) {
//             return reply.status(400).send({
//               success: false,
//               message: "Only JPEG and PNG images are allowed",
//             });
//           }

//           uploadedFilePath = await uploadFile(part);
//           data.idCardImage = uploadedFilePath;
//         }
//       } else {
//         // Handle form fields
//         data[part.fieldname] = part.value;
//       }
//     }

//     // Create customer
//     const customer = await customerService.createNewCustomer(
//       request.server.prisma,
//       data,
//       currentUser
//     );

//     return reply.status(201).send({
//       success: true,
//       message: "Customer created successfully",
//       data: customer,
//     });
//   } catch (error) {
//     // Clean up uploaded file if customer creation fails
//     if (uploadedFilePath) {
//       await deleteFile(uploadedFilePath);
//     }
//     throw error;
//   }
// };

/**
 * Update an existing customer
 */
// export const update = async (request, reply) => {
//   const { id } = request.params;
//   const currentUser = request.user;

//   const customer = await customerService.updateExistingCustomer(
//     request.server.prisma,
//     Number(id),
//     request.body,
//     currentUser
//   );

//   return reply.send({
//     success: true,
//     message: "Customer updated successfully",
//     data: customer,
//   });
// };

/**
 * Create a new customer
 */
// cloudinary 1

/**
 * Create a new customer with optional ID card image upload
 */
/**
 * Get company name helper
 */
const getCompanyName = async (prisma, companyId) => {
  if (!companyId) return "";

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { name: true },
  });

  return company?.name || "";
};
export const create = async (request, reply) => {
  let uploadedImage = null; // Track uploaded image (url + public_id)

  try {
    const currentUser = request.user;

    if (!request.isMultipart()) {
      return reply.status(400).send({
        success: false,
        message: "Request must be multipart/form-data",
      });
    }

    const parts = request.parts();
    const data = {};
    const fileBuffers = [];

    // ✅ Step 1: Collect ALL parts first (fields + file buffer)
    for await (const part of parts) {
      if (part.type === "file" && part.fieldname === "idCardImage") {
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
        if (!allowedTypes.includes(part.mimetype)) {
          return reply.status(400).send({
            success: false,
            message: "Only JPEG and PNG images are allowed",
          });
        }

        // Read file into buffer
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

    // ✅ Step 2: Now upload with complete data
    if (fileBuffers.length > 0) {
      const companyName = await getCompanyName(
        request.server.prisma,
        currentUser.companyId
      );

      console.log("📦 Upload data:", {
        companyName,
        type: data.customerType,
        fullName: data.fullName,
      });

      uploadedImage = await uploadBufferToCloudinary(
        fileBuffers[0].buffer,
        "customer",
        {
          companyName: companyName || "unknown-company",
          customerType: data.customerType || "unknown-type",
          customerName: data.fullName || "unknown-customer",
        }
      );

      data.idCardImage = uploadedImage.url;
      data.idCardImagePublicId = uploadedImage.public_id;
    }

    const customer = await customerService.createNewCustomer(
      request.server.prisma,
      data,
      currentUser
    );

    return reply.status(201).send({
      success: true,
      message: "Customer created successfully",
      data: customer,
    });
  }
  catch (error) {
    // ✅ Clean up: Delete uploaded image if customer creation fails
    if (uploadedImage?.public_id) {
      await deleteFromCloudinary(uploadedImage.public_id);
    }

    // Log error for debugging
    console.error("❌ Error creating customer:", error);

    throw error;
  }
};



/**
 * Update an existing customer with optional ID card image upload
 */
/**
 * Update an existing customer with optional ID card image upload
 */
export const update = async (request, reply) => {
  let uploadedImage = null; // { url, public_id }
  let oldImagePublicId = null;

  try {
    const { id } = request.params;
    const currentUser = request.user;

    // ✅ تحقق من وجود العميل
    const existingCustomer = await request.server.prisma.customer.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        companyId: true,
        idCardImage: true,
        idCardImagePublicId: true,
        fullName: true,
        customerType: true,
      },
    });

    if (!existingCustomer) {
      return reply.status(404).send({
        success: false,
        message: "Customer not found",
      });
    }

    if (existingCustomer.companyId !== currentUser.companyId) {
      return reply.status(403).send({
        success: false,
        message: "Access denied",
      });
    }

    oldImagePublicId = existingCustomer.idCardImagePublicId;
    let data = {};

    // ✅ لو الريكوست فيها صورة multipart/form-data
    if (request.isMultipart()) {
      const parts = request.parts();
      const fileBuffers = [];

      for await (const part of parts) {
        if (part.type === "file" && part.fieldname === "idCardImage") {
          const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
          if (!allowedTypes.includes(part.mimetype)) {
            return reply.status(400).send({
              success: false,
              message: "Only JPEG and PNG images are allowed",
            });
          }

          // ✅ اقرأ الملف إلى buffer
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

      // ✅ ارفع الصورة لو موجودة
      if (fileBuffers.length > 0) {
        const companyName = await getCompanyName(
          request.server.prisma,
          currentUser.companyId
        );

        uploadedImage = await uploadBufferToCloudinary(
          fileBuffers[0].buffer,
          "customer",
          {
            companyName: companyName || "unknown-company",
            customerType:
              data.customerType ||
              existingCustomer.customerType ||
              "unknown-type",
            customerName:
              data.fullName || existingCustomer.fullName || "unknown-customer",
          }
        );

        data.idCardImage = uploadedImage.url;
        data.idCardImagePublicId = uploadedImage.public_id;
      }
    } else {
      // ✅ تعديل عادي بدون صورة
      data = request.body;
    }

    // ✅ تحديث العميل
    const updatedCustomer = await customerService.updateExistingCustomer(
      request.server.prisma,
      Number(id),
      data,
      currentUser
    );

    // ✅ حذف الصورة القديمة فقط لو في جديدة
    if (uploadedImage && oldImagePublicId) {
      await deleteFromCloudinary(oldImagePublicId);
    }

    return reply.send({
      success: true,
      message: "Customer updated successfully",
      data: updatedCustomer,
    });
  } catch (error) {
    // ✅ في حالة فشل، نحذف الصورة الجديدة لو تم رفعها
    if (uploadedImage?.public_id) {
      await deleteFromCloudinary(uploadedImage.public_id);
    }

    console.error("❌ Error updating customer:", error);
    throw error;
  }
};


/**
 * Delete customer by ID with image cleanup
 */
export const deleteById = async (request, reply) => {
  try {
    const { id } = request.params;
    const currentUser = request.user;

    // ✅ Get customer data before deletion (to get image info)
    const customer = await request.server.prisma.customer.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        companyId: true,
        idCardImagePublicId: true,
        fullName: true,
        customerType: true,
      },
    });

    if (!customer) {
      return reply.status(404).send({
        success: false,
        message: "Customer not found",
      });
    }

    // ✅ Delete employee from database
    await customerService.deleteExistingCustomer(
      request.server.prisma,
      Number(id),
      currentUser
    );


    // ✅ Delete individual image from Cloudinary (if exists)
    if (customer.idCardImagePublicId) {
      try {
        await deleteFromCloudinary(customer.idCardImagePublicId);
      } catch (error) {
        console.error("⚠️ Failed to delete image:", error.message);
      }
    }

    // ✅ Delete entire employee folder using dynamic path
    try {
      const companyName = await getCompanyName(
        request.server.prisma,
        currentUser.companyId
      );

      if (companyName) {
        await deleteEntityFolder("customer", {
          companyName: companyName,
          customerType: customer.customerType,
          customerName: customer.fullName,
        });
      }
    } catch (error) {
      console.error("⚠️ Failed to delete folder:", error.message);
    }

    return reply.send({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting customer:", error);

    // Check if it's a database error vs Cloudinary error
    if (error.code === 'P2025') {
      return reply.status(404).send({
        success: false,
        message: "Customer not found",
      });
    }

    return reply.status(500).send({
      success: false,
      message: "Failed to delete customer",
      error: error.message,
    });
  }
};