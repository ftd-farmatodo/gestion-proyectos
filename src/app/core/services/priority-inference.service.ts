import { Injectable } from '@angular/core';

export type TimeCriticalityKey = 'immediate' | 'this_week' | 'this_month' | 'planned';
export type OperationalDisruptionKey = 'blocked_no_workaround' | 'blocked_limited_workaround' | 'degraded' | 'minimal';
export type UserReachKey = 'single_team' | 'multi_team' | 'whole_company' | 'external_customer';
export type BusinessImpactKey = 'support_no_risk' | 'important_moderate_risk' | 'core_high_risk' | 'mission_critical';

export interface PriorityInferenceAnswers {
  timeCriticality: TimeCriticalityKey;
  operationalDisruption: OperationalDisruptionKey;
  userReach: UserReachKey;
  businessImpact: BusinessImpactKey;
}

export interface PriorityInferenceResult {
  urgency: number;
  importance: number;
  urgencyScore: number;
  importanceScore: number;
}

const SCORES = {
  timeCriticality: {
    immediate: 100,
    this_week: 72,
    this_month: 40,
    planned: 12,
  } as Record<TimeCriticalityKey, number>,

  operationalDisruption: {
    blocked_no_workaround: 100,
    blocked_limited_workaround: 70,
    degraded: 40,
    minimal: 12,
  } as Record<OperationalDisruptionKey, number>,

  userReach: {
    single_team: 20,
    multi_team: 50,
    whole_company: 78,
    external_customer: 100,
  } as Record<UserReachKey, number>,

  businessImpact: {
    support_no_risk: 15,
    important_moderate_risk: 48,
    core_high_risk: 80,
    mission_critical: 100,
  } as Record<BusinessImpactKey, number>,
};

const WEIGHTS = {
  urgency: { timeCriticality: 0.5, operationalDisruption: 0.5 },
  importance: { userReach: 0.45, businessImpact: 0.55 },
};

@Injectable({ providedIn: 'root' })
export class PriorityInferenceService {
  infer(answers: PriorityInferenceAnswers): PriorityInferenceResult {
    const urgencyScore =
      SCORES.timeCriticality[answers.timeCriticality] * WEIGHTS.urgency.timeCriticality +
      SCORES.operationalDisruption[answers.operationalDisruption] * WEIGHTS.urgency.operationalDisruption;

    const importanceScore =
      SCORES.userReach[answers.userReach] * WEIGHTS.importance.userReach +
      SCORES.businessImpact[answers.businessImpact] * WEIGHTS.importance.businessImpact;

    return {
      urgency: this.toScale5(urgencyScore),
      importance: this.toScale5(importanceScore),
      urgencyScore: Math.round(urgencyScore),
      importanceScore: Math.round(importanceScore),
    };
  }

  private toScale5(score0to100: number): number {
    if (score0to100 >= 85) return 5;
    if (score0to100 >= 65) return 4;
    if (score0to100 >= 45) return 3;
    if (score0to100 >= 25) return 2;
    return 1;
  }
}
