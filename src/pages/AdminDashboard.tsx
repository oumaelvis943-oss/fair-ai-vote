import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CreateElectionForm from '@/components/admin/CreateElectionForm';
import EditElectionForm from '@/components/admin/EditElectionForm';
import ElectionsList from '@/components/admin/ElectionsList';
import VoterListUpload from '@/components/admin/VoterListUpload';
import ElectionAnalytics from '@/components/admin/ElectionAnalytics';
import AuditTrailViewer from '@/components/admin/AuditTrailViewer';
import CandidateEvaluationDashboard from '@/components/admin/CandidateEvaluationDashboard';
import AdminSettings from '@/components/admin/AdminSettings';
import { Vote, Users, Settings, FileText, Plus, BarChart3, Shield, Upload, UserCheck } from 'lucide-react';

interface Election {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  voting_algorithm: 'fptp' | 'borda_count' | 'ranked_choice';
  max_candidates: number;
  require_approval: boolean;
  is_public: boolean;
  positions: string[];
  status: string;
}

export default function AdminDashboard() {
  const { profile, signOut } = useAuth();
  const [refreshElections, setRefreshElections] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [editingElection, setEditingElection] = useState<Election | null>(null);

  const handleElectionCreated = () => {
    setRefreshElections(prev => prev + 1);
    setActiveTab('elections');
  };

  const handleElectionUpdated = () => {
    setRefreshElections(prev => prev + 1);
    setEditingElection(null);
  };

  const handleEditElection = (election: Election) => {
    setEditingElection(election);
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm shadow-lg">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
                <Settings className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">SecureVote</h1>
                <p className="text-xs text-muted-foreground">Administration Portal</p>
              </div>
            </div>
            <Badge variant="destructive" className="bg-red-600 hover:bg-red-700 shadow-md">
              <Settings className="h-3 w-3 mr-1" />
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
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/5 rounded-2xl -z-10"></div>
          <div className="p-6">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-3">
              Administration Center
            </h2>
            <p className="text-muted-foreground text-lg">
              Complete control and oversight of the SecureVote election system
            </p>
            <div className="flex items-center mt-3 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              System Status: Active & Secure
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
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
              Create
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="candidates" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Candidates
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Audit
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
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
            <ElectionsList 
              refreshTrigger={refreshElections} 
              onEditElection={handleEditElection}
            />
          </TabsContent>

          <TabsContent value="create">
            <CreateElectionForm onElectionCreated={handleElectionCreated} />
          </TabsContent>

          <TabsContent value="analytics">
            <ElectionAnalytics />
          </TabsContent>

          <TabsContent value="candidates">
            <CandidateEvaluationDashboard />
          </TabsContent>

          <TabsContent value="upload">
            <div className="space-y-6">
              <Card className="card-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-primary" />
                    Voter Management
                  </CardTitle>
                  <CardDescription>
                    Upload eligible voter lists for elections
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Select an election from the Elections tab to upload a voter list for that specific election.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('elections')}
                  >
                    Go to Elections
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="audit">
            <AuditTrailViewer />
          </TabsContent>

          <TabsContent value="settings">
            <AdminSettings />
          </TabsContent>
        </Tabs>

        <Dialog open={!!editingElection} onOpenChange={() => setEditingElection(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Election</DialogTitle>
            </DialogHeader>
            {editingElection && (
              <EditElectionForm
                election={editingElection}
                onElectionUpdated={handleElectionUpdated}
                onClose={() => setEditingElection(null)}
              />
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}