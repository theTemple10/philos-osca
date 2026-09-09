import { Skeleton } from "@/components/ui/skeleton";
import { CardSkeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  );
}
