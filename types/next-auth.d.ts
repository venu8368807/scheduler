import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      email: string
      name: string
      image?: string
    }
    accessToken?: string
    refreshToken?: string
  }

  interface User {
    email: string
    name: string
    image?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    refreshToken?: string
  }
}