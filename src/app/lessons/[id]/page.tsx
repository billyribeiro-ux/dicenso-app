import LessonDetailClientPage from './client-page';

// Required for static export — client-side routing handles all IDs
export function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

export default function LessonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <LessonDetailClientPage />;
}
