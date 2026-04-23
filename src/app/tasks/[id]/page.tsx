import { Suspense } from 'react';
import { DetailRouteFallback } from '@/components/layout/detail-route-fallback';
import TaskDetailClientPage from './client-page';

export function generateStaticParams() {
  return [{ id: '_' }];
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<DetailRouteFallback label="Loading task" />}>
      <TaskDetailClientPage initialId={id} />
    </Suspense>
  );
}
