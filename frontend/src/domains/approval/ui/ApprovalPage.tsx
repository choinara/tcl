import { ApprovalProvider, ApprovalRoutes } from '@peakmate/e-approval';
import { authFetch } from '@/lib/api';

export default function ApprovalPage() {
  return (
    <ApprovalProvider apiBaseUrl="/api/approval" fetchFn={authFetch}>
      <ApprovalRoutes />
    </ApprovalProvider>
  );
}
