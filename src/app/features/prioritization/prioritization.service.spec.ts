import { getQuadrantForRequest } from './prioritization.service';
import type { Request } from '../../shared/models/request.model';

function mockRequest(urgency: number, importance: number): Request {
  return {
    id: 'test-1',
    internal_id: 'TI-001',
    title: 'Test',
    description: '',
    type: 'mejora',
    status: 'pending',
    requester_id: 'u1',
    requester_name: 'User',
    requester_department: 'TI',
    developer_id: null,
    urgency,
    importance,
    complexity: 3,
    priorityScore: 0,
    comments: [],
    created_at: '',
    updated_at: '',
    team_id: 't1',
    fiscal_year: 'FY2025',
  };
}

describe('getQuadrantForRequest', () => {
  it('returns q1 when urgency >= 3 AND importance >= 3', () => {
    expect(getQuadrantForRequest(mockRequest(3, 3))).toBe('q1');
    expect(getQuadrantForRequest(mockRequest(3, 5))).toBe('q1');
    expect(getQuadrantForRequest(mockRequest(5, 3))).toBe('q1');
    expect(getQuadrantForRequest(mockRequest(5, 5))).toBe('q1');
  });

  it('returns q2 when urgency < 3 AND importance >= 3', () => {
    expect(getQuadrantForRequest(mockRequest(1, 3))).toBe('q2');
    expect(getQuadrantForRequest(mockRequest(2, 5))).toBe('q2');
    expect(getQuadrantForRequest(mockRequest(1, 5))).toBe('q2');
  });

  it('returns q3 when urgency >= 3 AND importance < 3', () => {
    expect(getQuadrantForRequest(mockRequest(3, 1))).toBe('q3');
    expect(getQuadrantForRequest(mockRequest(3, 2))).toBe('q3');
    expect(getQuadrantForRequest(mockRequest(5, 2))).toBe('q3');
  });

  it('returns q4 when urgency < 3 AND importance < 3', () => {
    expect(getQuadrantForRequest(mockRequest(1, 1))).toBe('q4');
    expect(getQuadrantForRequest(mockRequest(2, 2))).toBe('q4');
    expect(getQuadrantForRequest(mockRequest(1, 2))).toBe('q4');
    expect(getQuadrantForRequest(mockRequest(2, 1))).toBe('q4');
  });
});
