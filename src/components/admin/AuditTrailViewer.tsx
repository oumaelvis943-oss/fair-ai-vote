import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Search, Filter, Clock, User, Activity } from 'lucide-react';

interface AuditLog {
  id: string;
  event_type: string;
  timestamp: string;
  voter_id: string | null;
  election_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  event_data: any;
}

interface Election {
  id: string;
  title: string;
}

export default function AuditTrailViewer() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    election_id: '',
    event_type: '',
    search: ''
  });

  useEffect(() => {
    fetchElections();
    fetchAuditLogs();
  }, []);

  useEffect(() => {
    fetchAuditLogs();
  }, [filters]);

  const fetchElections = async () => {
    try {
      const { data, error } = await supabase
        .from('elections')
        .select('id, title')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setElections(data || []);
    } catch (error) {
      console.error('Error fetching elections:', error);
    }
  };

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('vote_audit_trail')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (filters.election_id && filters.election_id !== 'all') {
        query = query.eq('election_id', filters.election_id);
      }

      if (filters.event_type && filters.event_type !== 'all') {
        query = query.eq('event_type', filters.event_type);
      }

      if (filters.search) {
        query = query.or(`event_type.ilike.%${filters.search}%,ip_address.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType.toLowerCase()) {
      case 'vote_cast':
        return 'bg-green-500';
      case 'login':
        return 'bg-blue-500';
      case 'logout':
        return 'bg-gray-500';
      case 'candidate_registration':
        return 'bg-purple-500';
      case 'election_access':
        return 'bg-orange-500';
      case 'security_alert':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const formatEventData = (data: any) => {
    if (!data) return 'No additional data';
    
    try {
      return Object.entries(data)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
    } catch {
      return JSON.stringify(data);
    }
  };

  const eventTypes = [
    'vote_cast',
    'login',
    'logout',
    'candidate_registration',
    'election_access',
    'security_alert',
    'vote_verification',
    'blockchain_operation'
  ];

  return (
    <div className="space-y-6">
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Audit Trail
          </CardTitle>
          <CardDescription>
            Complete security audit log of all system activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by event type or IP address..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select
              value={filters.election_id}
              onValueChange={(value) => setFilters({ ...filters, election_id: value })}
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Elections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Elections</SelectItem>
                {elections.map((election) => (
                  <SelectItem key={election.id} value={election.id}>
                    {election.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.event_type}
              onValueChange={(value) => setFilters({ ...filters, event_type: value })}
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                {eventTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replace('_', ' ').toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => setFilters({ election_id: '', event_type: '', search: '' })}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="card-shadow">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest {auditLogs.length} audit log entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No audit logs found for the selected filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className={`w-3 h-3 rounded-full ${getEventTypeColor(log.event_type)} mt-2`} />
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {log.event_type.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {elections.find(e => e.id === log.election_id)?.title || 'System Event'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </div>

                    <div className="text-sm">
                      <p className="font-medium mb-1">Event Details:</p>
                      <p className="text-muted-foreground">
                        {formatEventData(log.event_data)}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {log.voter_id && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          User: {log.voter_id.substring(0, 8)}...
                        </div>
                      )}
                      {log.ip_address && (
                        <div>IP: {log.ip_address}</div>
                      )}
                      {log.user_agent && (
                        <div className="truncate max-w-xs">
                          Agent: {log.user_agent}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}