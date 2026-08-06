import { Suspense } from "react";
import { Page, PageHeader } from "@/components/shell/app-shell";
import { TableSkeleton } from "@/components/ui/feedback";
import { StudentsTable } from "./table";
import { getDepartments, getStudents } from "@/lib/queries";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PER_PAGE = 12;

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; dept?: string; status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const status = (params.status ?? "all") as "all" | "checked-in" | "waiting" | "complete";

  const [{ students, total }, departments] = await Promise.all([
    getStudents({ search: params.q, dept: params.dept, status, page, perPage: PER_PAGE }),
    getDepartments(),
  ]);

  return (
    <Page wide>
      <PageHeader title="Student Database"
        description={`${formatNumber(total)} graduates matching the current filters. Search, filter and inspect any record.`} />

      <Suspense fallback={<TableSkeleton rows={8} />}>
        <StudentsTable
          students={students}
          total={total}
          departments={departments}
          page={page}
          perPage={PER_PAGE}
          filters={{ q: params.q ?? "", dept: params.dept ?? "all", status }} />
      </Suspense>
    </Page>
  );
}
