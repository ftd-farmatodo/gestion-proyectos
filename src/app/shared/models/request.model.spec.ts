import { calculatePriorityScore } from './request.model';

describe('calculatePriorityScore', () => {
  it('returns high score for high urgency + high importance + low complexity', () => {
    const score = calculatePriorityScore(5, 5, 1);
    // (5+5) * (6-1) / 5 = 10 * 5 / 5 = 10
    expect(score).toBe(10);
  });

  it('returns moderate score for high urgency + high importance + high complexity', () => {
    const score = calculatePriorityScore(5, 5, 5);
    // (5+5) * (6-5) / 5 = 10 * 1 / 5 = 2 — complexity reduces score
    expect(score).toBe(2);
  });

  it('returns low score for low urgency + low importance + high complexity', () => {
    const score = calculatePriorityScore(1, 1, 5);
    // (1+1) * (6-5) / 5 = 2 * 1 / 5 = 0.4
    expect(score).toBe(0.4);
  });

  it('clamps complexity to 1-5 when out of bounds', () => {
    const score = calculatePriorityScore(5, 5, 0);
    // complexity 0 clamped to 1: (5+5) * (6-1) / 5 = 10
    expect(score).toBe(10);

    const scoreHigh = calculatePriorityScore(5, 5, 10);
    // complexity 10 clamped to 5: (5+5) * (6-5) / 5 = 2
    expect(scoreHigh).toBe(2);
  });

  it('returns correct rounded value for boundary inputs', () => {
    const score = calculatePriorityScore(3, 3, 3);
    // (3+3) * (6-3) / 5 = 6 * 3 / 5 = 3.6
    expect(score).toBe(3.6);
  });

  it('rounds to 2 decimal places', () => {
    const score = calculatePriorityScore(2, 3, 4);
    // (2+3) * (6-4) / 5 = 5 * 2 / 5 = 2
    expect(score).toBe(2);
  });
});
