/** Represents a single work period */
export interface FiscalYear {
  /** Unique key, e.g. "FY2025" */
  key: string;
  /** Display label, e.g. "Periodo 1" */
  label: string;
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
}

/** Snapshot created when an admin closes a period */
export interface FiscalYearCloseRecord {
  fyKey: string;
  teamId: string;
  label: string;
  closedAt: string;
  closedBy: string;
  summary: FYCloseSummary;
}

/** Aggregate stats captured at period close */
export interface FYCloseSummary {
  totalRequests: number;
  completed: number;
  carriedOver: number;
  byType: { incidencia: number; mejora: number; proyecto: number };
  byStatus: Record<string, number>;
  topAchievements: { internal_id: string; title: string; developer: string; score: number }[];
  avgPriorityScore: number;
  teamName: string;
}
