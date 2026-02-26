import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationBell } from "@/components/NotificationBell";
import logo from "@/assets/logo-transparent.png";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full relative">
        <div
          className="fixed inset-0 pointer-events-none select-none z-0"
          style={{ backgroundImage: `url(${logo})`, backgroundRepeat: 'repeat', backgroundSize: '120px', opacity: 0.035 }}
        />
        <AppSidebar />
        <main className="flex-1 flex flex-col relative z-10">
          <header className="h-14 flex items-center justify-between border-b border-border px-4">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <NotificationBell />
          </header>
          <div className="flex-1 p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}