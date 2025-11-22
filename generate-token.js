/**
 * Token Generator - Creates valid JWT tokens for testing
 */

import jwt from "jsonwebtoken";

const JWT_SECRET = "your-super-secret-key-change-in-production";

const payload = {
  userId: 1,
  companyId: 1,
  email: "origin.emi@gmail.com",
  role: "Admin",
};

const token = jwt.sign(payload, JWT_SECRET, {
  expiresIn: "7d",
});

console.log("Generated Valid Token:");
console.log(token);
console.log("\nToken Payload:");
console.log(JSON.stringify(payload, null, 2));
console.log("\nUse this token in your tests.");
