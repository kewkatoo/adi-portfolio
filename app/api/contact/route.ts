import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  const { name, email, message } = await request.json();
  if (!name || !email || !message) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ error: "Email service is not configured" }, { status: 503 });

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "Portfolio <onboarding@resend.dev>",
    to: ["aditya.achary0909@gmail.com"],
    replyTo: email,
    subject: `Portfolio idea from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
  });
  if (error) return NextResponse.json({ error: "Could not send message" }, { status: 502 });
  return NextResponse.json({ sent: true });
}
