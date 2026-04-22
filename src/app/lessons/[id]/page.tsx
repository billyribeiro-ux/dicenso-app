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
  return <LessonDetailClientPage initialId={id} />;
}
