import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, message } = body;

    // Validation
    if (!firstName || !lastName || !email || !message) {
      return NextResponse.json(
        { error: "Tous les champs obligatoires doivent être remplis" },
        { status: 400 }
      );
    }

    // Envoyer l'email via Resend
    const emailContent = `
      <h2>Nouveau message de contact depuis Chaff.ch</h2>
      <p><strong>Nom:</strong> ${firstName} ${lastName}</p>
      <p><strong>Email:</strong> ${email}</p>
      ${phone ? `<p><strong>Téléphone:</strong> ${phone}</p>` : ""}
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, "<br>")}</p>
    `;

    await sendEmail({
      to: "gp@webbing.ch",
      subject: `Nouveau contact de ${firstName} ${lastName}`,
      html: emailContent,
      replyTo: email,
    });

    return NextResponse.json(
      { success: true, message: "Message envoyé avec succès" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de l'envoi du message:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du message" },
      { status: 500 }
    );
  }
}
