/**
 * Department pigments, mirrored from the `departments` table.
 *
 * Kept in its own module (not in a "use client" component) so server
 * components can colour-code without pulling a client bundle across the
 * boundary.
 */
export const DEPT_COLORS: Record<string, string> = {
  CSE: "#2563eb",
  ECE: "#10b981",
  EEE: "#f59e0b",
  ME: "#6d28d9",
  CE: "#ec4899",
  IT: "#06b6d4",
  AIDS: "#ef4444",
};

export function deptColor(code: string) {
  return DEPT_COLORS[code] ?? "#2563eb";
}
