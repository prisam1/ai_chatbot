import { AuthOptions, getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import prisma from "./prisma";
import { loginSchema } from "./validation";
import { getClientIp, HttpError } from "./http";
import { rateLimit, resetRateLimit } from "./rate-limit";

export const BCRYPT_ROUNDS = 12;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

// Compared against when the user doesn't exist, so response time doesn't reveal valid emails
let dummyHash: Promise<string> | undefined;
const getDummyHash = () => (dummyHash ??= bcrypt.hash("dummy-password-for-timing", BCRYPT_ROUNDS));

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const ip = getClientIp(req?.headers);
        const emailKey = `login:email:${email}`;
        const ipOk = rateLimit(`login:ip:${ip}`, 30, LOGIN_WINDOW_MS).ok;
        const emailOk = rateLimit(emailKey, 10, LOGIN_WINDOW_MS).ok;
        if (!ipOk || !emailOk) throw new Error("TooManyAttempts");

        const user = await prisma.user.findFirst({
          where: { email: { equals: email, mode: "insensitive" } },
          select: { id: true, email: true, name: true, image: true, hashedPassword: true },
        });

        const valid = await bcrypt.compare(password, user?.hashedPassword ?? (await getDummyHash()));
        if (!user?.hashedPassword || !valid) return null;

        resetRateLimit(emailKey);
        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24, // 24 hours
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token.id && session.user) session.user.id = token.id;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export async function requireUserId() {
  const session = await getServerSession(authOptions);
  const id = session?.user?.id;
  if (!id) throw new HttpError(401, "Your session has expired. Please log in again.");
  return id;
}
