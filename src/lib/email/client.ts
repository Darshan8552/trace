import { BrevoClient } from "@getbrevo/brevo";
import { serverEnv } from "@/lib/env";

export type EmailMessage = {
  to: string;
  subject: string;
  htmlContent: string;
  textContent: string;
};

let client: BrevoClient | undefined;

export async function sendEmail(message: EmailMessage): Promise<void> {
  const env = serverEnv();

  if (!env.BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY is not set");
  }

  if (!env.EMAIL_FROM) {
    throw new Error("EMAIL_FROM is not set");
  }

  client ??= new BrevoClient({ apiKey: env.BREVO_API_KEY });

  await client.transactionalEmails.sendTransacEmail({
    sender: { email: env.EMAIL_FROM, name: env.EMAIL_FROM_NAME },
    to: [{ email: message.to }],
    subject: message.subject,
    htmlContent: message.htmlContent,
    textContent: message.textContent,
  });
}
