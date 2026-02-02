// Shared types used by both server and client

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKey {
  id: string;
  projectId: string;
  key: string;
  name: string;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface EmailChannelConfig {
  apiKey: string;
  fromEmail: string;
  toEmail: string;
}

export interface TelegramChannelConfig {
  botToken: string;
  chatId: string;
}

export type ChannelConfig = EmailChannelConfig | TelegramChannelConfig;

export interface Channel {
  id: string;
  userId: string;
  type: "email" | "telegram";
  name: string;
  config: string;
  enabled: number;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  projectId: string;
  apiKeyId: string;
  channel: string;
  title: string;
  description: string;
  icon: string | null;
  metadata: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  eventId: string;
  channelId: string;
  status: "pending" | "sent" | "failed";
  error: string | null;
  sentAt: string | null;
  createdAt: string;
}

export interface ProjectChannelRule {
  id: string;
  projectId: string;
  channelId: string;
  eventCategory: string;
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
}
