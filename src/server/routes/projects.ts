import { db } from "../db";
import { requireAuth, jsonResponse, errorResponse } from "../middleware";
import { generateApiKey } from "../lib/api-key";
import type { Project, ApiKey } from "../lib/types";

export const projectRoutes = {
  async list(req: Request) {
    const session = await requireAuth(req);
    if (!session) return errorResponse("Unauthorized", 401);

    const projects = db
      .query("SELECT * FROM project WHERE userId = ? ORDER BY createdAt DESC")
      .all(session.user.id) as Project[];
    return jsonResponse({ data: projects });
  },

  async create(req: Request) {
    const session = await requireAuth(req);
    if (!session) return errorResponse("Unauthorized", 401);

    const body = (await req.json()) as { name: string; description?: string };

    if (!body.name?.trim()) {
      return errorResponse("Name is required");
    }

    const id = crypto.randomUUID();
    db.query(
      "INSERT INTO project (id, userId, name, description) VALUES (?, ?, ?, ?)"
    ).run(id, session.user.id, body.name.trim(), body.description?.trim() || "");

    const project = db.query("SELECT * FROM project WHERE id = ?").get(id) as Project;
    return jsonResponse({ data: project }, 201);
  },

  async get(req: Request) {
    const session = await requireAuth(req);
    if (!session) return errorResponse("Unauthorized", 401);

    const id = new URL(req.url).pathname.split("/").pop()!;

    const project = db
      .query("SELECT * FROM project WHERE id = ? AND userId = ?")
      .get(id, session.user.id) as Project | null;

    if (!project) return errorResponse("Project not found", 404);
    return jsonResponse({ data: project });
  },

  async update(req: Request) {
    const session = await requireAuth(req);
    if (!session) return errorResponse("Unauthorized", 401);

    const id = new URL(req.url).pathname.split("/").pop()!;
    const body = (await req.json()) as { name?: string; description?: string };

    const project = db
      .query("SELECT * FROM project WHERE id = ? AND userId = ?")
      .get(id, session.user.id) as Project | null;

    if (!project) return errorResponse("Project not found", 404);

    db.query(
      "UPDATE project SET name = ?, description = ?, updatedAt = datetime('now') WHERE id = ?"
    ).run(
      body.name?.trim() || project.name,
      body.description?.trim() ?? project.description,
      id
    );

    const updated = db.query("SELECT * FROM project WHERE id = ?").get(id) as Project;
    return jsonResponse({ data: updated });
  },

  async delete(req: Request) {
    const session = await requireAuth(req);
    if (!session) return errorResponse("Unauthorized", 401);

    const id = new URL(req.url).pathname.split("/").pop()!;

    const project = db
      .query("SELECT * FROM project WHERE id = ? AND userId = ?")
      .get(id, session.user.id) as Project | null;

    if (!project) return errorResponse("Project not found", 404);

    db.query("DELETE FROM project WHERE id = ?").run(id);
    return jsonResponse({ success: true });
  },

  // API Keys
  async listKeys(req: Request) {
    const session = await requireAuth(req);
    if (!session) return errorResponse("Unauthorized", 401);

    const parts = new URL(req.url).pathname.split("/");
    const projectId = parts[parts.indexOf("projects") + 1];

    const project = db
      .query("SELECT * FROM project WHERE id = ? AND userId = ?")
      .get(projectId, session.user.id) as Project | null;

    if (!project) return errorResponse("Project not found", 404);

    const keys = db
      .query("SELECT * FROM api_key WHERE projectId = ? ORDER BY createdAt DESC")
      .all(projectId) as ApiKey[];

    return jsonResponse({ data: keys });
  },

  async createKey(req: Request) {
    const session = await requireAuth(req);
    if (!session) return errorResponse("Unauthorized", 401);

    const parts = new URL(req.url).pathname.split("/");
    const projectId = parts[parts.indexOf("projects") + 1];
    const body = (await req.json()) as { name?: string };

    const project = db
      .query("SELECT * FROM project WHERE id = ? AND userId = ?")
      .get(projectId, session.user.id) as Project | null;

    if (!project) return errorResponse("Project not found", 404);

    const id = crypto.randomUUID();
    const key = generateApiKey();

    db.query(
      "INSERT INTO api_key (id, projectId, key, name) VALUES (?, ?, ?, ?)"
    ).run(id, projectId, key, body.name?.trim() || "Default");

    const apiKey = db.query("SELECT * FROM api_key WHERE id = ?").get(id) as ApiKey;
    return jsonResponse({ data: apiKey }, 201);
  },

  async deleteKey(req: Request) {
    const session = await requireAuth(req);
    if (!session) return errorResponse("Unauthorized", 401);

    const parts = new URL(req.url).pathname.split("/");
    const projectId = parts[parts.indexOf("projects") + 1];
    const keyId = parts.pop()!;

    const project = db
      .query("SELECT * FROM project WHERE id = ? AND userId = ?")
      .get(projectId, session.user.id) as Project | null;

    if (!project) return errorResponse("Project not found", 404);

    const key = db
      .query("SELECT * FROM api_key WHERE id = ? AND projectId = ?")
      .get(keyId, projectId) as ApiKey | null;

    if (!key) return errorResponse("API key not found", 404);

    db.query("DELETE FROM api_key WHERE id = ?").run(keyId);
    return jsonResponse({ success: true });
  },
};
