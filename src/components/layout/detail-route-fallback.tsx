type DetailRouteFallbackProps = {
  label: string;
};

export function DetailRouteFallback({ label }: DetailRouteFallbackProps) {
  return (
    <div className="flex h-64 items-center justify-center">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
        aria-label={label}
        role="status"
      />
    </div>
  );
}
