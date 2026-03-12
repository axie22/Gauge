import { CardSkeleton, Skeleton } from '@/components/Skeleton';

export default function Loading() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0,1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <CardSkeleton />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2"><CardSkeleton /></div>
          <div className="lg:col-span-1"><CardSkeleton /></div>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1"><CardSkeleton /></div>
          <div className="lg:col-span-2"><CardSkeleton /></div>
        </div>
      </div>
    </main>
  );
}
