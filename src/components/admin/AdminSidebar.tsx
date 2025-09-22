import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Vote, 
  Plus, 
  BarChart3, 
  Users, 
  Upload, 
  Shield, 
  Settings,
  ChevronRight,
  Activity
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AdminSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const navigationItems = [
  { 
    name: 'Overview', 
    href: '/admin/overview', 
    icon: LayoutDashboard,
    description: 'Dashboard & Key Metrics'
  },
  { 
    name: 'Elections', 
    href: '/admin/elections', 
    icon: Vote,
    description: 'Manage All Elections',
    badge: '4'
  },
  { 
    name: 'Create Election', 
    href: '/admin/create', 
    icon: Plus,
    description: 'Start New Election'
  },
  { 
    name: 'Analytics', 
    href: '/admin/analytics', 
    icon: BarChart3,
    description: 'Reports & Insights'
  },
  { 
    name: 'Candidates', 
    href: '/admin/candidates', 
    icon: Users,
    description: 'Candidate Management',
    badge: '12'
  },
  { 
    name: 'Voter Upload', 
    href: '/admin/upload', 
    icon: Upload,
    description: 'Eligible Voter Lists'
  },
  { 
    name: 'Audit Trail', 
    href: '/admin/audit', 
    icon: Shield,
    description: 'Security & Compliance'
  },
  { 
    name: 'Settings', 
    href: '/admin/settings', 
    icon: Settings,
    description: 'System Configuration'
  }
];

export default function AdminSidebar({ sidebarOpen, setSidebarOpen }: AdminSidebarProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (href: string) => currentPath === href;

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 transform border-r border-border/50 bg-card/95 backdrop-blur-xl transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          {/* Sidebar Header */}
          <div className="flex h-16 items-center border-b border-border/50 px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-glow">
                <Activity className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Admin Portal</h2>
                <p className="text-xs text-muted-foreground">Election Management</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 p-4">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
              Main Navigation
            </div>
            
            {navigationItems.map((item) => {
              const active = isActive(item.href);
              
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground",
                    active 
                      ? "bg-primary text-primary-foreground shadow-md" 
                      : "text-muted-foreground"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={cn(
                    "h-5 w-5 transition-colors",
                    active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground"
                  )} />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="truncate">{item.name}</span>
                      {item.badge && (
                        <Badge 
                          variant={active ? "secondary" : "outline"}
                          className="h-5 px-1.5 text-xs"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                    <p className={cn(
                      "text-xs truncate mt-0.5",
                      active ? "text-primary-foreground/70" : "text-muted-foreground/70"
                    )}>
                      {item.description}
                    </p>
                  </div>
                  
                  <ChevronRight className={cn(
                    "h-4 w-4 transition-transform opacity-0 group-hover:opacity-100",
                    active && "opacity-100"
                  )} />
                </NavLink>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="border-t border-border/50 p-4">
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-success" />
                <span className="text-sm font-medium text-foreground">System Status</span>
              </div>
              <p className="text-xs text-muted-foreground">
                All systems operational
              </p>
              <div className="flex items-center gap-1 mt-2">
                <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                <span className="text-xs text-success">Online</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}