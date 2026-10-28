export const visitSources = ["google_maps", "qr", "search", "direct"] as const;
export type VisitSource = typeof visitSources[number];
export const sourceLabels: Record<VisitSource,string> = { google_maps: "Google Maps", qr: "QR", search: "Pencarian", direct: "Langsung" };
export function visitSource(value: unknown): VisitSource { return value === "google_maps" || value === "qr" || value === "search" ? value : "direct"; }
export type VisitSummary = { source: VisitSource; visits: number | string; visit_date: string };
