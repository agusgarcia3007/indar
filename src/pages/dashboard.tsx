import { useApi } from "@/hooks/use-api";
import { navigate } from "@/lib/router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FolderKanban,
  Bell,
  Activity,
  Plus,
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import type { Project, Channel, Event } from "@/lib/types";

export function DashboardPage() {
  const projects = useApi<Project[]>("/api/projects");
  const channels = useApi<Channel[]>("/api/channels");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your notification service
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {projects.loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {projects.data?.length || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Channels</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {channels.loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {channels.data?.length || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Active channels
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {channels.loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {channels.data?.filter((c) => c.enabled).length || 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Projects</CardTitle>
            <CardDescription>
              Create projects and generate API keys to start tracking events
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {projects.loading ? (
              <Skeleton className="h-10 w-full" />
            ) : projects.data?.length ? (
              <>
                {projects.data.slice(0, 3).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between py-1"
                  >
                    <span className="text-sm font-medium">{p.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/projects/${p.id}`)}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {projects.data.length > 3 && (
                  <Button
                    variant="link"
                    size="sm"
                    className="px-0"
                    onClick={() => navigate("/projects")}
                  >
                    View all {projects.data.length} projects
                  </Button>
                )}
              </>
            ) : (
              <Button
                onClick={() => navigate("/projects")}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create your first project
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Channels</CardTitle>
            <CardDescription>
              Configure email or Telegram to receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {channels.loading ? (
              <Skeleton className="h-10 w-full" />
            ) : channels.data?.length ? (
              <>
                {channels.data.slice(0, 3).map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between py-1"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant={c.enabled ? "default" : "secondary"}>
                        {c.type}
                      </Badge>
                      <span className="text-sm">{c.name}</span>
                    </div>
                    {c.enabled ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </>
            ) : (
              <Button
                onClick={() => navigate("/channels")}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add your first channel
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick start guide */}
      {(!projects.data?.length || !channels.data?.length) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Getting started</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
              <li className={projects.data?.length ? "line-through" : ""}>
                Create a project and generate an API key
              </li>
              <li className={channels.data?.length ? "line-through" : ""}>
                Add a notification channel (Email or Telegram)
              </li>
              <li>Link your channel to the project with a rule</li>
              <li>
                Send events via the API:{" "}
                <code className="text-xs bg-muted px-1 py-0.5 rounded">
                  POST /api/events
                </code>
              </li>
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
