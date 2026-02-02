import { db } from "../db";
import { requireAuth, jsonResponse, errorResponse } from "../middleware";
import type { Channel, EmailChannelConfig, TelegramChannelConfig } from "../lib/types";
import { sendEmail } from "../services/email";
import { sendTelegram } from "../services/telegram";
import { validateBotToken, getBotUpdates } from "../services/telegram";

export const channelRoutes = {
  async list(req: Request) {
    const session = await requireAuth(req);
    if (!session) return errorResponse("Unauthorized", 401);

    const channels = db
      .query("SELECT * FROM channel WHERE userId = ? ORDER BY createdAt DESC")
      .all(session.user.id) as Channel[];
    return jsonResponse({ data: channels });
  },

  async create(req: Request) {
    const session = await requireAuth(req);
    if (!session) return errorResponse("Unauthorized", 401);

    const body = (await req.json()) as {
      type: "email" | "telegram";
      name: string;
      config: EmailChannelConfig | TelegramChannelConfig;
    };

    if (!body.name?.trim()) return errorResponse("Name is required");
    if (!body.type || !["email", "telegram"].includes(body.type))
      return errorResponse("Type must be 'email' or 'telegram'");
    if (!body.config) return errorResponse("Config is required");

    const id = crypto.randomUUID();
    db.query(
      "INSERT INTO channel (id, userId, type, name, config) VALUES (?, ?, ?, ?, ?)"
    ).run(id, session.user.id, body.type, body.name.trim(), JSON.stringify(body.config));

    const channel = db.query("SELECT * FROM channel WHERE id = ?").get(id) as Channel;
    return jsonResponse({ data: channel }, 201);
  },

  async get(req: Request) {
    const session = await requireAuth(req);
    if (!session) return errorResponse("Unauthorized", 401);

    const id = new URL(req.url).pathname.split("/").pop()!;

    const channel = db
      .query("SELECT * FROM channel WHERE id = ? AND userId = ?")
      .get(id, session.user.id) as Channel | null;

    if (!channel) return errorResponse("Channel not found", 404);
    return jsonResponse({ data: channel });
  },

  async update(req: Request) {
    const session = await requireAuth(req);
    if (!session) return errorResponse("Unauthorized", 401);

    const id = new URL(req.url).pathname.split("/").pop()!;
    const body = (await req.json()) as {
      name?: string;
      config?: EmailChannelConfig | TelegramChannelConfig;
      enabled?: boolean;
    };

    const channel = db
      .query("SELECT * FROM channel WHERE id = ? AND userId = ?")
      .get(id, session.user.id) as Channel | null;

    if (!channel) return errorResponse("Channel not found", 404);

    db.query(
      "UPDATE channel SET name = ?, config = ?, enabled = ?, updatedAt = datetime('now') WHERE id = ?"
    ).run(
      body.name?.trim() || channel.name,
      body.config ? JSON.stringify(body.config) : channel.config,
      body.enabled !== undefined ? (body.enabled ? 1 : 0) : channel.enabled,
      id
    );

    const updated = db.query("SELECT * FROM channel WHERE id = ?").get(id) as Channel;
    return jsonResponse({ data: updated });
  },

  async delete(req: Request) {
    const session = await requireAuth(req);
    if (!session) return errorResponse("Unauthorized", 401);

    const id = new URL(req.url).pathname.split("/").pop()!;

    const channel = db
      .query("SELECT * FROM channel WHERE id = ? AND userId = ?")
      .get(id, session.user.id) as Channel | null;

    if (!channel) return errorResponse("Channel not found", 404);

    db.query("DELETE FROM channel WHERE id = ?").run(id);
    return jsonResponse({ success: true });
  },

  async test(req: Request) {
    const session = await requireAuth(req);
    if (!session) return errorResponse("Unauthorized", 401);

    const parts = new URL(req.url).pathname.split("/");
    const channelId = parts[parts.indexOf("channels") + 1];

    const channel = db
      .query("SELECT * FROM channel WHERE id = ? AND userId = ?")
      .get(channelId, session.user.id) as Channel | null;

    if (!channel) return errorResponse("Channel not found", 404);

    const config = JSON.parse(channel.config);
    const testEvent = {
      id: "test",
      projectId: "test",
      apiKeyId: "test",
      channel: "test",
      title: "Test notification from Indar",
      description: "If you received this, your channel is configured correctly.",
      icon: null,
      metadata: "{}",
      createdAt: new Date().toISOString(),
    };

    try {
      if (channel.type === "email") {
        await sendEmail(config as EmailChannelConfig, testEvent);
      } else if (channel.type === "telegram") {
        await sendTelegram(config as TelegramChannelConfig, testEvent);
      }
      return jsonResponse({ success: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return errorResponse(`Test failed: ${message}`, 500);
    }
  },

  async telegramValidate(req: Request) {
    const session = await requireAuth(req);
    if (!session) return errorResponse("Unauthorized", 401);

    const body = (await req.json()) as { botToken: string };

    if (!body.botToken?.trim()) return errorResponse("Bot token is required");

    try {
      const bot = await validateBotToken(body.botToken.trim());
      return jsonResponse({ data: bot });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid bot token";
      return errorResponse(message);
    }
  },

  async telegramGetUpdates(req: Request) {
    const session = await requireAuth(req);
    if (!session) return errorResponse("Unauthorized", 401);

    const body = (await req.json()) as { botToken: string };

    if (!body.botToken?.trim()) return errorResponse("Bot token is required");

    try {
      const chats = await getBotUpdates(body.botToken.trim());
      return jsonResponse({ data: chats });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to get updates";
      return errorResponse(message);
    }
  },
};
