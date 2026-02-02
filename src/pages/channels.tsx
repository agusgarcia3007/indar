import { useState } from "react";
import { useApi } from "@/hooks/use-api";
import { api } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Mail,
  Send,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  MessageCircle,
  Bell,
} from "lucide-react";
import { toast } from "sonner";
import type { Channel, EmailChannelConfig, TelegramChannelConfig } from "@/lib/types";

export function ChannelsPage() {
  const { data: channels, loading, refetch } = useApi<Channel[]>("/api/channels");
  const [dialogType, setDialogType] = useState<"email" | "telegram" | null>(null);

  const handleToggle = async (channel: Channel) => {
    const result = await api(`/api/channels/${channel.id}`, {
      method: "PUT",
      body: JSON.stringify({ enabled: !channel.enabled }),
    });
    if (result.error) {
      toast.error(result.error);
      return;
    }
    refetch();
  };

  const handleDelete = async (id: string) => {
    const result = await api(`/api/channels/${id}`, { method: "DELETE" });
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Channel deleted");
    refetch();
  };

  const handleTest = async (id: string) => {
    toast.info("Sending test notification...");
    const result = await api(`/api/channels/${id}/test`, { method: "POST" });
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Test notification sent!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Channels</h1>
          <p className="text-muted-foreground">
            Configure where your notifications are sent
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog
            open={dialogType === "email"}
            onOpenChange={(open) => setDialogType(open ? "email" : null)}
          >
            <DialogTrigger asChild>
              <Button variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Add Email
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Email channel</DialogTitle>
              </DialogHeader>
              <EmailChannelForm
                onSuccess={() => {
                  setDialogType(null);
                  refetch();
                }}
              />
            </DialogContent>
          </Dialog>

          <Dialog
            open={dialogType === "telegram"}
            onOpenChange={(open) => setDialogType(open ? "telegram" : null)}
          >
            <DialogTrigger asChild>
              <Button variant="outline">
                <MessageCircle className="h-4 w-4 mr-2" />
                Add Telegram
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Telegram channel</DialogTitle>
              </DialogHeader>
              <TelegramChannelForm
                onSuccess={() => {
                  setDialogType(null);
                  refetch();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : !channels?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No channels configured</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDialogType("email")}>
                <Mail className="h-4 w-4 mr-2" />
                Add Email
              </Button>
              <Button
                variant="outline"
                onClick={() => setDialogType("telegram")}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Add Telegram
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {channels.map((channel) => (
            <Card key={channel.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {channel.type === "email" ? (
                      <Mail className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <MessageCircle className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{channel.name}</p>
                      <Badge variant="secondary" className="text-xs">
                        {channel.type}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTest(channel.id)}
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Test
                  </Button>
                  <Switch
                    checked={!!channel.enabled}
                    onCheckedChange={() => handleToggle(channel)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(channel.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function EmailChannelForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [resendApiKey, setResendApiKey] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [toEmail, setToEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const config: EmailChannelConfig = {
      apiKey: resendApiKey,
      fromEmail,
      toEmail,
    };

    const result = await api("/api/channels", {
      method: "POST",
      body: JSON.stringify({ type: "email", name, config }),
    });
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Email channel added");
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="ch-name">Channel name</Label>
        <Input
          id="ch-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Email Alerts"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="resend-key">Resend API key</Label>
        <Input
          id="resend-key"
          type="password"
          value={resendApiKey}
          onChange={(e) => setResendApiKey(e.target.value)}
          placeholder="re_..."
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="from-email">From email</Label>
        <Input
          id="from-email"
          type="email"
          value={fromEmail}
          onChange={(e) => setFromEmail(e.target.value)}
          placeholder="notifications@yourdomain.com"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="to-email">To email</Label>
        <Input
          id="to-email"
          type="email"
          value={toEmail}
          onChange={(e) => setToEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? "Saving..." : "Save channel"}
      </Button>
    </form>
  );
}

function TelegramChannelForm({ onSuccess }: { onSuccess: () => void }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [botToken, setBotToken] = useState("");
  const [botInfo, setBotInfo] = useState<{
    username: string;
    firstName: string;
  } | null>(null);
  const [chats, setChats] = useState<
    Array<{ chatId: string; name: string; type: string }>
  >([]);
  const [selectedChat, setSelectedChat] = useState("");
  const [validating, setValidating] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [saving, setSaving] = useState(false);

  const validateToken = async () => {
    setValidating(true);
    const result = await api<{ username: string; firstName: string }>(
      "/api/channels/telegram/validate",
      {
        method: "POST",
        body: JSON.stringify({ botToken }),
      }
    );
    setValidating(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    setBotInfo(result.data!);
    setStep(2);
  };

  const detectChats = async () => {
    setDetecting(true);
    const result = await api<Array<{ chatId: string; name: string; type: string }>>(
      "/api/channels/telegram/get-updates",
      {
        method: "POST",
        body: JSON.stringify({ botToken }),
      }
    );
    setDetecting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    if (!result.data?.length) {
      toast.error("No messages found. Send a message to your bot first.");
      return;
    }

    setChats(result.data);
  };

  const handleSave = async () => {
    if (!selectedChat) {
      toast.error("Select a chat");
      return;
    }
    setSaving(true);

    const config: TelegramChannelConfig = {
      botToken,
      chatId: selectedChat,
    };

    const result = await api("/api/channels", {
      method: "POST",
      body: JSON.stringify({
        type: "telegram",
        name: name || `Telegram - ${botInfo?.firstName}`,
        config,
      }),
    });
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Telegram channel added");
    onSuccess();
  };

  return (
    <div className="space-y-4">
      {/* Step 1: Bot token */}
      {step >= 1 && (
        <div className="space-y-3">
          <Alert>
            <AlertDescription className="text-xs space-y-1">
              <p>1. Open Telegram and search for <strong>@BotFather</strong></p>
              <p>2. Send <code>/newbot</code> and follow the prompts</p>
              <p>3. Copy the bot token and paste it below</p>
            </AlertDescription>
          </Alert>
          <div className="space-y-2">
            <Label htmlFor="bot-token">Bot token</Label>
            <Input
              id="bot-token"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
              disabled={step > 1}
            />
          </div>
          {step === 1 && (
            <Button
              onClick={validateToken}
              disabled={!botToken.trim() || validating}
              className="w-full"
            >
              {validating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Validating...
                </>
              ) : (
                "Validate token"
              )}
            </Button>
          )}
          {botInfo && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              Bot found: @{botInfo.username} ({botInfo.firstName})
            </div>
          )}
        </div>
      )}

      {/* Step 2: Get chat ID */}
      {step >= 2 && (
        <div className="space-y-3 border-t pt-4">
          <Alert>
            <AlertDescription className="text-xs space-y-1">
              <p>
                1. Open Telegram and find your bot: <strong>@{botInfo?.username}</strong>
              </p>
              <p>2. Send it any message (e.g., "hello")</p>
              <p>3. Click "Detect Chat ID" below</p>
            </AlertDescription>
          </Alert>
          <Button
            onClick={detectChats}
            variant="outline"
            disabled={detecting}
            className="w-full"
          >
            {detecting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Detecting...
              </>
            ) : (
              "Detect Chat ID"
            )}
          </Button>
          {chats.length > 0 && (
            <div className="space-y-2">
              <Label>Select chat</Label>
              {chats.map((chat) => (
                <Button
                  key={chat.chatId}
                  variant={
                    selectedChat === chat.chatId ? "default" : "outline"
                  }
                  className="w-full justify-start"
                  onClick={() => {
                    setSelectedChat(chat.chatId);
                    setStep(3);
                  }}
                >
                  {chat.name} ({chat.type}) - ID: {chat.chatId}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Name & save */}
      {step >= 3 && (
        <div className="space-y-3 border-t pt-4">
          <div className="space-y-2">
            <Label htmlFor="tg-name">Channel name</Label>
            <Input
              id="tg-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`Telegram - ${botInfo?.firstName}`}
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full"
          >
            {saving ? "Saving..." : "Save channel"}
          </Button>
        </div>
      )}
    </div>
  );
}
