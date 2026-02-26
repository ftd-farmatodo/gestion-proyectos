import type {
  TimeCriticalityKey,
  OperationalDisruptionKey,
  UserReachKey,
  BusinessImpactKey,
} from '../../../core/services/priority-inference.service';

export type WizardStep = 1 | 2 | 3 | 4;

export const SUBMISSION_STEPS: { num: WizardStep; labelKey: string }[] = [
  { num: 1, labelKey: 'submissions.stepType' },
  { num: 2, labelKey: 'submissions.stepInfo' },
  { num: 3, labelKey: 'submissions.stepContext' },
  { num: 4, labelKey: 'submissions.stepReview' },
];

export const URGENCY_OPTIONS = [
  { key: 'critical', value: 5, color: 'var(--magenta)', labelKey: 'submissions.urgencyCritical' },
  { key: 'high', value: 4, color: 'var(--orange)', labelKey: 'submissions.urgencyHigh' },
  { key: 'medium', value: 3, color: 'var(--primary-light)', labelKey: 'submissions.urgencyMedium' },
  { key: 'low', value: 1, color: 'var(--cool-gray)', labelKey: 'submissions.urgencyLow' },
];

export const IMPACT_OPTIONS = [
  { key: 'high', value: 5, color: 'var(--magenta)', labelKey: 'submissions.impactHigh' },
  { key: 'medium', value: 3, color: 'var(--orange)', labelKey: 'submissions.impactMedium' },
  { key: 'low', value: 1, color: 'var(--cool-gray)', labelKey: 'submissions.impactLow' },
];

export const TIME_CRITICALITY_OPTIONS: { value: TimeCriticalityKey; labelKey: string }[] = [
  { value: 'immediate', labelKey: 'submissions.infTimeImmediateLabel' },
  { value: 'this_week', labelKey: 'submissions.infTimeWeekLabel' },
  { value: 'this_month', labelKey: 'submissions.infTimeMonthLabel' },
  { value: 'planned', labelKey: 'submissions.infTimePlannedLabel' },
];

export const OPERATIONAL_DISRUPTION_OPTIONS: { value: OperationalDisruptionKey; labelKey: string }[] = [
  { value: 'blocked_no_workaround', labelKey: 'submissions.infDisruptionBlockedLabel' },
  { value: 'blocked_limited_workaround', labelKey: 'submissions.infDisruptionLimitedLabel' },
  { value: 'degraded', labelKey: 'submissions.infDisruptionDegradedLabel' },
  { value: 'minimal', labelKey: 'submissions.infDisruptionMinimalLabel' },
];

export const USER_REACH_OPTIONS: { value: UserReachKey; labelKey: string }[] = [
  { value: 'single_team', labelKey: 'submissions.infReachSingleLabel' },
  { value: 'multi_team', labelKey: 'submissions.infReachMultiLabel' },
  { value: 'whole_company', labelKey: 'submissions.infReachCompanyLabel' },
  { value: 'external_customer', labelKey: 'submissions.infReachExternalLabel' },
];

export const BUSINESS_IMPACT_OPTIONS: { value: BusinessImpactKey; labelKey: string }[] = [
  { value: 'support_no_risk', labelKey: 'submissions.infBizSupportLabel' },
  { value: 'important_moderate_risk', labelKey: 'submissions.infBizImportantLabel' },
  { value: 'core_high_risk', labelKey: 'submissions.infBizCoreLabel' },
  { value: 'mission_critical', labelKey: 'submissions.infBizMissionLabel' },
];
