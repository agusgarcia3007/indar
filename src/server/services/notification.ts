import { db } from "../db";
import type {
  Event,
  Channel,
  Notification,
  EmailChannelConfig,
  TelegramChannelConfig,
} from "../lib/types";
import { sendEmail } from "./email";
import { sendTelegram } from "./telegram";

interface ChannelRule {
  channelId: string;
  type: "email" | "telegram";
  config: string;
  enabled: number;
}

export async function dispatchNotifications(
  event: Event,
  projectId: string
): Promise<void> {
  // Find all matching channel rules for this project and event category
  const rules = db
    .query(
      `SELECT pcr.channelId, c.type, c.config, c.enabled
       FROM project_channel_rule pcr
       JOIN channel c ON pcr.channelId = c.id
       WHERE pcr.projectId = ?
         AND (pcr.eventCategory = '*' OR pcr.eventCategory = ?)
         AND c.enabled = 1`
    )
    .all(projectId, event.channel) as ChannelRule[];

  // Deduplicate by channelId
  const seen = new Set<string>();
  const uniqueRules = rules.filter((r) => {
    if (seen.has(r.channelId)) return false;
    seen.add(r.channelId);
    return true;
  });

  for (const rule of uniqueRules) {
    const notificationId = crypto.randomUUID();

    // Create pending notification
    db.query(
      `INSERT INTO notification (id, eventId, channelId, status) VALUES (?, ?, ?, 'pending')`
    ).run(notificationId, event.id, rule.channelId);

    try {
      const config = JSON.parse(rule.config);

      if (rule.type === "email") {
        await sendEmail(config as EmailChannelConfig, event);
      } else if (rule.type === "telegram") {
        await sendTelegram(config as TelegramChannelConfig, event);
      }

      db.query(
        `UPDATE notification SET status = 'sent', sentAt = datetime('now') WHERE id = ?`
      ).run(notificationId);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error";
      db.query(
        `UPDATE notification SET status = 'failed', error = ? WHERE id = ?`
      ).run(errorMessage, notificationId);
    }
  }
}
