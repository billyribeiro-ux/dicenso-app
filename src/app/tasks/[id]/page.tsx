import TaskDetailClientPage from './client-page';

export function generateStaticParams() {
  return [{ id: '_' }];
}

export default function TaskDetailPage() {
  return <TaskDetailClientPage />;
}
