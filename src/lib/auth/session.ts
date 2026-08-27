import { getServerSession } from "next-auth";
import { authOptions } from "./config";
import { prisma } from "@/lib/db";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.user) return null;

  const user = await prisma.user.findUnique({
    where: { id: (session.user as { id: string }).id },
    include: {
      accounts: true,
    },
  });

  return user;
}

export async function getGithubToken(): Promise<string | null> {
  const session = await getSession();
  if (!(session as { accessToken?: string })?.accessToken) return null;
  return (session as { accessToken?: string }).accessToken as string;
}

// Type augmentation for next-auth
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
  }
}
