import { Suspense } from "react";
import { Page, PageHeader } from "@/components/shell/app-shell";
import { StatTile } from "@/components/kpi-card";
import { Skeleton } from "@/components/ui/feedback";
import { GalleryGrid } from "./grid";
import { getDepartments, getEventStats, getMedia, getPhotographers } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; dept?: string; by?: string }>;
}) {
  const params = await searchParams;

  const [media, departments, photographers, stats] = await Promise.all([
    getMedia({ category: params.cat, dept: params.dept, photographer: params.by }),
    getDepartments(),
    getPhotographers(),
    getEventStats(),
  ]);

  return (
    <Page wide>
      <PageHeader title="Media Gallery" description="Every frame from every photographer, indexed by graduate, branch and session." />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Photos logged" value={stats?.photos ?? 0} sub="Stage and booth" tone="accent" />
        <StatTile label="In this archive" value={media.length} sub="Matching filters" tone="ok" />
        <StatTile label="Photographers" value={photographers.length} sub="On assignment" />
        <StatTile label="Booth sessions" value={stats?.booth_done ?? 0} sub="Complete" tone="ok" />
      </div>

      <Suspense fallback={<Skeleton className="h-[600px] w-full " />}>
        <GalleryGrid
          media={media}
          departments={departments}
          photographers={photographers}
          filters={{ cat: params.cat ?? "all", dept: params.dept ?? "all", by: params.by ?? "all" }} />
      </Suspense>
    </Page>
  );
}
