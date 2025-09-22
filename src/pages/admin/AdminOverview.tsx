import { useState, useEffect } from 'react';
import { StatsCard } from '@/components/ui/stats-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  Vote, 
  Users, 
  Shield, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Calendar,
  Eye,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  totalElections: number;
  activeElections: number;
  totalVoters: number;
  totalCandidates: number;
  recentActivity: any[];
}

export default function AdminOverview() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalElections: 0,
    activeElections: 0,
    totalVoters: 0,
    totalCandidates: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [electionsRes, candidatesRes] = await Promise.all([
        supabase.from('elections').select('*'),
        supabase.from('candidates').select('*')
      ]);

      const elections = electionsRes.data || [];
      const candidates = candidatesRes.data || [];
      const activeElections = elections.filter(e => e.status === 'active').length;

      setStats({
        totalElections: elections.length,
        activeElections,
        totalVoters: 0, // Would need voter data
        totalCandidates: candidates.length,
        recentActivity: elections.slice(0, 5)
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="border-b border-border/50 pb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Election Management Dashboard
        </h1>
        <p className="text-muted-foreground text-lg">
          Monitor elections, track performance, and manage your voting platform
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Elections"
          value={stats.totalElections}
          description="All elections in system"
          icon={Vote}
          variant="primary"
          trend={{ value: 12, label: "vs last month", isPositive: true }}
        />
        <StatsCard
          title="Active Elections"
          value={stats.activeElections}
          description="Currently running"
          icon={Activity}
          variant="success"
        />
        <StatsCard
          title="Total Candidates"
          value={stats.totalCandidates}
          description="Registered candidates"
          icon={Users}
          variant="default"
          trend={{ value: 8, label: "vs last month", isPositive: true }}
        />
        <StatsCard
          title="Security Score"
          value="98.5%"
          description="System security rating"
          icon={Shield}
          variant="success"
        />
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start btn-primary-gradient"
              onClick={() => navigate('/admin/create')}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Create New Election
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/admin/candidates')}
            >
              <Users className="mr-2 h-4 w-4" />
              Manage Candidates
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/admin/analytics')}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              View Analytics
            </Button>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-success" />
              System Status
            </CardTitle>
            <CardDescription>
              Platform health monitoring
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Security Systems</span>
              <Badge className="status-success">
                <CheckCircle className="mr-1 h-3 w-3" />
                Operational
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Blockchain Network</span>
              <Badge className="status-success">
                <CheckCircle className="mr-1 h-3 w-3" />
                Connected
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">AI Services</span>
              <Badge className="status-warning">
                <Clock className="mr-1 h-3 w-3" />
                Updating
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Database</span>
              <Badge className="status-success">
                <CheckCircle className="mr-1 h-3 w-3" />
                Healthy
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest election updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((election) => (
                <div key={election.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{election.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Status: {election.status}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-4">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent activity</p>
              </div>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-4"
              onClick={() => navigate('/admin/elections')}
            >
              View All Elections
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Alerts & Warnings */}
      <Card className="card-elevated border-warning/20 bg-warning/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-warning">
            <AlertTriangle className="h-5 w-5" />
            System Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-start gap-3 p-3 rounded-md bg-background/50">
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Pending Candidate Verifications</p>
                <p className="text-xs text-muted-foreground">
                  3 candidates require verification before election launch
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/admin/candidates')}>
                Review
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}