import CandidateEvaluationDashboard from '@/components/admin/CandidateEvaluationDashboard';

export default function AdminCandidates() {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Candidate Management</h1>
        <p className="text-muted-foreground">
          Review, evaluate, and manage candidate applications with AI assistance
        </p>
      </div>

      <CandidateEvaluationDashboard />
    </div>
  );
}