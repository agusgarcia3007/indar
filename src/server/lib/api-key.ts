import { db } from "../db";
import type { ApiKey, Project } from "./types";

export function generateApiKey(): string {
  const random = crypto.randomUUID().replace(/-/g, "");
  return `indar_sk_${random}`;
}

export function validateApiKey(
  key: string
): { apiKey: ApiKey; project: Project } | null {
  const row = db
    .query(
      `SELECT ak.*, p.id as p_id, p.userId as p_userId, p.name as p_name,
              p.description as p_description, p.createdAt as p_createdAt, p.updatedAt as p_updatedAt
       FROM api_key ak
       JOIN project p ON ak.projectId = p.id
       WHERE ak.key = ?`
    )
    .get(key) as any;

  if (!row) return null;

  // Update lastUsedAt
  db.query("UPDATE api_key SET lastUsedAt = datetime('now') WHERE id = ?").run(
    row.id
  );

  return {
    apiKey: {
      id: row.id,
      projectId: row.projectId,
      key: row.key,
      name: row.name,
      lastUsedAt: row.lastUsedAt,
      createdAt: row.createdAt,
    },
    project: {
      id: row.p_id,
      userId: row.p_userId,
      name: row.p_name,
      description: row.p_description,
      createdAt: row.p_createdAt,
      updatedAt: row.p_updatedAt,
    },
  };
}
