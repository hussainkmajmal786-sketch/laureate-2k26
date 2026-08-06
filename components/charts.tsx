"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DEPARTMENTS, HOURLY_FLOW, QUEUE_TIMES, departmentStats } from "@/lib/data";

/* Recharts needs concrete colours, so the theme is read once on mount. */
function useInk() {
  const [c, setC] = React.useState({ ink: "#14100e", soft: "#cdc3b4" });
  React.useEffect(() => {
    const dark = document.documentElement.classList.contains("dark");
    setC(dark ? { ink: "#faf7f0", soft: "#464050" } : { ink: "#14100e", soft: "#cdc3b4" });
  }, []);
  return c;
}

const AXIS = { fontSize: 10, fontWeight: 700, letterSpacing: "0.08em" };

interface TooltipEntry {
  name?: string;
  value?: number | string;
  color?: string;
  fill?: string;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-paper rule-thick drop-2 p-2.5">
      <p className="stencil mb-1.5 text-[10px] text-ink">{label}</p>
      <ul className="space-y-1">
        {payload.map((p) => (
          <li key={p.name} className="flex items-center gap-2 text-[11.5px]">
            <span className="h-2.5 w-2.5 rule" style={{ backgroundColor: p.color ?? p.fill }} />
            <span className="text-ink-3 capitalize">{p.name}</span>
            <span className="figure ml-auto text-ink">{p.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Throughput by hour — solid bars, no area gradients. */
export function FlowChart({ height = 260 }: { height?: number }) {
  const c = useInk();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={HOURLY_FLOW} margin={{ top: 8, right: 4, left: -24, bottom: 0 }} barCategoryGap="22%">
        <CartesianGrid stroke={c.soft} strokeWidth={1} vertical={false} />
        <XAxis dataKey="hour" tick={{ ...AXIS, fill: c.ink }} axisLine={{ stroke: c.ink, strokeWidth: 2 }} tickLine={false} />
        <YAxis tick={{ ...AXIS, fill: c.ink }} axisLine={false} tickLine={false} width={42} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: c.soft, opacity: 0.3 }} />
        <Bar dataKey="checkin" name="Check-in" fill="#2563eb" stroke={c.ink} strokeWidth={2} />
        <Bar dataKey="stage" name="Stage" fill="#10b981" stroke={c.ink} strokeWidth={2} />
        <Bar dataKey="booth" name="Booth" fill="#f59e0b" stroke={c.ink} strokeWidth={2} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Branch distribution — a ruled pie, not a thin donut. */
export function BranchDonut({ height = 240 }: { height?: number }) {
  const c = useInk();
  const data = DEPARTMENTS.map((d) => ({ name: d.short, value: d.total, color: d.color }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius="42%" outerRadius="88%" paddingAngle={0}>
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} stroke={c.ink} strokeWidth={2.5} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );
}

/** Per-department completion. */
export function DepartmentBars({ height = 300 }: { height?: number }) {
  const c = useInk();
  const data = departmentStats();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: -24, bottom: 0 }} barCategoryGap="20%">
        <CartesianGrid stroke={c.soft} vertical={false} />
        <XAxis dataKey="code" tick={{ ...AXIS, fill: c.ink }} axisLine={{ stroke: c.ink, strokeWidth: 2 }} tickLine={false} />
        <YAxis tick={{ ...AXIS, fill: c.ink }} axisLine={false} tickLine={false} width={42} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: c.soft, opacity: 0.3 }} />
        <Legend iconType="square" iconSize={9} wrapperStyle={{ fontSize: 10.5, fontWeight: 700, paddingTop: 10, color: c.ink }} />
        <Bar dataKey="checkedIn" name="Checked in" fill="#2563eb" stroke={c.ink} strokeWidth={2} />
        <Bar dataKey="stage" name="Stage" fill="#10b981" stroke={c.ink} strokeWidth={2} />
        <Bar dataKey="booth" name="Booth" fill="#f59e0b" stroke={c.ink} strokeWidth={2} />
        <Bar dataKey="certificate" name="Certificate" fill="#ec4899" stroke={c.ink} strokeWidth={2} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Queue wait times — thick stepped lines with square joints. */
export function QueueChart({ height = 260 }: { height?: number }) {
  const c = useInk();
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={QUEUE_TIMES} margin={{ top: 8, right: 6, left: -24, bottom: 0 }}>
        <CartesianGrid stroke={c.soft} vertical={false} />
        <XAxis dataKey="hour" tick={{ ...AXIS, fill: c.ink }} axisLine={{ stroke: c.ink, strokeWidth: 2 }} tickLine={false} />
        <YAxis tick={{ ...AXIS, fill: c.ink }} axisLine={false} tickLine={false} width={42} unit="m" />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: c.ink, strokeWidth: 2 }} />
        <Legend iconType="square" iconSize={9} wrapperStyle={{ fontSize: 10.5, fontWeight: 700, paddingTop: 10, color: c.ink }} />
        <Line type="stepAfter" dataKey="booth1" name="Booth 1" stroke="#2563eb" strokeWidth={4} dot={false} activeDot={{ r: 6, stroke: c.ink, strokeWidth: 2 }} />
        <Line type="stepAfter" dataKey="booth2" name="Booth 2" stroke="#f59e0b" strokeWidth={4} dot={false} activeDot={{ r: 6, stroke: c.ink, strokeWidth: 2 }} />
        <Line type="stepAfter" dataKey="stage" name="Stage" stroke="#ec4899" strokeWidth={4} dot={false} activeDot={{ r: 6, stroke: c.ink, strokeWidth: 2 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Compact ruled bar strip for report tiles. */
export function MiniBars({ values, color = "#2563eb" }: { values: number[]; color?: string }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex h-11 items-end gap-1">
      {values.map((v, i) => (
        <div
          key={i}
          className="flex-1 rule"
          style={{ height: `${Math.max((v / max) * 100, 6)}%`, backgroundColor: color }}
        />
      ))}
    </div>
  );
}
