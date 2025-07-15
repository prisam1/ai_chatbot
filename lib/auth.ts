import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter"; 
import prisma from "./prisma";
import bcrypt from "bcryptjs";
import { AdapterUser } from "next-auth/adapters";  
import { Session, User } from "next-auth";  
import { JWT } from "next-auth/jwt";  
 
export const authOptions: AuthOptions = {  
    adapter: PrismaAdapter(prisma),
    providers: [
      GoogleProvider({
        clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET as string,
      }),
      CredentialsProvider({
        name: "Credentials",
        credentials: {
          email: { label: "Email", type: "text" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }
  
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
          });
  
          if (!user || !user.hashedPassword) {
            return null;
          }
  
          const isCorrectPassword = await bcrypt.compare(
            credentials.password,
            user.hashedPassword
          );
  
          if (!isCorrectPassword) {
            return null;
          }
  
          return user;
        },
      }),
    ],
    session: {
      strategy: "jwt",  
    },
    pages: {
      signIn: "/auth/login",  
    },
    callbacks: {
            async jwt({ token, user }: { token: JWT; user?: User | AdapterUser }) { 
              if (user) {
                token.id = user.id;
              }
              return token;
            },
            async session({ session, token }: { session: Session; token: JWT }) {  
              if (token.id) {
                session.user.id = token.id as string;
              }
              return session;
            },
          },
    secret: process.env.NEXT_PUBLIC_NEXTAUTH_SECRET,
  };