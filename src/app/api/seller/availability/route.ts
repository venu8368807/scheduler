import { NextRequest, NextResponse } from "next/server";
import clientPromise from "../../../lib/mongodb";
import { decrypt } from "../../../lib/crypto";
import { calendarClientFromRefreshToken } from "../../../lib/google";

type BusyInterval = { start: string; end: string };

function generateSlots(timeMinISO: string, timeMaxISO: string, busy: Array<BusyInterval>, slotMinutes = 30) {
  // Generate slots between 09:00–17:00 local time per day excluding busy intervals
  const start = new Date(timeMinISO);
  const end = new Date(timeMaxISO);
  const slots: string[] = [];
  
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    const day = new Date(d);
    day.setHours(9, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(17, 0, 0, 0);
    
    for (let s = new Date(day); s < dayEnd; s.setMinutes(s.getMinutes() + slotMinutes)) {
      const slotStart = new Date(s);
      const slotEnd = new Date(s);
      slotEnd.setMinutes(slotEnd.getMinutes() + slotMinutes);
      
      // Skip if overlaps any busy interval
      const overlaps = busy.some((b: BusyInterval) => {
        const busyStart = new Date(b.start);
        const busyEnd = new Date(b.end);
        return !(slotEnd <= busyStart || slotStart >= busyEnd);
      });
      
      if (!overlaps) slots.push(slotStart.toISOString());
    }
  }
  
  return slots;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerEmail = searchParams.get('sellerEmail');
    const days = searchParams.get('days') || '7';

    if (!sellerEmail) {
      return NextResponse.json({ error: "sellerEmail required" }, { status: 400 });
    }

    const db = (await clientPromise).db();
    const user = await db.collection("users").findOne({ email: sellerEmail });

    if (!user) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    // Check if user has refresh token
    if (!user.refreshToken) {
      return NextResponse.json({ 
        error: "Seller not connected (no refresh token)",
        code: "NO_REFRESH_TOKEN"
      }, { status: 400 });
    }

    let refreshToken;
    try {
      refreshToken = decrypt(user.refreshToken);
    } catch (decryptError) {
      console.error("Decrypt error:", decryptError);
      return NextResponse.json({ 
        error: "Invalid or unreadable refresh token. Please reconnect your Google Calendar.",
        code: "INVALID_REFRESH_TOKEN"
      }, { status: 400 });
    }

    if (!refreshToken) {
      return NextResponse.json({ 
        error: "Invalid or unreadable refresh token. Please reconnect your Google Calendar.",
        code: "INVALID_REFRESH_TOKEN"
      }, { status: 400 });
    }

    let calendar;
    try {
      calendar = calendarClientFromRefreshToken(refreshToken);
    } catch (calendarError) {
      console.error("Calendar client error:", calendarError);
      return NextResponse.json({ 
        error: "Failed to create calendar client. Please reconnect your Google Calendar.",
        code: "CALENDAR_CLIENT_ERROR"
      }, { status: 400 });
    }

    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + Number(days) * 24 * 3600 * 1000).toISOString();

    let resp;
    try {
      resp = await calendar.freebusy.query({
        requestBody: {
          timeMin,
          timeMax,
          items: [{ id: "primary" }],
        },
      });
    } catch (err: unknown) {
      console.error("Google Calendar API error:", err);

      // Type guard for error object
      const errorObj = typeof err === "object" && err !== null ? err as { code?: number; message?: string } : {};

      // Check for specific error types
      if (
        errorObj.code === 401 ||
        (typeof errorObj.message === "string" &&
          (errorObj.message.includes('Invalid Credentials') || errorObj.message.includes('unauthorized')))
      ) {
        // Clear the invalid refresh token from database
        try {
          await db.collection("users").updateOne(
            { email: sellerEmail },
            { $unset: { refreshToken: "" } }
          );
        } catch (dbError) {
          console.error("Failed to clear invalid refresh token:", dbError);
        }

        return NextResponse.json({
          error: "Google Calendar authorization expired. Please reconnect your calendar.",
          code: "AUTH_EXPIRED"
        }, { status: 401 });
      }

      return NextResponse.json({
        error: "Google Calendar API error",
        details: typeof errorObj.message === "string" ? errorObj.message : String(err),
        code: "CALENDAR_API_ERROR"
      }, { status: 502 });
    }

    if (!resp.data.calendars || !resp.data.calendars.primary) {
      return NextResponse.json({ 
        error: "Calendar data unavailable",
        code: "CALENDAR_DATA_UNAVAILABLE"
      }, { status: 502 });
    }

    const busy = (resp.data.calendars.primary.busy || [])
      .filter(b => typeof b.start === "string" && typeof b.end === "string")
      .map(b => ({ start: b.start as string, end: b.end as string }));
    const slots = generateSlots(timeMin, timeMax, busy, 30);

    return NextResponse.json({ busy, slots });
  } catch (error) {
    console.error("Availability error:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      code: "INTERNAL_ERROR"
    }, { status: 500 });
  }
}