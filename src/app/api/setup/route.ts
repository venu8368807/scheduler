import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import clientPromise from "../../lib/mongodb";
import { encrypt } from "../../lib/crypto";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role } = await request.json();
    if (!role || !['Seller', 'Buyer'].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const db = (await clientPromise).db();
    const users = db.collection("users");

    // Find adapter user (_id) then read refresh_token from accounts
    const adapterUser = await users.findOne({ email: session.user?.email });

    let refreshTokenPlain: string | null = null;
    if (adapterUser?._id) {
      const accounts = db.collection("accounts");
      const accountDoc = await accounts.findOne({ userId: adapterUser._id, provider: 'google' });
      if (accountDoc?.refresh_token) {
        refreshTokenPlain = accountDoc.refresh_token as string;
      }
    }
    // Fallback to session (first sign-in may include it)
    if (!refreshTokenPlain) {
      refreshTokenPlain = (session as any).refreshToken || null;
    }
    const encrypted = refreshTokenPlain ? encrypt(refreshTokenPlain) : null;

    await users.updateOne(
      { email: session.user?.email },
      {
        $set: {
          email: session.user?.email,
          name: session.user?.name,
          role,
          refreshToken: encrypted,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
