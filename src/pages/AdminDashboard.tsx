import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import CreateElectionForm from '@/components/admin/CreateElectionForm';
import ElectionsList from '@/components/admin/ElectionsList';
import { Vote, Users, Settings, FileText, Plus, BarChart3 } from 'lucide-react';

export default function AdminDashboard() {
  const { profile, signOut } = useAuth();
  const [refreshElections, setRefreshElections] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');

  const handleElectionCreated = () => {
    setRefreshElections(prev => prev + 1);
    setActiveTab('elections');
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const quickStats = [
    { icon: Vote, title: 'Total Elections', value: '0', color: 'text-primary' },
    { icon: Users, title: 'Active Candidates', value: '0', color: 'text-success' },
    { icon: FileText, title: 'Pending Applications', value: '0', color: 'text-warning' },
    { icon: BarChart3, title: 'Total Votes Cast', value: '0', color: 'text-info' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-primary">SecureVote Admin</h1>
            <Badge variant="destructive" className="capitalize">
              Administrator
            </Badge>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {profile?.full_name || profile?.email}
            </span>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h2>
          <p className="text-muted-foreground">
            Manage elections, candidates, and oversee the entire voting process
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="elections" className="flex items-center gap-2">
              <Vote className="h-4 w-4" />
              Elections
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Election
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickStats.map((stat, index) => (
                <Card key={index} className="card-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                      </div>
                      <stat.icon className={`h-8 w-8 ${stat.color}`} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="card-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Vote className="h-5 w-5 text-primary" />
                    Recent Elections
                  </CardTitle>
                  <CardDescription>
                    Overview of your latest election activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Vote className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No elections created yet</p>
                    <Button 
                      variant="outline" 
                      className="mt-3"
                      onClick={() => setActiveTab('create')}
                    >
                      Create First Election
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>
                    Common administrative tasks
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setActiveTab('create')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Election
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setActiveTab('elections')}
                  >
                    <Vote className="h-4 w-4 mr-2" />
                    Manage Elections
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setActiveTab('users')}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    User Management
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="elections">
            <ElectionsList refreshTrigger={refreshElections} />
          </TabsContent>

          <TabsContent value="create">
            <CreateElectionForm onElectionCreated={handleElectionCreated} />
          </TabsContent>

          <TabsContent value="users">
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  User Management
                </CardTitle>
                <CardDescription>
                  Manage users, roles, and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>User management features coming in Phase 2</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}