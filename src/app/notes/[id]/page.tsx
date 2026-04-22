import NoteDetailClientPage from './client-page';

export function generateStaticParams() {
  return [{ id: '_' }];
}

export default function NoteDetailPage() {
  return <NoteDetailClientPage />;
}
