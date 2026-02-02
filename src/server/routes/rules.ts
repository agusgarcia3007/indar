import { db } from "../db";
import { requireAuth, jsonResponse, errorResponse } from "../middleware";
import type { ProjectChannelRule, Channel } from "../lib/types";

export const ruleRoutes = {
  async list(req: Request) {
    const session = await requireAuth(req);
    if (!session) return errorResponse("Unauthorized", 401);

    const parts = new URL(req.url).pathname.split("/");
    const projectId = parts[parts.indexOf("projects") + 1];

    // Verify ownership
    const project = db
      .query("SELECT id FROM project WHERE id = ? AND userId = ?")
      .get(projectId, session.user.id);

    if (!project) return errorResponse("Project not found", 404);

    const rules = db
      .query(
        `SELECT pcr.*, c.name as channelName, c.type as channelType
         FROM project_channel_rule pcr
         JOIN channel c ON pcr.channelId = c.id
         WHERE pcr.projectId = ?
         ORDER BY pcr.createdAt DESC`
      )
      .all(projectId) as (ProjectChannelRule & {
      channelName: string;
      channelType: string;
    })[];

    return jsonResponse({ data: rules });
  },

  async create(req: Request) {
    const session = await requireAuth(req);
    if (!session) return errorResponse("Unauthorized", 401);

    const parts = new URL(req.url).pathname.split("/");
    const projectId = parts[parts.indexOf("projects") + 1];
    const body = (await req.json()) as {
      channelId: string;
      eventCategory?: string;
    };

    // Verify project ownership
    const project = db
      .query("SELECT id FROM project WHERE id = ? AND userId = ?")
      .get(projectId, session.user.id);

    if (!project) return errorResponse("Project not found", 404);

    // Verify channel ownership
    const channel = db
      .query("SELECT id FROM channel WHERE id = ? AND userId = ?")
      .get(body.channelId, session.user.id) as Channel | null;

    if (!channel) return errorResponse("Channel not found", 404);

    const id = crypto.randomUUID();
    const eventCategory = body.eventCategory?.trim() || "*";

    try {
      db.query(
        "INSERT INTO project_channel_rule (id, projectId, channelId, eventCategory) VALUES (?, ?, ?, ?)"
      ).run(id, projectId, body.channelId, eventCategory);
    } catch {
      return errorResponse("This rule already exists", 409);
    }

    const rule = db
      .query("SELECT * FROM project_channel_rule WHERE id = ?")
      .get(id) as ProjectChannelRule;

    return jsonResponse({ data: rule }, 201);
  },

  async delete(req: Request) {
    const session = await requireAuth(req);
    if (!session) return errorResponse("Unauthorized", 401);

    const parts = new URL(req.url).pathname.split("/");
    const projectId = parts[parts.indexOf("projects") + 1];
    const ruleId = parts.pop()!;

    // Verify project ownership
    const project = db
      .query("SELECT id FROM project WHERE id = ? AND userId = ?")
      .get(projectId, session.user.id);

    if (!project) return errorResponse("Project not found", 404);

    const rule = db
      .query(
        "SELECT * FROM project_channel_rule WHERE id = ? AND projectId = ?"
      )
      .get(ruleId, projectId) as ProjectChannelRule | null;

    if (!rule) return errorResponse("Rule not found", 404);

    db.query("DELETE FROM project_channel_rule WHERE id = ?").run(ruleId);
    return jsonResponse({ success: true });
  },
};
