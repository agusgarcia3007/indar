import type { Event, TelegramChannelConfig } from "../lib/types";

function escapeMarkdown(text: string): string {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, "\\$1");
}

export async function sendTelegram(
  config: TelegramChannelConfig,
  event: Event
): Promise<void> {
  const lines = [
    `*${escapeMarkdown(event.title)}*`,
    `_${escapeMarkdown(event.channel)}_`,
  ];

  if (event.description) {
    lines.push("", escapeMarkdown(event.description));
  }

  const metadata = JSON.parse(event.metadata || "{}");
  if (Object.keys(metadata).length) {
    lines.push("", `\`\`\`json\n${JSON.stringify(metadata, null, 2)}\n\`\`\``);
  }

  const res = await fetch(
    `https://api.telegram.org/bot${config.botToken}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: lines.join("\n"),
        parse_mode: "MarkdownV2",
      }),
    }
  );

  const data = (await res.json()) as { ok: boolean; description?: string };
  if (!data.ok) {
    throw new Error(data.description || "Telegram API error");
  }
}

export async function validateBotToken(
  botToken: string
): Promise<{ username: string; firstName: string }> {
  const res = await fetch(
    `https://api.telegram.org/bot${botToken}/getMe`
  );
  const data = (await res.json()) as {
    ok: boolean;
    result?: { username: string; first_name: string };
    description?: string;
  };

  if (!data.ok || !data.result) {
    throw new Error(data.description || "Invalid bot token");
  }

  return {
    username: data.result.username,
    firstName: data.result.first_name,
  };
}

export async function getBotUpdates(
  botToken: string
): Promise<Array<{ chatId: string; name: string; type: string }>> {
  const res = await fetch(
    `https://api.telegram.org/bot${botToken}/getUpdates?limit=100`
  );
  const data = (await res.json()) as {
    ok: boolean;
    result?: Array<{
      message?: {
        chat: { id: number; first_name?: string; title?: string; type: string };
      };
    }>;
  };

  if (!data.ok || !data.result) {
    return [];
  }

  const chatsMap = new Map<
    string,
    { chatId: string; name: string; type: string }
  >();

  for (const update of data.result) {
    const chat = update.message?.chat;
    if (chat) {
      const chatId = String(chat.id);
      if (!chatsMap.has(chatId)) {
        chatsMap.set(chatId, {
          chatId,
          name: chat.title || chat.first_name || chatId,
          type: chat.type,
        });
      }
    }
  }

  return Array.from(chatsMap.values());
}
