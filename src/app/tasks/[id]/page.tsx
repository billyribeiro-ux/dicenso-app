import TaskDetailClientPage from './client-page';

// Required for static export — client-side routing handles all IDs
export function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <TaskDetailClientPage />;
}
