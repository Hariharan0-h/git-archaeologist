import type { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          // Read-only: repo metadata, commits, PRs, issues
          scope: "read:user user:email repo",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Persist the GitHub access token in the JWT so we can use it in API calls
      if (account?.access_token) {
        token.githubAccessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      // Expose the token to the server-side session
      (session as any).githubAccessToken = token.githubAccessToken;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
