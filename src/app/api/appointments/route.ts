import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import clientPromise from "../../lib/mongodb";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = (await clientPromise).db();
    
    // Get user role
    const user = await db.collection("users").findOne({ 
      email: session.user?.email 
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch appointments based on user role
    let appointments;
    if (user.role === 'Seller') {
      appointments = await db.collection("appointments").find({
        sellerEmail: session.user?.email
      }).toArray();
    } else {
      appointments = await db.collection("appointments").find({
        buyerEmail: session.user?.email
      }).toArray();
    }

    // Enrich appointments with user names
    const enrichedAppointments = await Promise.all(
      appointments.map(async (appointment) => {
        const [seller, buyer] = await Promise.all([
          db.collection("users").findOne({ email: appointment.sellerEmail }),
          db.collection("users").findOne({ email: appointment.buyerEmail })
        ]);

        return {
          ...appointment,
          sellerName: seller?.name,
          buyerName: buyer?.name
        };
      })
    );

    return NextResponse.json({ appointments: enrichedAppointments });
  } catch (error) {
    console.error("Get appointments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
