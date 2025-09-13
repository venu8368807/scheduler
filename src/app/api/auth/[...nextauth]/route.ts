import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import clientPromise from "../../../lib/mongodb";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          // request calendar scopes
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events",
          access_type: "offline",
          prompt: "consent",
          include_granted_scopes: "true",
        },
      },
    }),
  ],
  adapter: MongoDBAdapter(clientPromise),
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account }: { token: import("next-auth/jwt").JWT; account?: import("next-auth").Account | null }) {
      // On first sign in, account will exist
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token; // store to pass to session (short-lived)
      }
      return token;
    },
    async session({ session, token }: { session: import("next-auth").Session; token: import("next-auth/jwt").JWT }) {
      // Define a custom session type to avoid 'any'
      type CustomSession = import("next-auth").Session & {
        accessToken?: string | null;
        refreshToken?: string | null;
      };
      (session as CustomSession).accessToken = typeof token?.accessToken === "string" ? token.accessToken : null;
      (session as CustomSession).refreshToken = typeof token?.refreshToken === "string" ? token.refreshToken : null;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
