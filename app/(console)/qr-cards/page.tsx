import { Page, PageHeader } from "@/components/shell/app-shell";
import { StatTile } from "@/components/kpi-card";
import { QrCardsWorkbench } from "./workbench";
import { getDepartments, getEventStats, getStudents } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function QrCardsPage() {
  // A starter set so the page is useful before any CSV is imported.
  const [{ students }, departments, stats] = await Promise.all([
    getStudents({ perPage: 6 }),
    getDepartments(),
    getEventStats(),
  ]);

  return (
    <Page wide>
      <PageHeader title="QR Passes" description="Import admission numbers before the ceremony, generate one scan-ready pass per graduate, and hand them a link to their own ceremony hub." />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Total graduates" value={stats?.total ?? 0} sub="Class of 2026" tone="accent" />
        <StatTile label="Passes issued" value={stats?.total ?? 0} sub="One per graduate" tone="ok" />
        <StatTile label="Already scanned" value={stats?.checked_in ?? 0} sub="Checked in today" tone="ok" />
        <StatTile label="Departments" value={departments.length} sub="Across the cohort" />
      </div>

      <QrCardsWorkbench initialStudents={students} departments={departments} />
    </Page>
  );
}
