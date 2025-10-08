import { DefaultSession, DefaultUser } from "next-auth";

// This will make TypeScript recognize this file as a module augmentation.
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
  }
}
