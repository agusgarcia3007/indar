import { Resend } from "resend";
import type { Event, EmailChannelConfig } from "../lib/types";

export async function sendEmail(
  config: EmailChannelConfig,
  event: Event
): Promise<void> {
  const resend = new Resend(config.apiKey);
  const metadata = JSON.parse(event.metadata || "{}");

  const metadataHtml = Object.keys(metadata).length
    ? `<pre style="background:#f4f4f5;padding:12px;border-radius:6px;font-size:13px;overflow-x:auto">${JSON.stringify(metadata, null, 2)}</pre>`
    : "";

  const { error } = await resend.emails.send({
    from: config.fromEmail,
    to: config.toEmail,
    subject: `[${event.channel}] ${event.title}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px">
        <h2 style="margin:0 0 8px">${event.title}</h2>
        <p style="color:#71717a;margin:0 0 4px;font-size:13px">${event.channel} &middot; ${event.createdAt}</p>
        ${event.description ? `<p style="margin:16px 0">${event.description}</p>` : ""}
        ${metadataHtml}
      </div>
    `,
  });

  if (error) {
    throw new Error(error.message);
  }
}
