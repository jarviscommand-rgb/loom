// ============================================================
// Loading Skeleton Components
//
// Reusable skeleton placeholders that match the layout of each
// LOOM view. Uses Tailwind animate-pulse for shimmer effect.
// ============================================================

/** Base shimmer bar. */
function Bar({ className = '' }: { className?: string }) {
  return <div className={`bg-white/5 rounded animate-pulse ${className}`} />;
}

/** Skeleton for timeline view. */
export function TimelineSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <Bar className="h-4 w-48" />
      <div className="space-y-3 mt-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Bar className="h-3 w-20 shrink-0" />
            <Bar className="h-10 flex-1 rounded-lg" />
          </div>
        ))}
      </div>
      <Bar className="h-32 w-full rounded-lg mt-4" />
    </div>
  );
}

/** Skeleton for network graph view. */
export function NetworkSkeleton() {
  return (
    <div className="p-6 flex items-center justify-center h-full">
      <div className="relative w-64 h-64">
        {Array.from({ length: 5 }).map((_, i) => {
          const angle = (i / 5) * Math.PI * 2;
          const x = 50 + Math.cos(angle) * 40;
          const y = 50 + Math.sin(angle) * 40;
          return (
            <div
              key={i}
              className="absolute w-8 h-8 rounded-full bg-white/5 animate-pulse"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                animationDelay: `${i * 200}ms`,
              }}
            />
          );
        })}
        <Bar className="absolute inset-1/4 w-1/2 h-1/2 rounded-full" />
      </div>
    </div>
  );
}

/** Skeleton for tension radar view. */
export function TensionSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Bar className="h-24 w-24 rounded-full" />
        <div className="space-y-2 flex-1">
          <Bar className="h-4 w-32" />
          <Bar className="h-3 w-48" />
        </div>
      </div>
      <div className="space-y-3 mt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Bar className="h-8 w-8 rounded" />
            <div className="flex-1 space-y-1">
              <Bar className="h-3 w-40" />
              <Bar className="h-2 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Skeleton for dream tree view. */
export function DreamSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <Bar className="h-4 w-40 mx-auto" />
      <div className="flex justify-center gap-6 mt-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2 w-48">
            <Bar className="h-32 rounded-lg" />
            <Bar className="h-3 w-32" />
            <Bar className="h-2 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Skeleton for sentiment dashboard. */
export function SentimentSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Bar key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <Bar className="h-48 rounded-lg" />
      <div className="grid grid-cols-2 gap-4">
        <Bar className="h-32 rounded-lg" />
        <Bar className="h-32 rounded-lg" />
      </div>
    </div>
  );
}

/** Skeleton for knowledge base pages. */
export function KnowledgeBaseSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <Bar className="h-6 w-64" />
      <Bar className="h-10 w-full rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Bar className="h-40 rounded-lg" />
            <Bar className="h-4 w-3/4" />
            <Bar className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Generic card skeleton. */
export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border border-loom-border/30 rounded-lg p-3 space-y-2">
          <Bar className="h-4 w-2/3" />
          <Bar className="h-3 w-full" />
          <Bar className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
