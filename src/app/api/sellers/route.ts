import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import clientPromise from "../../lib/mongodb";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions as import("next-auth").AuthOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = (await clientPromise).db();
    const sellers = await db.collection("users").find({ 
      role: "Seller",
      refreshToken: { $exists: true, $ne: null }
    }).toArray();

    return NextResponse.json({ sellers });
  } catch (error) {
    console.error("Get sellers error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
