export default function AppSegmentLoading() {
  return (
    <div
      className="flex min-h-[min(60dvh,28rem)] flex-1 items-center justify-center px-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-3">
        <div
          className="size-9 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600"
          aria-hidden
        />
        <span className="sr-only">Loading</span>
      </div>
    </div>
  )
}
