import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { BCRYPT_ROUNDS } from "@/lib/auth";
import { assertSameOrigin, errorResponse, getClientIp, HttpError, json, readJson } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validation";

export const runtime = "nodejs";

const EXISTS_MESSAGE = "An account with this email already exists. Please log in instead.";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(`register:${getClientIp(request.headers)}`, 10, 60 * 60 * 1000, "Too many sign-up attempts. Please try again later.");

    const parsed = registerSchema.safeParse(await readJson(request, 4 * 1024));
    if (!parsed.success) throw new HttpError(400, parsed.error.issues[0]?.message ?? "Invalid input");
    const { email, password } = parsed.data;

    const existing = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true },
    });
    if (existing) throw new HttpError(409, EXISTS_MESSAGE);

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await prisma.user.create({
      data: { email, hashedPassword },
      select: { id: true },
    });

    return json({ message: "Account created", userId: user.id }, 201);
  } catch (err) {
    // Two sign-ups with the same email at once
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return errorResponse(new HttpError(409, EXISTS_MESSAGE), "API_REGISTER");
    }
    return errorResponse(err, "API_REGISTER");
  }
}
