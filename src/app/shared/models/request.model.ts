/** Request type: Incidencia (red), Mejora (blue), Proyecto (green) */
export type RequestType = 'incidencia' | 'mejora' | 'proyecto';

/** Lifecycle status of a request */
export type RequestStatus =
  | 'backlog'
  | 'prioritized'
  | 'in_progress'
  | 'done';

export interface Request {
  id: string;
  title: string;
  description: string;
  type: RequestType;
  status: RequestStatus;
  requester_id: string;
  developer_id: string | null;
  urgency: number; // 1-5
  importance: number; // 1-5
  complexity: number; // 1-5 (T-shirt: 1=XS .. 5=XL)
  priorityScore: number; // computed: (urgency + importance) weighted by complexity
  created_at: string;
  updated_at: string;
}

/** Create request payload (e.g. from submission form) */
export interface CreateRequestPayload {
  title: string;
  description: string;
  type: RequestType;
  urgency: number;
  importance: number;
  complexity: number;
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
