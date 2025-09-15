import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Vote, Users, Settings, FileText } from 'lucide-react';

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

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'candidate': return 'default';
      case 'voter': return 'secondary';
      default: return 'secondary';
    }
  };

  const getRoleFeatures = () => {
    switch (profile.role) {
      case 'admin':
        return [
          { icon: Settings, title: 'Election Management', description: 'Create and manage elections' },
          { icon: Users, title: 'User Management', description: 'Manage users and candidates' },
          { icon: FileText, title: 'Reports & Analytics', description: 'View election results and analytics' }
        ];
      case 'candidate':
        return [
          { icon: FileText, title: 'Application Status', description: 'View your candidacy applications' },
          { icon: Vote, title: 'Campaign Tools', description: 'Manage your campaign platform' }
        ];
      case 'voter':
        return [
          { icon: Vote, title: 'Active Elections', description: 'Participate in ongoing elections' },
          { icon: FileText, title: 'Election Results', description: 'View completed election results' }
        ];
      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-primary">SecureVote</h1>
            <Badge variant={getRoleColor(profile.role)} className="capitalize">
              {profile.role}
            </Badge>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {profile.full_name || profile.email}
            </span>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            {profile.role === 'admin' ? 'Admin Dashboard' : 
             profile.role === 'candidate' ? 'Candidate Portal' : 
             'Voter Dashboard'}
          </h2>
          <p className="text-muted-foreground">
            {profile.role === 'admin' ? 'Manage elections and oversee the voting process' : 
             profile.role === 'candidate' ? 'Manage your candidacy and campaign' : 
             'Participate in elections and view results'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getRoleFeatures().map((feature, index) => (
            <Card key={index} className="card-shadow hover:institutional-shadow transition-all duration-300 cursor-pointer">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-12">
          <h3 className="text-xl font-semibold mb-6">Quick Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="card-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Elections</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <Vote className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="card-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Elections</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <Settings className="h-8 w-8 text-success" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="card-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {profile.role === 'admin' ? 'Total Users' : 
                       profile.role === 'candidate' ? 'Your Applications' : 
                       'Your Votes'}
                    </p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <Users className="h-8 w-8 text-warning" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}