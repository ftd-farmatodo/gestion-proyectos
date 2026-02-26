/** Request type: Incidencia (red), Mejora (blue), Proyecto (green) */
export type RequestType = 'incidencia' | 'mejora' | 'proyecto';

/**
 * Lifecycle status of a request.
 * Default statuses are listed here for type hints, but the authoritative
 * list comes from StatusConfigStore (configurable by database).
 */
export type RequestStatus = string;

/** Configuration for a single status — driven by database */
export interface StatusConfig {
  key: string;
  label_es: string;
  label_en: string;
  color: string;       // CSS variable or value for text
  bgColor: string;     // CSS expression for badge background
  order: number;       // pipeline order (lower = earlier)
  allowed_transitions: string[]; // keys this status can transition to
  is_active: boolean;  // whether this status is enabled in the system
}

/** Impact level derived from numeric importance (1-5) */
export type ImpactLevel = 'alto' | 'medio' | 'bajo';

/** Maps numeric importance (1-5) to an ImpactLevel label */
export function getImpactLevel(importance: number): ImpactLevel {
  if (importance >= 4) return 'alto';
  if (importance === 3) return 'medio';
  return 'bajo';
}

/** File attachment on a request */
export interface Attachment {
  id: string;
  name: string;
  type: string;   // MIME type
  data?: string;  // base64 data URL (local preview)
  path?: string;  // storage path in Supabase bucket
  url?: string;   // signed/public URL in Supabase storage
  size: number;   // bytes
}

/** Comment attached to a request */
export interface Comment {
  id: string;
  author_id: string;
  text: string;
  created_at: string;
}

export interface Request {
  id: string;
  /** Jira-style sequential ID per team, e.g. "TI-001" */
  internal_id: string;
  title: string;
  description: string;
  type: RequestType;
  status: RequestStatus;
  requester_id: string;
  requester_name: string;
  requester_department: string;
  developer_id: string | null;
  urgency: number; // 1-5
  importance: number; // 1-5 (displayed as Nivel de Impacto: Alto/Medio/Bajo)
  complexity: number; // 1-5 (T-shirt: 1=XS .. 5=XL)
  priorityScore: number; // computed with DB formula: (urgency + importance) * (6 - complexity) / 5
  comments: Comment[]; // list of comments on this request
  created_at: string;
  updated_at: string;
  /** Team that owns this request */
  team_id: string;
  /** Fiscal year key, e.g. "FY2025", derived at creation time */
  fiscal_year: string;
  // Extended fields
  affected_module?: string;
  // Incidencia-specific
  steps_to_reproduce?: string;
  expected_behavior?: string;
  actual_behavior?: string;
  affected_url?: string;
  // Mejora / Proyecto-specific
  business_justification?: string;
  expected_benefit?: string;
  impacted_users?: string;
  // Attachments
  attachments?: Attachment[];
  /** Country codes the request applies to, e.g. ['VE', 'CO'] */
  countries?: string[];
  /** Traceability metadata for inferred urgency/importance */
  priority_inference?: PriorityInferenceTrace;
}

/** Create request payload (e.g. from submission form) */
export interface CreateRequestPayload {
  title: string;
  description: string;
  type: RequestType;
  urgency: number;
  importance: number;
  complexity: number;
  // Extended fields
  affected_module?: string;
  steps_to_reproduce?: string;
  expected_behavior?: string;
  actual_behavior?: string;
  affected_url?: string;
  business_justification?: string;
  expected_benefit?: string;
  impacted_users?: string;
  attachments?: Attachment[];
  countries?: string[];
  /** Traceability metadata for inferred urgency/importance */
  priority_inference?: PriorityInferenceTrace;
}

export interface PriorityInferenceTrace {
  modelVersion: string;
  urgencyScore: number;
  importanceScore: number;
  answers: Record<string, string>;
}

/** Eisenhower quadrant key */
export type QuadrantKey = 'q1' | 'q2' | 'q3' | 'q4';

/** Complexity weight for priority score (1=XS -> 1.0, 5=XL -> 0.4) */
export const COMPLEXITY_WEIGHTS: Record<number, number> = {
  1: 1.0,
  2: 0.85,
  3: 0.7,
  4: 0.55,
  5: 0.4,
};

/** Keep UI and DB aligned with the same priority formula used in Supabase trigger. */
export function calculatePriorityScore(
  urgency: number,
  importance: number,
  complexity: number
): number {
  const normalizedComplexity = Math.min(5, Math.max(1, complexity));
  const score = (urgency + importance) * (6 - normalizedComplexity) / 5;
  return Math.round(score * 100) / 100;
}

/** Activity timeline event types */
export type ActivityType =
  | 'request_created'
  | 'status_change'
  | 'assignment_change'
  | 'priority_change'
  | 'comment_added'
  | 'progress_update'
  | 'blocker_reported'
  | 'blocker_resolved';

/** A single entry in the activity timeline */
export interface ActivityEntry {
  id: string;
  request_id: string;
  request_internal_id?: string;
  request_title: string;
  actor_id: string | null;
  actor_name: string;
  team_id?: string;
  fiscal_year?: string;
  type: ActivityType;
  description: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}
