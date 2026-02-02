import { db } from "../db";
import { requireAuth, jsonResponse, errorResponse } from "../middleware";
import type { Notification } from "../lib/types";

export const notificationRoutes = {
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

    const notifications = db
      .query(
        `SELECT n.*, c.name as channelName, c.type as channelType,
                e.title as eventTitle, e.channel as eventCategory
         FROM notification n
         JOIN channel c ON n.channelId = c.id
         JOIN event e ON n.eventId = e.id
         WHERE e.projectId = ?
         ORDER BY n.createdAt DESC
         LIMIT ? OFFSET ?`
      )
      .all(projectId, limit, offset) as (Notification & {
      channelName: string;
      channelType: string;
      eventTitle: string;
      eventCategory: string;
    })[];

    const total = db
      .query(
        `SELECT COUNT(*) as count FROM notification n
         JOIN event e ON n.eventId = e.id
         WHERE e.projectId = ?`
      )
      .get(projectId) as { count: number };

    return jsonResponse({ data: notifications, total: total.count });
  },

  async get(req: Request) {
    const session = await requireAuth(req);
    if (!session) return errorResponse("Unauthorized", 401);

    const id = new URL(req.url).pathname.split("/").pop()!;

    const notification = db
      .query(
        `SELECT n.*, c.name as channelName, c.type as channelType,
                e.title as eventTitle, e.channel as eventCategory, e.description as eventDescription
         FROM notification n
         JOIN channel c ON n.channelId = c.id
         JOIN event e ON n.eventId = e.id
         JOIN project p ON e.projectId = p.id
         WHERE n.id = ? AND p.userId = ?`
      )
      .get(id, session.user.id);

    if (!notification) return errorResponse("Notification not found", 404);

    return jsonResponse({ data: notification });
  },
};
