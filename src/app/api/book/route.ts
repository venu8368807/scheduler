import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import clientPromise from "../../lib/mongodb";
import { decrypt } from "../../lib/crypto";
import { calendarClientFromRefreshToken, oauthClientFromAccessToken } from "../../lib/google";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sellerEmail, slotStartISO, slotEndISO, title = "Appointment" } = await request.json();
    
    if (!sellerEmail || !slotStartISO || !slotEndISO) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = (await clientPromise).db();
    const seller = await db.collection("users").findOne({ email: sellerEmail });
    
    if (!seller || !seller.refreshToken) {
      return NextResponse.json({ error: "Seller not connected" }, { status: 400 });
    }

    const sellerRefresh = decrypt(seller.refreshToken);
    const sellerCalendar = calendarClientFromRefreshToken(sellerRefresh);

    // Create event on Seller calendar (server using seller refresh token)
    const event = {
      summary: title,
      description: `Booked via Next.js Scheduler`,
      start: { dateTime: slotStartISO },
      end: { dateTime: slotEndISO },
      attendees: [{ email: sellerEmail }, { email: session.user?.email }],
      conferenceData: { createRequest: { requestId: "meet-" + Date.now() } },
    };

    const createdOnSeller = await sellerCalendar.events.insert({
      calendarId: "primary",
      requestBody: event,
      conferenceDataVersion: 1,
      sendUpdates: "all", // send invites to attendees
    });

    // Optionally also create on buyer calendar using buyer token (available in session)
    try {
      const buyerAccessToken: string | undefined = (session as { accessToken?: string }).accessToken;
      if (buyerAccessToken) {
        const oauth2 = oauthClientFromAccessToken(buyerAccessToken);
        const { google } = await import("googleapis");
        const buyerCal = google.calendar({ version: "v3", auth: oauth2 });
        await buyerCal.events.insert({
          calendarId: "primary",
          requestBody: event,
          conferenceDataVersion: 1,
          sendUpdates: "all",
        });
      }
    } catch (e) {
      // If buyer access token not present/valid, it's fine: seller event created with attendees will invite buyer.
      console.warn("couldn't create on buyer calendar:", e);
    }

    // Save appointment metadata in DB
    await db.collection("appointments").insertOne({
      sellerEmail,
      buyerEmail: session.user?.email,
      slotStart: slotStartISO,
      slotEnd: slotEndISO,
      eventIdSeller: createdOnSeller.data.id,
      createdAt: new Date(),
    });

    return NextResponse.json({ ok: true, event: createdOnSeller.data });
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
