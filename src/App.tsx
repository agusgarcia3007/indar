import { useRoute } from "@/lib/router";
import { useSession } from "@/hooks/use-auth";
import { navigate } from "@/lib/router";
import { AppShell } from "@/components/layout/app-shell";
import { LoginPage } from "@/pages/login";
import { RegisterPage } from "@/pages/register";
import { DashboardPage } from "@/pages/dashboard";
import { ProjectsPage } from "@/pages/projects";
import { ProjectDetailPage } from "@/pages/project-detail";
import { ChannelsPage } from "@/pages/channels";
import { EventsPage } from "@/pages/events";
import { Skeleton } from "@/components/ui/skeleton";
import "./index.css";

export function App() {
  const route = useRoute();
  const { data: session, isPending } = useSession();

  // Auth pages - accessible without login
  if (route.path === "/login" || route.path === "/register") {
    if (session && !isPending) {
      navigate("/dashboard");
      return null;
    }
    return route.path === "/login" ? <LoginPage /> : <RegisterPage />;
  }

  // Loading state
  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 w-48">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!session) {
    navigate("/login");
    return null;
  }

  // Authenticated routes
  const projectMatch = route.matches("/projects/:id");

  let page: React.ReactNode;
  if (route.path === "/dashboard" || route.path === "/") {
    page = <DashboardPage />;
  } else if (route.path === "/projects") {
    page = <ProjectsPage />;
  } else if (projectMatch) {
    page = <ProjectDetailPage id={projectMatch.id} />;
  } else if (route.path === "/channels") {
    page = <ChannelsPage />;
  } else if (route.path === "/events") {
    page = <EventsPage />;
  } else {
    page = <DashboardPage />;
  }

  return <AppShell>{page}</AppShell>;
}

export default App;
