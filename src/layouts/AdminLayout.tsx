import { Outlet } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { useState } from 'react';
import { Menu, X, Shield, Bell, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import NotificationBell from '@/components/admin/NotificationBell';
export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
    profile
  } = useAuth();
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Enterprise Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-card/95 backdrop-blur-sm">
        <div className="flex h-16 items-center justify-between px-6">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden">
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            
            <div className="flex items-center gap-3 bg-white/0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-glow overflow-hidden bg-slate-950">
                <img src="/uchaguzi-logo.png" alt="Uchaguzi MFA Logo" className="h-8 w-8 object-contain" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold text-foreground">Uchaguzi MFA</h1>
                <p className="text-xs text-muted-foreground">Administration Panel</p>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <NotificationBell />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9 border-2 border-primary/20">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                      {profile?.full_name ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : 'AD'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium">{profile?.full_name || 'Administrator'}</p>
                  <p className="text-xs text-muted-foreground">{profile?.email || 'admin@uchaguzi-mfa.com'}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={() => {
                // Navigate to profile settings - for now just close
                console.log('Navigate to profile settings');
              }}>
                  <User className="mr-2 h-4 w-4" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => {
                // Navigate to security settings - for now just close
                console.log('Navigate to security settings');
              }}>
                  <Shield className="mr-2 h-4 w-4" />
                  Security
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive cursor-pointer" onClick={() => {
                supabase.auth.signOut();
              }}>
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          <div className="container-responsive py-8 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
      
      <Toaster />
    </div>;
}