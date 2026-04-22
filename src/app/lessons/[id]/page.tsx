import LessonDetailClientPage from './client-page';

export function generateStaticParams() {
  return [{ id: '_' }];
}

export default function LessonDetailPage() {
  return <LessonDetailClientPage />;
}
