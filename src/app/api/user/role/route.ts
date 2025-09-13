import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import clientPromise from "../../../lib/mongodb";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = (await clientPromise).db();
    const user = await db.collection("users").findOne({ 
      email: session.user?.email 
    });

    if (!user) {
      return NextResponse.json({ role: null });
    }

    return NextResponse.json({ role: user.role });
  } catch (error) {
    console.error("Get role error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
