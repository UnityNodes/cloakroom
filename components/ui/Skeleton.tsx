export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-[var(--panel-2)] ${className}`}
      aria-hidden
    />
  );
}
