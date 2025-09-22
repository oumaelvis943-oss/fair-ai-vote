import { NavLink, useLocation } from "react-router-dom";
import {
  BarChart3,
  Vote,
  Plus,
  UserCheck,
  Upload,
  Shield,
  Settings,
  Users,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

const navigationItems = [
  { title: "Overview", url: "/admin", icon: BarChart3 },
  { title: "Elections", url: "/admin/elections", icon: Vote },
  { title: "Create", url: "/admin/create", icon: Plus },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "Candidates", url: "/admin/candidates", icon: UserCheck },
  { title: "Upload", url: "/admin/upload", icon: Upload },
  { title: "Audit", url: "/admin/audit", icon: Shield },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/admin") {
      return currentPath === "/admin";
    }
    return currentPath.startsWith(path);
  };

  const getNavCls = (path: string) =>
    isActive(path) 
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
      : "hover:bg-sidebar-accent/50";

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Sidebar
      className={collapsed ? "w-14" : "w-64"}
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 p-4">
          <div className="w-8 h-8 bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 rounded-lg flex items-center justify-center">
            <Settings className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex-1">
              <h1 className="text-lg font-bold text-sidebar-foreground">SecureVote</h1>
              <p className="text-xs text-sidebar-foreground/60">Admin Portal</p>
            </div>
          )}
        </div>
        {!collapsed && (
          <div className="px-4 pb-4">
            <Badge variant="destructive" className="bg-red-600 hover:bg-red-700">
              <Settings className="h-3 w-3 mr-1" />
              Administrator
            </Badge>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls(item.url)}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="p-4">
          {!collapsed && (
            <div className="mb-3">
              <p className="text-sm font-medium text-sidebar-foreground">
                {profile?.full_name || profile?.email}
              </p>
              <p className="text-xs text-sidebar-foreground/60">
                {profile?.email}
              </p>
            </div>
          )}
          <Button
            variant="outline"
            size={collapsed ? "icon" : "sm"}
            onClick={handleSignOut}
            className="w-full"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Sign Out</span>}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}