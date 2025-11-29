// ==========================================
// employees.controller.js
// ==========================================

import {
  uploadToCloudinary,
  deleteFromCloudinary,
  deleteCloudinaryFolder,
  deleteEntityFolder,
  uploadBufferToCloudinary,
} from "../../shared/utils/fileUpload.js";
import * as employeeService from "./employees.service.js";

/**
 * Get all employees (with pagination)
 */
export const getAll = async (request, reply) => {
  const currentUser = request.user;
  const page = parseInt(request.query.page) || 1;
  const limit = parseInt(request.query.limit) || 10;

  const result = await employeeService.getAllEmployees(
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
 * Get employee by ID
 */
export const getById = async (request, reply) => {
  const { id } = request.params;
  const currentUser = request.user;

  const employee = await employeeService.getEmployeeById(
    request.server.prisma,
    Number(id),
    currentUser
  );

  return reply.send({
    success: true,
    data: employee,
  });
};
export const getByRole = async (request, reply) => {
  const { employeeRole } = request.params;
  const currentUser = request.user;

  const employees = await employeeService.getEmployeesByRole(
    request.server.prisma,
    employeeRole,
    currentUser
  );

  return reply.send({
    success: true,
    data: employees,
    count: employees.length,
  });
};
/**
 * Get all roles
 */
export const getAllRoles = async (request, reply) => {
  const currentUser = request.user;

  const roles = await employeeService.getAllRoles(
    request.server.prisma,
    currentUser
  );

  return reply.send({
    success: true,
    data: roles,
  });
};
/**
 * Get all status
 */
export const getAllStatus = async (request, reply) => {
  const currentUser = request.user;

  const status = await employeeService.getAllStatus(
    request.server.prisma,
    currentUser
  );

  return reply.send({
    success: true,
    data: status,
  });
};
export const getByStatus = async (request, reply) => {
  const { statusEmployee } = request.params;
  const currentUser = request.user;

  const employees = await employeeService.getEmployeesByStatus(
    request.server.prisma,
    statusEmployee,
    currentUser
  );

  return reply.send({
    success: true,
    data: employees,
    count: employees.length,
  });
};

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
/**
 * Create new employee with optional ID card image
 */
export const create = async (request, reply) => {
  let uploadedImage = null;

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

    //  Step 1: Collect ALL parts first (fields + file buffer)
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

    //  Convert isEmployed to Boolean
    if (data.isEmployed !== undefined) {
      data.isEmployed = data.isEmployed === "true" || data.isEmployed === true;
    }

    //  Step 2: Now upload with complete data
    if (fileBuffers.length > 0) {
      const companyName = await getCompanyName(
        request.server.prisma,
        currentUser.companyId
      );

      console.log("📦 Upload data:", {
        companyName,
        role: data.role,
        fullName: data.fullName,
      });

      uploadedImage = await uploadBufferToCloudinary(
        fileBuffers[0].buffer,
        "employee",
        {
          companyName: companyName || "unknown-company",
          employeeRole: data.role || "unknown-role",
          employeeName: data.fullName || "unknown-employee",
        }
      );

      data.idCardImage = uploadedImage.url;
      data.idCardImagePublicId = uploadedImage.public_id;
    }

    const employee = await employeeService.createNewEmployee(
      request.server.prisma,
      data,
      currentUser
    );

    return reply.status(201).send({
      success: true,
      message: "Employee created successfully",
      data: employee,
    });
  } catch (error) {
    //  Rollback: delete uploaded image if employee creation fails
    if (uploadedImage?.public_id) {
      await deleteFromCloudinary(uploadedImage.public_id);
    }

    console.error("❌ Error creating employee:", error);
    throw error;
  }
};

/**
 * Update employee with optional ID card image
 */
/**
 * Update employee with optional ID card image
 */
export const update = async (request, reply) => {
  let uploadedImage = null;
  let oldImagePublicId = null;

  try {
    const { id } = request.params;
    const currentUser = request.user;

    const existingEmployee = await request.server.prisma.employee.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        companyId: true,
        idCardImage: true,
        idCardImagePublicId: true,
        fullName: true,
        role: true,
      },
    });

    if (!existingEmployee) {
      return reply.status(404).send({
        success: false,
        message: "Employee not found",
      });
    }

    if (existingEmployee.companyId !== currentUser.companyId) {
      return reply.status(403).send({
        success: false,
        message: "Access denied",
      });
    }

    oldImagePublicId = existingEmployee.idCardImagePublicId;
    let data = {};

    if (request.isMultipart()) {
      const parts = request.parts();
      const fileBuffers = [];

      //  Step 1: Collect ALL parts first (fields + file buffer)
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

      //  NEW: Convert string booleans back to actual booleans
      if (data.isEmployed !== undefined) {
        data.isEmployed =
          data.isEmployed === "true" || data.isEmployed === true;
      }

      //  Step 2: Now upload with complete data
      if (fileBuffers.length > 0) {
        const companyName = await getCompanyName(
          request.server.prisma,
          currentUser.companyId
        );

        console.log("📦 Update data:", {
          companyName,
          role: data.role || existingEmployee.role,
          fullName: data.fullName || existingEmployee.fullName,
        });

        uploadedImage = await uploadBufferToCloudinary(
          fileBuffers[0].buffer,
          "employee",
          {
            companyName: companyName || "unknown-company",
            employeeRole: data.role || existingEmployee.role || "unknown-role",
            employeeName:
              data.fullName || existingEmployee.fullName || "unknown-employee",
          }
        );

        data.idCardImage = uploadedImage.url;
        data.idCardImagePublicId = uploadedImage.public_id;
      }
    } else {
      data = request.body;

      //  NEW: Also handle for non-multipart requests
      if (
        data.isEmployed !== undefined &&
        typeof data.isEmployed === "string"
      ) {
        data.isEmployed = data.isEmployed === "true";
      }
    }

    const updatedEmployee = await employeeService.updateExistingEmployee(
      request.server.prisma,
      Number(id),
      data,
      currentUser
    );

    //  Delete old image ONLY if new image was uploaded successfully
    if (uploadedImage && oldImagePublicId) {
      await deleteFromCloudinary(oldImagePublicId);
    }

    return reply.send({
      success: true,
      message: "Employee updated successfully",
      data: updatedEmployee,
    });
  } catch (error) {
    //  Rollback: delete newly uploaded image if update fails
    if (uploadedImage?.public_id) {
      await deleteFromCloudinary(uploadedImage.public_id);
    }

    console.error("❌ Error updating employee:", error);
    throw error;
  }
};

/**
 * Delete employee by ID with complete cleanup
 */
export const deleteById = async (request, reply) => {
  try {
    const { id } = request.params;
    const currentUser = request.user;

    const employee = await request.server.prisma.employee.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        companyId: true,
        idCardImagePublicId: true,
        fullName: true,
        role: true,
      },
    });

    if (!employee) {
      return reply.status(404).send({
        success: false,
        message: "Employee not found",
      });
    }

    //  Delete employee from database
    await employeeService.deleteExistingEmployee(
      request.server.prisma,
      Number(id),
      currentUser
    );

    //  Delete individual image from Cloudinary (if exists)
    if (employee.idCardImagePublicId) {
      try {
        await deleteFromCloudinary(employee.idCardImagePublicId);
      } catch (error) {
        console.error("⚠️ Failed to delete image:", error.message);
      }
    }

    //  Delete entire employee folder using dynamic path
    try {
      const companyName = await getCompanyName(
        request.server.prisma,
        currentUser.companyId
      );

      if (companyName) {
        await deleteEntityFolder("employee", {
          companyName: companyName,
          employeeRole: employee.role,
          employeeName: employee.fullName,
        });
      }
    } catch (error) {
      console.error("⚠️ Failed to delete folder:", error.message);
    }

    return reply.send({
      success: true,
      message: "Employee deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting employee:", error);

    if (error.code === "P2025") {
      return reply.status(404).send({
        success: false,
        message: "Employee not found",
      });
    }

    return reply.status(500).send({
      success: false,
      message: "Failed to delete employee",
      error: error.message,
    });
  }
};
