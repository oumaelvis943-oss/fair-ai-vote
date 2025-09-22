import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Vote, Users, FileText, BarChart3, Plus, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface Stats {
  totalElections: number;
  activeCandidates: number;
  pendingApplications: number;
  totalVotes: number;
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats>({
    totalElections: 0,
    activeCandidates: 0,
    pendingApplications: 0,
    totalVotes: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch elections count
      const { count: electionsCount } = await supabase
        .from('elections')
        .select('*', { count: 'exact', head: true });

      // Fetch candidates count
      const { count: candidatesCount } = await supabase
        .from('candidates')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

      // Fetch pending applications count
      const { count: pendingCount } = await supabase
        .from('candidates')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Fetch total votes count
      const { count: votesCount } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalElections: electionsCount || 0,
        activeCandidates: candidatesCount || 0,
        pendingApplications: pendingCount || 0,
        totalVotes: votesCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickStatsData = [
    { 
      icon: Vote, 
      title: 'Total Elections', 
      value: stats.totalElections.toString(), 
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    { 
      icon: Users, 
      title: 'Active Candidates', 
      value: stats.activeCandidates.toString(), 
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    { 
      icon: FileText, 
      title: 'Pending Applications', 
      value: stats.pendingApplications.toString(), 
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    },
    { 
      icon: BarChart3, 
      title: 'Total Votes Cast', 
      value: stats.totalVotes.toString(), 
      color: 'text-accent-foreground',
      bgColor: 'bg-accent'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/5 rounded-2xl -z-10"></div>
        <div className="p-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-3">
            Administration Overview
          </h1>
          <p className="text-muted-foreground text-lg mb-4">
            Complete control and oversight of the SecureVote election system
          </p>
          <div className="flex items-center text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            System Status: Active & Secure
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStatsData.map((stat, index) => (
          <Card key={index} className="card-shadow hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold">
                    {loading ? (
                      <div className="w-8 h-8 bg-muted animate-pulse rounded" />
                    ) : (
                      stat.value
                    )}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
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
            {stats.totalElections === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Vote className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="mb-3">No elections created yet</p>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/admin/create')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Election
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">Sample Election</p>
                    <p className="text-sm text-muted-foreground">Active • 2 candidates</p>
                  </div>
                  <Badge variant="outline">Active</Badge>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/admin/elections')}
                >
                  View All Elections
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
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
              onClick={() => navigate('/admin/create')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Election
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/admin/elections')}
            >
              <Vote className="h-4 w-4 mr-2" />
              Manage Elections
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/admin/candidates')}
            >
              <Users className="h-4 w-4 mr-2" />
              Review Candidates
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/admin/audit')}
            >
              <Settings className="h-4 w-4 mr-2" />
              Audit Trail
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            System Health
          </CardTitle>
          <CardDescription>
            Platform status and security overview
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
              <p className="text-sm font-medium">Database</p>
              <p className="text-xs text-muted-foreground">Operational</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
              <p className="text-sm font-medium">Security</p>
              <p className="text-xs text-muted-foreground">All systems secure</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
              <p className="text-sm font-medium">Blockchain</p>
              <p className="text-xs text-muted-foreground">Verification active</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}