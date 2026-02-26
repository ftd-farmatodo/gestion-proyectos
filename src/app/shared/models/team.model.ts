/** Represents a team or area within the company */
export interface Team {
  id: string;
  name: string;           // e.g., "Tecnologia", "RRHH", "Finanzas"
  /** Short prefix for Jira-style IDs, e.g. "TI", "OPS" */
  code: string;
  description?: string;
  icon?: string;          // optional emoji or icon key
  is_active: boolean;
  created_at: string;
}
