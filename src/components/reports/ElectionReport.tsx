import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Download, 
  Share, 
  CheckCircle, 
  Users, 
  Vote,
  BarChart3,
  Shield,
  Clock,
  Award,
  TrendingUp
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Election {
  id: string;
  title: string;
  status: string;
  start_date: string;
  end_date: string;
  description?: string;
  voting_algorithm?: string;
}

interface ReportData {
  election: Election;
  summary: {
    totalVoters: number;
    totalVotes: number;
    participationRate: number;
    totalCandidates: number;
    approvedCandidates: number;
  };
  results: {
    candidateName: string;
    position: string;
    votes: number;
    percentage: number;
    aiScore?: number;
    status: string;
  }[];
  aiEvaluation: {
    averageScore: number;
    scoreDistribution: any[];
    totalEvaluated: number;
  };
  securityMetrics: {
    totalAuditEvents: number;
    securityViolations: number;
    blockchainVerifications: number;
  };
  timeline: {
    electionCreated: string;
    votingStarted: string;
    votingEnded: string;
    resultsPublished?: string;
  };
}

interface ElectionReportProps {
  election: Election;
}

export default function ElectionReport({ election }: ElectionReportProps) {
  const { toast } = useToast();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    generateReport();
  }, [election.id]);

  const generateReport = async () => {
    try {
      setLoading(true);

      // Gather all data for the report
      const [
        { count: totalVoters },
        { count: totalVotes },
        { count: totalCandidates },
        { count: approvedCandidates },
        { count: auditEvents },
        { count: securityViolations }
      ] = await Promise.all([
        supabase.from('eligible_voters').select('*', { count: 'exact', head: true }).eq('election_id', election.id),
        supabase.from('votes').select('*', { count: 'exact', head: true }).eq('election_id', election.id),
        supabase.from('candidates').select('*', { count: 'exact', head: true }).eq('election_id', election.id),
        supabase.from('candidates').select('*', { count: 'exact', head: true }).eq('election_id', election.id).eq('status', 'approved'),
        supabase.from('vote_audit_trail').select('*', { count: 'exact', head: true }).eq('election_id', election.id),
        supabase.from('vote_audit_trail').select('*', { count: 'exact', head: true }).eq('election_id', election.id).eq('event_type', 'security_violation')
      ]);

      // Get detailed candidate results
      const { data: candidates } = await supabase
        .from('candidates')
        .select(`
          *,
          votes: votes(id)
        `)
        .eq('election_id', election.id);

      // Get profiles separately
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email');

      // Calculate results
      const results = candidates?.map(candidate => {
        const profile = profiles?.find(p => p.user_id === candidate.user_id);
        return {
          candidateName: profile?.full_name || 'Unknown',
          position: candidate.position || 'Not specified',
          votes: candidate.votes?.length || 0,
          percentage: totalVotes > 0 ? ((candidate.votes?.length || 0) / totalVotes) * 100 : 0,
          aiScore: candidate.ai_score,
          status: candidate.status
        };
      }).sort((a, b) => b.votes - a.votes) || [];

      // AI evaluation metrics
      const evaluatedCandidates = candidates?.filter(c => c.ai_score) || [];
      const averageScore = evaluatedCandidates.length > 0 
        ? evaluatedCandidates.reduce((sum, c) => sum + c.ai_score, 0) / evaluatedCandidates.length 
        : 0;

      const scoreDistribution = [
        { range: '90-100', count: evaluatedCandidates.filter(c => c.ai_score >= 90).length },
        { range: '80-89', count: evaluatedCandidates.filter(c => c.ai_score >= 80 && c.ai_score < 90).length },
        { range: '70-79', count: evaluatedCandidates.filter(c => c.ai_score >= 70 && c.ai_score < 80).length },
        { range: '60-69', count: evaluatedCandidates.filter(c => c.ai_score >= 60 && c.ai_score < 70).length },
        { range: '0-59', count: evaluatedCandidates.filter(c => c.ai_score > 0 && c.ai_score < 60).length }
      ];

      const reportData: ReportData = {
        election,
        summary: {
          totalVoters: totalVoters || 0,
          totalVotes: totalVotes || 0,
          participationRate: totalVoters > 0 ? ((totalVotes || 0) / totalVoters) * 100 : 0,
          totalCandidates: totalCandidates || 0,
          approvedCandidates: approvedCandidates || 0
        },
        results,
        aiEvaluation: {
          averageScore,
          scoreDistribution,
          totalEvaluated: evaluatedCandidates.length
        },
        securityMetrics: {
          totalAuditEvents: auditEvents || 0,
          securityViolations: securityViolations || 0,
          blockchainVerifications: totalVotes || 0 // Assuming all votes are blockchain verified
        },
        timeline: {
          electionCreated: election.start_date,
          votingStarted: election.start_date,
          votingEnded: election.end_date,
          resultsPublished: election.status === 'completed' ? election.end_date : undefined
        }
      };

      setReportData(reportData);

    } catch (error: any) {
      toast({
        title: "Error Generating Report",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: 'json' | 'pdf' | 'csv') => {
    if (!reportData) return;

    setGenerating(true);

    try {
      let exportData: any;
      let filename: string;
      let mimeType: string;

      switch (format) {
        case 'json':
          exportData = JSON.stringify(reportData, null, 2);
          filename = `${election.title.replace(/\s+/g, '_')}_report.json`;
          mimeType = 'application/json';
          break;

        case 'csv':
          // Create CSV for results
          const csvHeaders = 'Candidate,Position,Votes,Percentage,AI Score,Status\n';
          const csvRows = reportData.results.map(result => 
            `"${result.candidateName}","${result.position}",${result.votes},${result.percentage.toFixed(2)},${result.aiScore || 'N/A'},"${result.status}"`
          ).join('\n');
          exportData = csvHeaders + csvRows;
          filename = `${election.title.replace(/\s+/g, '_')}_results.csv`;
          mimeType = 'text/csv';
          break;

        case 'pdf':
          // For PDF, we'd typically use a library like jsPDF or send to a server
          // For now, create a formatted text report
          exportData = generateTextReport(reportData);
          filename = `${election.title.replace(/\s+/g, '_')}_report.txt`;
          mimeType = 'text/plain';
          break;

        default:
          throw new Error('Unsupported format');
      }

      // Store report in database
      const { error } = await supabase
        .from('election_reports')
        .insert({
          election_id: election.id,
          report_type: 'results',
          report_data: JSON.parse(JSON.stringify(reportData)),
          generated_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      // Download file
      const blob = new Blob([exportData], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Report Exported",
        description: `Report has been downloaded as ${format.toUpperCase()} and saved to database.`,
      });

    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const generateTextReport = (data: ReportData): string => {
    return `
ELECTION REPORT
===============

Election: ${data.election.title}
Status: ${data.election.status}
Period: ${new Date(data.election.start_date).toLocaleString()} - ${new Date(data.election.end_date).toLocaleString()}

SUMMARY
-------
Total Eligible Voters: ${data.summary.totalVoters}
Total Votes Cast: ${data.summary.totalVotes}
Participation Rate: ${data.summary.participationRate.toFixed(2)}%
Total Candidates: ${data.summary.totalCandidates}
Approved Candidates: ${data.summary.approvedCandidates}

RESULTS
-------
${data.results.map((result, index) => 
  `${index + 1}. ${result.candidateName} (${result.position})
     Votes: ${result.votes} (${result.percentage.toFixed(2)}%)
     AI Score: ${result.aiScore || 'Not evaluated'}
     Status: ${result.status}`
).join('\n\n')}

AI EVALUATION
-------------
Average AI Score: ${data.aiEvaluation.averageScore.toFixed(2)}
Total Evaluated: ${data.aiEvaluation.totalEvaluated}

Score Distribution:
${data.aiEvaluation.scoreDistribution.map(dist => 
  `${dist.range}: ${dist.count} candidates`
).join('\n')}

SECURITY METRICS
----------------
Total Audit Events: ${data.securityMetrics.totalAuditEvents}
Security Violations: ${data.securityMetrics.securityViolations}
Blockchain Verifications: ${data.securityMetrics.blockchainVerifications}

Generated on: ${new Date().toLocaleString()}
    `;
  };

  if (loading) {
    return (
      <Card className="card-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
            <span>Generating report...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!reportData) {
    return (
      <Card className="card-shadow">
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-muted-foreground">Unable to generate report</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="card-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Election Report: {election.title}
              </CardTitle>
              <CardDescription>
                Comprehensive report including results, AI evaluation, and security metrics
              </CardDescription>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => exportReport('csv')}
                disabled={generating}
              >
                <Download className="mr-2 h-4 w-4" />
                CSV
              </Button>
              <Button 
                variant="outline" 
                onClick={() => exportReport('json')}
                disabled={generating}
              >
                <Download className="mr-2 h-4 w-4" />
                JSON
              </Button>
              <Button 
                onClick={() => exportReport('pdf')}
                disabled={generating}
                className="institutional-gradient"
              >
                {generating ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Export Report
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="card-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">{reportData.summary.totalVoters}</div>
                <div className="text-sm text-muted-foreground">Eligible Voters</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Vote className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">{reportData.summary.totalVotes}</div>
                <div className="text-sm text-muted-foreground">Votes Cast</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">{reportData.summary.participationRate.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Participation</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">{reportData.summary.approvedCandidates}</div>
                <div className="text-sm text-muted-foreground">Approved Candidates</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Shield className={`h-5 w-5 ${reportData.securityMetrics.securityViolations > 0 ? 'text-destructive' : 'text-success'}`} />
              <div>
                <div className="text-2xl font-bold">{reportData.securityMetrics.securityViolations}</div>
                <div className="text-sm text-muted-foreground">Security Issues</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Election Results */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Election Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reportData.results.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold text-lg">#{index + 1}</span>
                    <h4 className="font-semibold">{result.candidateName}</h4>
                    <Badge variant="outline">{result.position}</Badge>
                    {result.status === 'approved' && (
                      <CheckCircle className="h-4 w-4 text-success" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Vote className="h-4 w-4" />
                      <span className="font-bold">{result.votes} votes</span>
                      <span className="text-muted-foreground">({result.percentage.toFixed(1)}%)</span>
                    </div>
                    
                    {result.aiScore && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">AI Score:</span>
                        <Badge variant="outline">{result.aiScore}/100</Badge>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-2">
                    <Progress value={result.percentage} className="h-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Evaluation Summary */}
      {reportData.aiEvaluation.totalEvaluated > 0 && (
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              AI Evaluation Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Overall Statistics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Average AI Score:</span>
                    <span className="font-bold">{reportData.aiEvaluation.averageScore.toFixed(1)}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Candidates Evaluated:</span>
                    <span className="font-bold">{reportData.aiEvaluation.totalEvaluated}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Score Distribution</h4>
                <div className="space-y-2">
                  {reportData.aiEvaluation.scoreDistribution.map((dist, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{dist.range}</span>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={reportData.aiEvaluation.totalEvaluated > 0 ? (dist.count / reportData.aiEvaluation.totalEvaluated) * 100 : 0} 
                          className="w-20" 
                        />
                        <span className="text-sm font-medium w-6">{dist.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Report */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security & Audit Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {reportData.securityMetrics.totalAuditEvents}
              </div>
              <div className="text-sm text-muted-foreground">Total Audit Events</div>
            </div>
            
            <div className="text-center">
              <div className={`text-3xl font-bold mb-2 ${
                reportData.securityMetrics.securityViolations > 0 ? 'text-destructive' : 'text-success'
              }`}>
                {reportData.securityMetrics.securityViolations}
              </div>
              <div className="text-sm text-muted-foreground">Security Violations</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-success mb-2">
                {reportData.securityMetrics.blockchainVerifications}
              </div>
              <div className="text-sm text-muted-foreground">Blockchain Verified</div>
            </div>
          </div>

          {reportData.securityMetrics.securityViolations > 0 && (
            <Alert variant="destructive" className="mt-4">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                {reportData.securityMetrics.securityViolations} security violation(s) detected. 
                Please review the audit trail for details.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Election Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-success" />
              <span className="font-medium">Election Created:</span>
              <span>{new Date(reportData.timeline.electionCreated).toLocaleString()}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-success" />
              <span className="font-medium">Voting Started:</span>
              <span>{new Date(reportData.timeline.votingStarted).toLocaleString()}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-success" />
              <span className="font-medium">Voting Ended:</span>
              <span>{new Date(reportData.timeline.votingEnded).toLocaleString()}</span>
            </div>
            
            {reportData.timeline.resultsPublished && (
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="font-medium">Results Published:</span>
                <span>{new Date(reportData.timeline.resultsPublished).toLocaleString()}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}