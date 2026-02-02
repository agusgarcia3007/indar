# Indar

Self-hosted notification service. Create projects, generate API keys, and send events from your applications to get notified via Email (Resend) or Telegram.

## Stack

- **Runtime**: Bun
- **Backend**: Bun.serve() with native routing
- **Database**: bun:sqlite (SQLite)
- **Auth**: Better Auth (email/password, session cookies)
- **Frontend**: React 19, Tailwind CSS 4, shadcn/ui
- **Email**: Resend
- **Telegram**: Bot API (native fetch)

## Getting Started

```bash
bun install
```

Edit `.env` and set a secure secret:

```
BETTER_AUTH_SECRET=your-random-secret-at-least-32-characters
BETTER_AUTH_URL=http://localhost:3000
```

Start the dev server:

```bash
bun dev
```

Open `http://localhost:3000`, create an account, and you're ready to go.

## How It Works

1. **Create a project** and generate an API key
2. **Add a channel** (Email via Resend, or Telegram via your own bot)
3. **Add a rule** linking the channel to your project (for all events or specific categories)
4. **Send events** from your app using the API

## API

### Send an event

```bash
curl -X POST https://your-domain.com/api/events \
  -H "Authorization: Bearer indar_sk_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "deploy",
    "title": "Deploy succeeded",
    "description": "v2.3.1 deployed to production",
    "metadata": {
      "version": "2.3.1",
      "environment": "production"
    }
  }'
```

**Request body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | yes | Event title |
| `channel` | string | no | Event category (default: `"default"`). Used to match channel rules. |
| `description` | string | no | Event description |
| `icon` | string | no | Emoji or icon identifier |
| `metadata` | object | no | Arbitrary JSON data |

### Auth endpoints (Better Auth)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/sign-up/email` | Register |
| POST | `/api/auth/sign-in/email` | Login |
| POST | `/api/auth/sign-out` | Logout |
| GET | `/api/auth/get-session` | Get current session |

### Dashboard API (session auth)

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/projects` | List / Create projects |
| GET/PUT/DELETE | `/api/projects/:id` | Get / Update / Delete project |
| GET/POST | `/api/projects/:id/keys` | List / Generate API keys |
| DELETE | `/api/projects/:id/keys/:keyId` | Revoke API key |
| GET/POST | `/api/channels` | List / Create channels |
| PUT/DELETE | `/api/channels/:id` | Update / Delete channel |
| POST | `/api/channels/:id/test` | Send test notification |
| POST | `/api/channels/telegram/validate` | Validate Telegram bot token |
| POST | `/api/channels/telegram/get-updates` | Detect Telegram chat ID |
| GET/POST | `/api/projects/:id/rules` | List / Create channel rules |
| DELETE | `/api/projects/:id/rules/:ruleId` | Delete rule |
| GET | `/api/projects/:id/events` | List events |
| GET | `/api/events/:id` | Event detail with notifications |

## Notification Flow

```
Your app  -->  POST /api/events (API key)
                  |
                  v
            Insert event in DB
                  |
                  v
            Match channel rules (project + event category)
                  |
            +-----+-----+
            |           |
         Email       Telegram
        (Resend)    (Bot API)
            |           |
            v           v
      Notification records saved with status (sent/failed)
```

## Telegram Setup

1. Open Telegram, search for **@BotFather**, send `/newbot`
2. Copy the bot token
3. In Indar, go to Channels > Add Telegram
4. Paste the token and validate
5. Send any message to your bot in Telegram
6. Click "Detect Chat ID" and select your chat
7. Save and test

## Project Structure

```
src/
  index.ts                  Server entry point (all routes)
  server/
    db.ts                   SQLite database + schema
    auth.ts                 Better Auth config
    middleware.ts            Auth helpers
    lib/
      types.ts              Re-exports shared types
      api-key.ts            API key generation/validation
    routes/
      projects.ts           Project + API key endpoints
      channels.ts           Channel endpoints + Telegram helpers
      events.ts             Event ingestion + listing
      rules.ts              Channel rule endpoints
      notifications.ts      Notification listing
    services/
      notification.ts       Dispatch engine
      email.ts              Resend integration
      telegram.ts           Telegram Bot API
  lib/
    types.ts                Shared TypeScript types
    auth-client.ts          Better Auth React client
    api.ts                  Fetch wrapper
    router.tsx              Hash-based router
  components/
    layout/                 App shell + sidebar
    auth/                   Login + register forms
    ui/                     shadcn/ui components
  pages/
    dashboard.tsx           Stats + overview
    projects.tsx            Project list
    project-detail.tsx      API keys, rules, events, usage
    channels.tsx            Email + Telegram channel management
    events.tsx              Event log
  hooks/
    use-auth.ts             Session hook
    use-api.ts              Data fetching hook
```

## Scripts

```bash
bun dev        # Development server with HMR
bun start      # Production server
bun run build  # Build for production
```
