import { verifyToken } from "../utils/jwt.js";
import { AppError } from "../errors/AppError.js";

export async function authenticate(request, reply) {
  try {
    let token = null;

    if (request.cookies?.token) {
      token = request.cookies.token;
    } else if (request.headers.cookie) {
      token = request.headers.cookie
        .split("; ")
        .find((c) => c.startsWith("token="))
        ?.split("=")[1];
    } else if (request.headers.authorization?.startsWith("Bearer ")) {
      token = request.headers.authorization.substring(7);
    }

    console.log("token =================================>>>>>>>>>>>>", token);

    // 2) Check existence
    if (!token) {
      throw new AppError(
        "Unauthorized: No token provided. You are not logged in! Please log in to get access.",
        401
      );
    }

    // 3) Verify token
    const decoded = await verifyToken(token);

    const user = await request.server.prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!user) {
      return reply.status(401).send({
        success: false,
        error: "User not found",
      });
    }

    request.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      company: user.company,
    };
  } catch (error) {
    return reply.status(401).send({
      success: false,
      error: "Unauthorized: Invalid token. Please log in to get access.",
    });
  }
}
