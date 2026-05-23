/**
 * SkeletonLoader — Consulta CNPJ
 * Skeleton animado que imita o layout do resultado da consulta.
 */

function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-md skeleton-shimmer ${className}`}
      style={{ minHeight: "1rem" }}
    />
  );
}

export function SkeletonLoader() {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header card */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <SkeletonBlock className="w-14 h-14 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonBlock className="h-6 w-3/4" />
            <SkeletonBlock className="h-4 w-1/2" />
            <div className="flex gap-2 mt-3">
              <SkeletonBlock className="h-6 w-24 rounded-full" />
              <SkeletonBlock className="h-6 w-20 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-4 shadow-sm">
            <SkeletonBlock className="h-3 w-16 mb-2" />
            <SkeletonBlock className="h-5 w-24" />
          </div>
        ))}
      </div>

      {/* Content cards */}
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <SkeletonBlock className="h-4 w-32 mb-4" />
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, j) => (
              <div key={j} className="space-y-1.5">
                <SkeletonBlock className="h-3 w-20" />
                <SkeletonBlock className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
