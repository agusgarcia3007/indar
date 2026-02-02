import { serve } from "bun";
import index from "./index.html";
import { initializeDatabase } from "./server/db";
import { auth } from "./server/auth";
import { projectRoutes } from "./server/routes/projects";
import { channelRoutes } from "./server/routes/channels";
import { eventRoutes } from "./server/routes/events";
import { ruleRoutes } from "./server/routes/rules";
import { notificationRoutes } from "./server/routes/notifications";

// Initialize database tables
initializeDatabase();

const server = serve({
  routes: {
    // --- Better Auth (wildcard, matched before the SPA catch-all) ---
    "/api/auth/*": (req) => auth.handler(req),

    // --- Projects ---
    "/api/projects": {
      GET: projectRoutes.list,
      POST: projectRoutes.create,
    },
    "/api/projects/:id": {
      GET: projectRoutes.get,
      PUT: projectRoutes.update,
      DELETE: projectRoutes.delete,
    },
    "/api/projects/:projectId/keys": {
      GET: projectRoutes.listKeys,
      POST: projectRoutes.createKey,
    },
    "/api/projects/:projectId/keys/:keyId": {
      DELETE: projectRoutes.deleteKey,
    },

    // --- Channel Rules ---
    "/api/projects/:projectId/rules": {
      GET: ruleRoutes.list,
      POST: ruleRoutes.create,
    },
    "/api/projects/:projectId/rules/:ruleId": {
      DELETE: ruleRoutes.delete,
    },

    // --- Project Events & Notifications ---
    "/api/projects/:projectId/events": {
      GET: eventRoutes.listByProject,
    },
    "/api/projects/:projectId/notifications": {
      GET: notificationRoutes.listByProject,
    },

    // --- Channels ---
    "/api/channels": {
      GET: channelRoutes.list,
      POST: channelRoutes.create,
    },
    "/api/channels/telegram/validate": {
      POST: channelRoutes.telegramValidate,
    },
    "/api/channels/telegram/get-updates": {
      POST: channelRoutes.telegramGetUpdates,
    },
    "/api/channels/:id/test": {
      POST: channelRoutes.test,
    },
    "/api/channels/:id": {
      GET: channelRoutes.get,
      PUT: channelRoutes.update,
      DELETE: channelRoutes.delete,
    },

    // --- Events (public API + dashboard) ---
    "/api/events": {
      POST: eventRoutes.ingest,
    },
    "/api/events/:id": {
      GET: eventRoutes.get,
    },

    // --- Notifications ---
    "/api/notifications/:id": {
      GET: notificationRoutes.get,
    },

    // --- SPA catch-all (Bun bundles the HTML + its scripts/CSS) ---
    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`Indar running at ${server.url}`);
