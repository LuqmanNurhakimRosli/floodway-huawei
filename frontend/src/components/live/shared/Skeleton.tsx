export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200 motion-reduce:animate-none ${className}`} aria-hidden="true" />;
}

export function LiveVisionSkeleton() {
  return (
    <div className="grid gap-4 p-4 lg:grid-cols-[320px_minmax(0,1fr)_340px]" aria-busy="true" aria-label="Loading cameras">
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="space-y-3">
        <Skeleton className="h-20" />
        <Skeleton className="aspect-video w-full" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-40" />
        <Skeleton className="h-32" />
      </div>
    </div>
  );
}
