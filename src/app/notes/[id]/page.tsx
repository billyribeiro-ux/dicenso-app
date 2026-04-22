import NoteDetailClientPage from './client-page';

// Required for static export — client-side routing handles all IDs
export function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

export default function NoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <NoteDetailClientPage />;
}
