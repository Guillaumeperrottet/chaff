// src/app/api/cron/daily-emails/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  console.log("Starting daily email cron job");
  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/emails/daily-emails`;
    console.log(`Making request to: ${apiUrl}`);

    const apiSecret = process.env.EMAIL_API_SECRET || "";
    console.log(`API secret available: ${apiSecret.length > 0 ? "Yes" : "No"}`);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "x-api-secret": apiSecret,
      },
    });

    console.log(`API response status: ${response.status}`);
    const data = await response.json();
    console.log(`API response data:`, data);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Detailed error in cron job:", error);
    return NextResponse.json(
      { error: "Erreur dans le job planifié", details: String(error) },
      { status: 500 }
    );
  }
}
