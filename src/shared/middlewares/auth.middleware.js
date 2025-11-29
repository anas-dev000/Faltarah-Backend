import { verifyToken } from "../utils/jwt.js";
import { AppError } from "../errors/AppError.js";

export async function authenticate(request, reply) {
  try {
    let token = null;

    if (request.cookies?.token) {
      token = request.cookies.token;
      console.log("✅ Token found in request.cookies");
    } else if (request.headers.cookie) {
      const cookies = request.headers.cookie.split("; ");
      const tokenCookie = cookies.find((c) => c.startsWith("token="));
      if (tokenCookie) {
        token = tokenCookie.split("=")[1];
        console.log("✅ Token found in headers.cookie");
      }
    } else if (request.headers.authorization?.startsWith("Bearer ")) {
      token = request.headers.authorization.substring(7);
      console.log("✅ Token found in Authorization header");
    }

    console.log("🔍 Token extraction result:", {
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 20) + "..." : "none",
      cookies: request.cookies,
      rawCookie: request.headers.cookie,
    });

    // 2) Check existence
    if (!token) {
      console.error("❌ No token found in any location");
      throw new AppError(
        "Unauthorized: No token provided. You are not logged in! Please log in to get access.",
        401
      );
    }

    // 3) Verify token
    let decoded;
    try {
      decoded = await verifyToken(token);
      console.log("✅ Token verified successfully:", decoded.userId);
    } catch (verifyError) {
      console.error("❌ Token verification failed:", verifyError.message);
      throw new AppError("Invalid or expired token", 401);
    }

    // 4) Find user
    const user = await request.server.prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            email: true,
            subscriptionExpiryDate: true,
          },
        },
      },
    });

    if (!user) {
      console.error("❌ User not found for ID:", decoded.userId);
      return reply.status(401).send({
        success: false,
        error: "User not found or deleted",
      });
    }

    if (user.status !== "Active") {
      console.error("❌ User account is inactive:", user.email);
      return reply.status(403).send({
        success: false,
        error: "Your account is inactive. Please contact support.",
      });
    }

    console.log("✅ User authenticated:", {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // 6) Attach to request
    request.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      company: user.company,
    };
  } catch (error) {
    console.error("❌ Authentication error:", error);

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        success: false,
        error: error.message,
      });
    }

    return reply.status(401).send({
      success: false,
      error: "Unauthorized: Invalid token. Please log in to get access.",
    });
  }
}
