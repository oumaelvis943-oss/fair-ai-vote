import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AdminDashboard from './AdminDashboard';
import { Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-primary">SecureVote</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {profile.full_name || profile.email}
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            {profile.role === 'candidate' ? 'Candidate Portal' : 'Voter Dashboard'}
          </h2>
          <p className="text-muted-foreground mb-8">
            {profile.role === 'candidate' 
              ? 'Advanced candidate features coming in Phase 2' 
              : 'Voting features coming in Phase 2'}
          </p>
          <div className="text-sm text-muted-foreground">
            Phase 1 focuses on admin election management features
          </div>
        </div>
      </main>
    </div>
  );
}