import { useState } from "react";
import { useApi } from "@/hooks/use-api";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity } from "lucide-react";
import type { Project, Event } from "@/lib/types";

export function EventsPage() {
  const { data: projects, loading: loadingProjects } =
    useApi<Project[]>("/api/projects");
  const [selectedProject, setSelectedProject] = useState<string>("");

  const { data: events, loading: loadingEvents } = useApi<Event[]>(
    selectedProject ? `/api/projects/${selectedProject}/events` : null
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground">
            View all events received from your services
          </p>
        </div>
        <div className="w-64">
          {loadingProjects ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {!selectedProject ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Select a project to view its events
            </p>
          </CardContent>
        </Card>
      ) : loadingEvents ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : !events?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No events yet. Send your first event via the API.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-medium">{event.title}</TableCell>
                <TableCell>
                  <Badge variant="outline">{event.channel}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm max-w-xs truncate">
                  {event.description || "-"}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                  {new Date(event.createdAt).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
