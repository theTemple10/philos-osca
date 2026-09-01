import { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "read:user user:email repo read:org",
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string }).id = token.sub ?? "";
        (session as { accessToken?: string }).accessToken = token.accessToken as string | undefined;
      }
      return session;
    },
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async signIn({ user, account }) {
      if (account?.provider === "github" && account.access_token && user.id) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              accessToken: account.access_token,
              githubId: account.providerAccountId,
            },
          });
        } catch {
          // User may not exist yet during first sign-in; the Prisma adapter
          // will create it. Store the token via the JWT callback instead.
        }
      }
      return true;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
};
