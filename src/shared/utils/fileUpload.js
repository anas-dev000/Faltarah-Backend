import cloudinary from "../../shared/utils/cloudinary.js";
import { Readable } from "stream";

/**
 * Sanitize folder/file names for Cloudinary
 * Remove special characters and spaces
 */
const sanitizeName = (name) => {
  return name
    .replace(/[^a-zA-Z0-9-_\u0600-\u06FF\s]/g, "")
    .replace(/\s+/g, "_")
    .trim();
};

/**
 * Build dynamic folder path based on entity type
 * @param {String} entityType - Entity type (customer/employee/company)
 * @param {Object} options - Folder options
 * @returns {String} - Folder path
 */
const buildFolderPath = (entityType, options = {}) => {
  const { companyName, customerType, customerName, employeeRole, employeeName } = options;

  const sanitizedCompany = sanitizeName(companyName || "unknown-company");

  switch (entityType) {
    case "customer":
      // customers/CompanyName/CustomerType/CustomerName
      const sanitizedType = sanitizeName(customerType || "unknown-type");
      const sanitizedCustomer = sanitizeName(customerName || "unknown-customer");
      return `customers/${sanitizedCompany}/${sanitizedType}/${sanitizedCustomer}`;

    case "employee":
      // employees/CompanyName/Role/EmployeeName
      const sanitizedRole = sanitizeName(employeeRole || "unknown-role");
      const sanitizedEmployee = sanitizeName(employeeName || "unknown-employee");
      return `employees/${sanitizedCompany}/${sanitizedRole}/${sanitizedEmployee}`;

    case "company":
      // companies/CompanyName
      return `companies/${sanitizedCompany}`;

    default:
      return `misc/${sanitizedCompany}`;
  }
};

/**
 * Upload file to Cloudinary with dynamic folder structure
 * @param {Object} file - Multipart file object from Fastify
 * @param {String} entityType - Entity type (customer/employee/company)
 * @param {Object} folderOptions - Options for building folder path
 * @param {Object} uploadConfig - Optional upload configuration overrides
 * @returns {Promise<Object>} - Object with url and public_id
 */
export const uploadToCloudinary = async (
  file,
  entityType = "misc",
  folderOptions = {},
  uploadConfig = {}
) => {
  if (!file) return null;

  // Build dynamic folder path
  const folder = buildFolderPath(entityType, folderOptions);

  // Default upload configuration
  const defaultConfig = {
    folder: folder,
    resource_type: "image",
    allowed_formats: ["jpg", "png", "jpeg"],
    transformation: [
      {
        width: 800,
        height: 800,
        crop: "limit",
        quality: "auto:good",
        fetch_format: "auto",
      },
    ],
    flags: "lossy",
    format: "jpg",
  };

  // Merge with custom config
  const finalConfig = { ...defaultConfig, ...uploadConfig };

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      finalConfig,
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
            folder: folder,
          });
        }
      }
    );

    file.file.pipe(uploadStream);
  });
};

/**
 * Upload Buffer to Cloudinary with dynamic folder structure
 * @param {Buffer} buffer - File buffer
 * @param {String} entityType - Entity type (customer/employee/company)
 * @param {Object} folderOptions - Options for building folder path
 * @param {Object} uploadConfig - Optional upload configuration overrides
 * @returns {Promise<Object>} - Object with url and public_id
 */
export const uploadBufferToCloudinary = async (
  buffer,
  entityType = "misc",
  folderOptions = {},
  uploadConfig = {}
) => {
  if (!buffer) return null;

  const folder = buildFolderPath(entityType, folderOptions);

  const defaultConfig = {
    folder: folder,
    resource_type: "image",
    allowed_formats: ["jpg", "png", "jpeg"],
    transformation: [
      {
        width: 800,
        height: 800,
        crop: "limit",
        quality: "auto:good",
        fetch_format: "auto",
      },
    ],
    flags: "lossy",
    format: "jpg",
  };

  const finalConfig = { ...defaultConfig, ...uploadConfig };

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      finalConfig,
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
            folder: folder,
          });
        }
      }
    );

    const readable = Readable.from(buffer);
    readable.pipe(uploadStream);
  });
};

/**
 * Delete file from Cloudinary
 * @param {String} publicIdOrUrl - Cloudinary public_id or full URL
 */
export const deleteFromCloudinary = async (publicIdOrUrl) => {
  try {
    if (!publicIdOrUrl) return;

    let publicId = publicIdOrUrl;

    if (publicIdOrUrl.startsWith("http")) {
      const urlParts = publicIdOrUrl.split("/");
      const uploadIndex = urlParts.indexOf("upload");

      if (uploadIndex === -1) return;

      const publicIdWithExtension = urlParts.slice(uploadIndex + 2).join("/");
      publicId = publicIdWithExtension.substring(
        0,
        publicIdWithExtension.lastIndexOf(".")
      );
    }

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === "ok") {
      console.log(`✅ Deleted from Cloudinary: ${publicId}`);
    } else {
      console.log(`⚠️ Could not delete (may not exist): ${publicId}`);
    }

    return result;
  } catch (error) {
    console.error("❌ Error deleting file from Cloudinary:", error);
    throw error;
  }
};

/**
 * Delete folder from Cloudinary (and all its contents)
 * @param {String} folderPath - Folder path to delete
 */
export const deleteCloudinaryFolder = async (folderPath) => {
  try {
    if (!folderPath) return;

    // Delete all resources in the folder first
    const resources = await cloudinary.api.resources({
      type: "upload",
      prefix: folderPath,
      max_results: 500,
    });

    if (resources.resources && resources.resources.length > 0) {
      const publicIds = resources.resources.map((resource) => resource.public_id);

      await cloudinary.api.delete_resources(publicIds);
      console.log(`✅ Deleted ${publicIds.length} resources from folder: ${folderPath}`);
    }

    // Delete the folder itself
    const folderResult = await cloudinary.api.delete_folder(folderPath);

    if (folderResult.deleted && folderResult.deleted[folderPath] === "deleted") {
      console.log(`✅ Folder deleted: ${folderPath}`);
    }

    return folderResult;
  } catch (error) {
    if (error.error && error.error.message === "Can't find folder with path") {
      console.log(`⚠️ Folder not found (may have been already deleted): ${folderPath}`);
      return;
    }

    console.error("❌ Error deleting folder from Cloudinary:", error);
    throw error;
  }
};

/**
 * Delete entity folder based on type
 * @param {String} entityType - Entity type (customer/employee/company)
 * @param {Object} folderOptions - Options for building folder path
 */
export const deleteEntityFolder = async (entityType, folderOptions = {}) => {
  const folderPath = buildFolderPath(entityType, folderOptions);
  return await deleteCloudinaryFolder(folderPath);
};

// Export helper for building folder paths (useful for manual operations)
export { buildFolderPath, sanitizeName };