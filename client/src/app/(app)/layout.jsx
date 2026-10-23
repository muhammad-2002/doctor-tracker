'use client';
import AppShell from '@/components/AppShell';
import { ErrorState } from '@/components/ui';
import { useMe } from '@/lib/queries';

export default function AppLayout({ children }) {
  const { data, isPending, isError, error, refetch } = useMe();
  if (isError && error.status !== 401) return <div className="p-8"><ErrorState error={error} onRetry={refetch} /></div>;
  if (isPending || isError) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500" role="status">Loading your workspace…</div>;
  }
  return <AppShell user={data.user}>{children}</AppShell>;
}
