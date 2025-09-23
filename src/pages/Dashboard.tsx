import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AdminDashboard from './AdminDashboard';
import VoterDashboard from '@/components/voter/VoterDashboard';
import SettingsPage from '@/components/SettingsPage';
import { Loader2, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function Dashboard() {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'settings'>('dashboard');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  // If user is admin, redirect to admin dashboard
  if (profile?.role === 'admin') {
    navigate('/admin');
    return null;
  }

  // If user is voter, redirect to voter dashboard
  if (profile?.role === 'voter') {
    navigate('/voter');
    return null;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Fallback for other roles (this should not be reached due to redirects above)
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-primary">Uchaguzi MFA</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {profile.full_name || profile.email}
            </span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Welcome
            </h2>
            <p className="text-muted-foreground mb-8">
              Loading your dashboard...
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}