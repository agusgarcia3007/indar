import { Link } from "@/lib/router";
import {
  LayoutDashboard,
  FolderKanban,
  Bell,
  Activity,
  LogOut,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { navigate } from "@/lib/router";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/channels", label: "Channels", icon: Bell },
  { href: "/events", label: "Events", icon: Activity },
];

export function Sidebar() {
  const handleLogout = async () => {
    await authClient.signOut();
    navigate("/login");
  };

  return (
    <aside className="flex flex-col w-56 border-r bg-muted/30 h-screen sticky top-0">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold tracking-tight">Indar</h1>
        <p className="text-xs text-muted-foreground">Notification service</p>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            activeClassName="bg-muted text-foreground font-medium"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-2 border-t">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
