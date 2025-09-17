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

  // Redirect admin users to specialized admin dashboard
  if (profile.role === 'admin') {
    return <AdminDashboard />;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-primary">SecureVote</h1>
            {profile.role === 'voter' || profile.role === 'candidate' ? (
              <nav className="flex space-x-4">
                <Button
                  variant={currentPage === 'dashboard' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentPage('dashboard')}
                >
                  {profile.role === 'candidate' ? 'Candidate Portal' : 'Elections'}
                </Button>
                <Button
                  variant={currentPage === 'settings' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentPage('settings')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </nav>
            ) : null}
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
        {profile.role === 'voter' ? (
          currentPage === 'dashboard' ? (
            <VoterDashboard />
          ) : (
            <SettingsPage />
          )
        ) : profile.role === 'candidate' ? (
          currentPage === 'dashboard' ? (
            <div className="container mx-auto px-4 py-8">
              <div className="text-center py-16">
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  Candidate Portal
                </h2>
                <p className="text-muted-foreground mb-8">
                  Advanced candidate features coming soon
                </p>
                <div className="text-sm text-muted-foreground">
                  Phase 2 will include candidate registration and campaign tools
                </div>
              </div>
            </div>
          ) : (
            <SettingsPage />
          )
        ) : null}
      </main>
    </div>
  );
}