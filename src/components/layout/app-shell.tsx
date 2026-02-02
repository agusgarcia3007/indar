import { Sidebar } from "./sidebar";
import { Toaster } from "@/components/ui/sonner";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6">{children}</div>
      </main>
      <Toaster />
    </div>
  );
}
