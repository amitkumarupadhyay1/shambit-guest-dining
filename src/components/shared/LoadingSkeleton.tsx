export function LoadingSkeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-xl ${className}`} />;
}

export function MenuItemSkeleton() {
  return (
    <div className="flex bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex-1 space-y-3 pr-4">
        <LoadingSkeleton className="h-4 w-3/4" />
        <LoadingSkeleton className="h-3 w-1/2" />
        <LoadingSkeleton className="h-4 w-1/4" />
      </div>
      <LoadingSkeleton className="w-24 h-24 rounded-xl flex-shrink-0" />
    </div>
  );
}
