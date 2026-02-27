import type { Objective, RequestAssignee } from '../../shared/models/request.model';

describe('ObjectiveStore mapping logic', () => {
  const objectives: Objective[] = [
    {
      id: 'obj-1',
      team_id: 'team-ti',
      year: 2026,
      code: 'OBJ-01',
      title: 'Reduce incidents',
      is_active: true,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
    {
      id: 'obj-2',
      team_id: 'team-ti',
      year: 2026,
      code: 'OBJ-02',
      title: 'Improve CI/CD',
      is_active: true,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
  ];

  const requestObjectives = [
    { request_id: 'req-1', objective_id: 'obj-1' },
    { request_id: 'req-1', objective_id: 'obj-2' },
    { request_id: 'req-2', objective_id: 'obj-1' },
  ];

  const requestAssignees: RequestAssignee[] = [
    { request_id: 'req-1', developer_id: 'dev-a', assigned_at: '2026-01-01', assigned_by: null },
    { request_id: 'req-1', developer_id: 'dev-b', assigned_at: '2026-01-01', assigned_by: null },
    { request_id: 'req-2', developer_id: 'dev-a', assigned_at: '2026-01-01', assigned_by: null },
  ];

  function getObjectivesByRequestId(requestId: string): Objective[] {
    const ids = requestObjectives
      .filter((ro) => ro.request_id === requestId)
      .map((ro) => ro.objective_id);
    return objectives.filter((o) => ids.includes(o.id));
  }

  function getAssigneesByRequestId(requestId: string): RequestAssignee[] {
    return requestAssignees.filter((ra) => ra.request_id === requestId);
  }

  function getRequestIdsByObjective(objectiveId: string): string[] {
    return requestObjectives
      .filter((ro) => ro.objective_id === objectiveId)
      .map((ro) => ro.request_id);
  }

  it('returns correct objectives for a request', () => {
    const objs = getObjectivesByRequestId('req-1');
    expect(objs.length).toBe(2);
    expect(objs.map((o) => o.code)).toEqual(['OBJ-01', 'OBJ-02']);
  });

  it('returns empty for a request with no objectives', () => {
    expect(getObjectivesByRequestId('req-999').length).toBe(0);
  });

  it('returns correct assignees for a request', () => {
    const assignees = getAssigneesByRequestId('req-1');
    expect(assignees.length).toBe(2);
    expect(assignees.map((a) => a.developer_id).sort()).toEqual(['dev-a', 'dev-b']);
  });

  it('returns empty for a request with no assignees', () => {
    expect(getAssigneesByRequestId('req-999').length).toBe(0);
  });

  it('returns correct request IDs linked to an objective', () => {
    const reqIds = getRequestIdsByObjective('obj-1');
    expect(reqIds.length).toBe(2);
    expect(reqIds.sort()).toEqual(['req-1', 'req-2']);
  });

  it('returns empty for an objective with no linked requests', () => {
    expect(getRequestIdsByObjective('obj-999').length).toBe(0);
  });
});

describe('In-progress gate validation', () => {
  function canTransitionToInProgress(
    hasObjectives: boolean,
    hasAssignees: boolean
  ): { allowed: boolean; reason?: string } {
    if (!hasObjectives && !hasAssignees) {
      return { allowed: false, reason: 'Missing objective and assignees' };
    }
    if (!hasObjectives) {
      return { allowed: false, reason: 'Missing objective' };
    }
    if (!hasAssignees) {
      return { allowed: false, reason: 'Missing assignees' };
    }
    return { allowed: true };
  }

  it('blocks when both objective and assignees are missing', () => {
    const result = canTransitionToInProgress(false, false);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('objective');
  });

  it('blocks when only objective is missing', () => {
    const result = canTransitionToInProgress(false, true);
    expect(result.allowed).toBe(false);
  });

  it('blocks when only assignees are missing', () => {
    const result = canTransitionToInProgress(true, false);
    expect(result.allowed).toBe(false);
  });

  it('allows when both objective and assignees are present', () => {
    const result = canTransitionToInProgress(true, true);
    expect(result.allowed).toBe(true);
    expect(result.reason).toBeUndefined();
  });
});
