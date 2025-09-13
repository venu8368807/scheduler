import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import clientPromise from "@/lib/mongodb"; // use @ for root alias
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    // 1️⃣ Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2️⃣ Connect to MongoDB
    const client = await clientPromise;
    const db = client.db(); // default DB from MONGODB_URI

    // 3️⃣ Find logged-in user
    const user = await db.collection("users").findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 4️⃣ Fetch appointments based on role
    const query =
      user.role === "Seller"
        ? { sellerEmail: session.user.email }
        : { buyerEmail: session.user.email };

    const appointments = await db.collection("appointments").find(query).toArray();

    // 5️⃣ Enrich appointments with user names
    const enrichedAppointments = await Promise.all(
      appointments.map(async (appointment) => {
        const [seller, buyer] = await Promise.all([
          db.collection("users").findOne({ email: appointment.sellerEmail }),
          db.collection("users").findOne({ email: appointment.buyerEmail }),
        ]);

        return {
          ...appointment,
          sellerName: seller?.name ?? "",
          buyerName: buyer?.name ?? "",
        };
      })
    );

    // 6️⃣ Return JSON
    return NextResponse.json({ appointments: enrichedAppointments });
  } catch (error) {
    console.error("GET /api/appointments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
