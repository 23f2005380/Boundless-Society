import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

async function Layout({ children }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin-login");
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="min-h-0 flex-1">
          <ScrollArea className="h-full">{children}</ScrollArea>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default Layout;
