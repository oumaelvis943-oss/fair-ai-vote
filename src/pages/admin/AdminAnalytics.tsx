import ElectionAnalytics from '@/components/admin/ElectionAnalytics';

export default function AdminAnalytics() {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Election Analytics</h1>
        <p className="text-muted-foreground">
          Comprehensive analytics and insights for your elections
        </p>
      </div>

      <ElectionAnalytics />
    </div>
  );
}