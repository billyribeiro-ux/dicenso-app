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
  return <TaskDetailClientPage initialId={id} />;
}
