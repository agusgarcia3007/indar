import { useState } from "react";
import { useApi } from "@/hooks/use-api";
import { api } from "@/lib/api";
import { navigate } from "@/lib/router";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Trash2,
  Copy,
  Key,
  ArrowLeft,
  Code,
} from "lucide-react";
import { toast } from "sonner";
import type { Project, ApiKey, Channel, ProjectChannelRule, Event, Notification } from "@/lib/types";

export function ProjectDetailPage({ id }: { id: string }) {
  const { data: project, loading, refetch } = useApi<Project>(`/api/projects/${id}`);
  const keys = useApi<ApiKey[]>(`/api/projects/${id}/keys`);
  const rules = useApi<(ProjectChannelRule & { channelName: string; channelType: string })[]>(
    `/api/projects/${id}/rules`
  );
  const events = useApi<Event[]>(`/api/projects/${id}/events`);
  const channels = useApi<Channel[]>("/api/channels");

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Project not found</p>
        <Button variant="link" onClick={() => navigate("/projects")}>
          Back to projects
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/projects")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
          {project.description && (
            <p className="text-muted-foreground">{project.description}</p>
          )}
        </div>
      </div>

      <Tabs defaultValue="keys">
        <TabsList>
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="rules">Channel Rules</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
        </TabsList>

        {/* API Keys Tab */}
        <TabsContent value="keys" className="space-y-4">
          <ApiKeysSection projectId={id} keys={keys.data || []} refetch={keys.refetch} loading={keys.loading} />
        </TabsContent>

        {/* Channel Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <ChannelRulesSection
            projectId={id}
            rules={rules.data || []}
            channels={channels.data || []}
            refetchRules={rules.refetch}
            loading={rules.loading}
          />
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <EventsSection events={events.data || []} loading={events.loading} />
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-4">
          <UsageSection apiKey={keys.data?.[0]?.key} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ApiKeysSection({
  projectId,
  keys,
  refetch,
  loading,
}: {
  projectId: string;
  keys: ApiKey[];
  refetch: () => void;
  loading: boolean;
}) {
  const [keyName, setKeyName] = useState("");
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const result = await api<ApiKey>(`/api/projects/${projectId}/keys`, {
      method: "POST",
      body: JSON.stringify({ name: keyName || "Default" }),
    });
    setCreating(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("API key created. Copy it now - it won't be shown again.");
    setOpen(false);
    setKeyName("");
    refetch();
  };

  const handleDelete = async (keyId: string) => {
    const result = await api(`/api/projects/${projectId}/keys/${keyId}`, {
      method: "DELETE",
    });
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("API key revoked");
    refetch();
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("Copied to clipboard");
  };

  if (loading) return <Skeleton className="h-32 w-full" />;

  return (
    <>
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          API keys authenticate requests to the events API
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate API key</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="key-name">Name (optional)</Label>
                <Input
                  id="key-name"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="Production"
                />
              </div>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? "Generating..." : "Generate key"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!keys.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Key className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No API keys yet</p>
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Last used</TableHead>
              <TableHead>Created</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.map((k) => (
              <TableRow key={k.id}>
                <TableCell className="font-medium">{k.name}</TableCell>
                <TableCell>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {k.key.slice(0, 20)}...
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1"
                    onClick={() => copyKey(k.key)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {k.lastUsedAt
                    ? new Date(k.lastUsedAt).toLocaleString()
                    : "Never"}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(k.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(k.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}

function ChannelRulesSection({
  projectId,
  rules,
  channels,
  refetchRules,
  loading,
}: {
  projectId: string;
  rules: (ProjectChannelRule & { channelName: string; channelType: string })[];
  channels: Channel[];
  refetchRules: () => void;
  loading: boolean;
}) {
  const [channelId, setChannelId] = useState("");
  const [eventCategory, setEventCategory] = useState("*");
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelId) {
      toast.error("Select a channel");
      return;
    }
    setCreating(true);
    const result = await api(`/api/projects/${projectId}/rules`, {
      method: "POST",
      body: JSON.stringify({ channelId, eventCategory: eventCategory || "*" }),
    });
    setCreating(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Rule added");
    setOpen(false);
    setChannelId("");
    setEventCategory("*");
    refetchRules();
  };

  const handleDelete = async (ruleId: string) => {
    const result = await api(`/api/projects/${projectId}/rules/${ruleId}`, {
      method: "DELETE",
    });
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Rule removed");
    refetchRules();
  };

  if (loading) return <Skeleton className="h-32 w-full" />;

  return (
    <>
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Rules define which channels receive notifications for events in this
          project
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={!channels.length}>
              <Plus className="h-4 w-4 mr-2" />
              Add rule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add channel rule</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Channel</Label>
                <Select value={channelId} onValueChange={setChannelId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a channel" />
                  </SelectTrigger>
                  <SelectContent>
                    {channels
                      .filter((c) => c.enabled)
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          [{c.type}] {c.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-cat">Event category</Label>
                <Input
                  id="event-cat"
                  value={eventCategory}
                  onChange={(e) => setEventCategory(e.target.value)}
                  placeholder="* (all events)"
                />
                <p className="text-xs text-muted-foreground">
                  Use * for all events, or a specific category like "deploy",
                  "error", etc.
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? "Adding..." : "Add rule"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!rules.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">
              No rules configured. Add a rule to start receiving notifications.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Channel</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Event category</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.channelName}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{r.channelType}</Badge>
                </TableCell>
                <TableCell>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {r.eventCategory}
                  </code>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(r.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}

function EventsSection({
  events,
  loading,
}: {
  events: Event[];
  loading: boolean;
}) {
  if (loading) return <Skeleton className="h-32 w-full" />;

  if (!events.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <p className="text-sm text-muted-foreground">
            No events yet. Send your first event using the API.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {events.map((e) => (
          <TableRow key={e.id}>
            <TableCell className="font-medium">{e.title}</TableCell>
            <TableCell>
              <Badge variant="outline">{e.channel}</Badge>
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {new Date(e.createdAt).toLocaleString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function UsageSection({ apiKey }: { apiKey?: string }) {
  const key = apiKey || "indar_sk_YOUR_API_KEY";
  const curlExample = `curl -X POST ${window.location.origin}/api/events \\
  -H "Authorization: Bearer ${key}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "channel": "deploy",
    "title": "Deploy succeeded",
    "description": "v2.3.1 deployed to production",
    "metadata": {
      "version": "2.3.1",
      "environment": "production"
    }
  }'`;

  const copyExample = () => {
    navigator.clipboard.writeText(curlExample);
    toast.success("Copied to clipboard");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Code className="h-4 w-4" />
          API Usage
        </CardTitle>
        <CardDescription>Send events from your application</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
            {curlExample}
          </pre>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2"
            onClick={copyExample}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
