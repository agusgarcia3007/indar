import { db } from "../db";
import { requireAuth, jsonResponse, errorResponse } from "../middleware";
import { validateApiKey } from "../lib/api-key";
import { dispatchNotifications } from "../services/notification";
import type { Event, Notification } from "../lib/types";

export const eventRoutes = {
  // Public endpoint - authenticated via API key
  async ingest(req: Request) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return errorResponse("Missing or invalid Authorization header", 401);
    }

    const key = authHeader.slice(7);
    const result = validateApiKey(key);
    if (!result) {
      return errorResponse("Invalid API key", 401);
    }

    const body = (await req.json()) as {
      channel?: string;
      title: string;
      description?: string;
      icon?: string;
      metadata?: Record<string, unknown>;
    };

    if (!body.title?.trim()) {
      return errorResponse("Title is required");
    }

    const id = crypto.randomUUID();
    const event: Event = {
      id,
      projectId: result.project.id,
      apiKeyId: result.apiKey.id,
      channel: body.channel?.trim() || "default",
      title: body.title.trim(),
      description: body.description?.trim() || "",
      icon: body.icon || null,
      metadata: JSON.stringify(body.metadata || {}),
      createdAt: new Date().toISOString(),
    };

    db.query(
      `INSERT INTO event (id, projectId, apiKeyId, channel, title, description, icon, metadata, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      event.id,
      event.projectId,
      event.apiKeyId,
      event.channel,
      event.title,
      event.description,
      event.icon,
      event.metadata,
      event.createdAt
    );

    // Dispatch notifications (synchronous in v1)
    await dispatchNotifications(event, result.project.id);

    return jsonResponse({ data: { id: event.id } }, 201);
  },

  // Dashboard endpoint - authenticated via session
  async listByProject(req: Request) {
    const session = await requireAuth(req);
    if (!session) return errorResponse("Unauthorized", 401);

    const parts = new URL(req.url).pathname.split("/");
    const projectId = parts[parts.indexOf("projects") + 1];
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    // Verify ownership
    const project = db
      .query("SELECT id FROM project WHERE id = ? AND userId = ?")
      .get(projectId, session.user.id);

    if (!project) return errorResponse("Project not found", 404);

    const events = db
      .query(
        "SELECT * FROM event WHERE projectId = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?"
      )
      .all(projectId, limit, offset) as Event[];

    const total = db
      .query("SELECT COUNT(*) as count FROM event WHERE projectId = ?")
      .get(projectId) as { count: number };

    return jsonResponse({ data: events, total: total.count });
  },

  async get(req: Request) {
    const session = await requireAuth(req);
    if (!session) return errorResponse("Unauthorized", 401);

    const id = new URL(req.url).pathname.split("/").pop()!;

    const event = db
      .query(
        `SELECT e.* FROM event e
         JOIN project p ON e.projectId = p.id
         WHERE e.id = ? AND p.userId = ?`
      )
      .get(id, session.user.id) as Event | null;

    if (!event) return errorResponse("Event not found", 404);

    const notifications = db
      .query(
        `SELECT n.*, c.name as channelName, c.type as channelType
         FROM notification n
         JOIN channel c ON n.channelId = c.id
         WHERE n.eventId = ?
         ORDER BY n.createdAt DESC`
      )
      .all(id) as (Notification & { channelName: string; channelType: string })[];

    return jsonResponse({ data: { ...event, notifications } });
  },
};
