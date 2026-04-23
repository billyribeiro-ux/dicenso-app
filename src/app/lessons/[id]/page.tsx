import { Suspense } from 'react';
import { DetailRouteFallback } from '@/components/layout/detail-route-fallback';
import LessonDetailClientPage from './client-page';

export function generateStaticParams() {
  return [{ id: '_' }];
}

export default async function LessonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<DetailRouteFallback label="Loading lesson" />}>
      <LessonDetailClientPage initialId={id} />
    </Suspense>
  );
}
