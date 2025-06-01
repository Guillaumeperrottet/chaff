import { NextResponse } from "next/server";
import { EmailService } from "@/lib/email";

export async function GET() {
  try {
    console.log("Testing email service");

    // Test if environment variables are set
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;

    console.log(`RESEND_API_KEY available: ${resendApiKey ? "Yes" : "No"}`);
    console.log(`RESEND_FROM_EMAIL available: ${fromEmail ? "Yes" : "No"}`);

    // Create a test email
    // Adjust the method and parameters as needed for your EmailService implementation
    const result = await EmailService.sendTaskAssignmentEmail(
      "perrottet.guillaume.97@gmail.com", // Replace with your email for testing
      "Test User", // Provide a user name as required by sendTaskAssignmentEmail
      [] // Provide an empty array or mock tasks as required by sendTaskAssignmentEmail
    );

    console.log("Email test result:", result);

    return NextResponse.json({
      success: true,
      result: result,
    });
  } catch (error) {
    console.error("Error in test email:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de l'envoi de l'email de test",
        details: String(error),
      },
      { status: 500 }
    );
  }
}
