import { Pipe, PipeTransform } from '@angular/core';
import { COMPLEXITY_WEIGHTS } from '../models/request.model';

/**
 * Computes priority score from urgency, importance and complexity.
 * Formula: ((urgency + importance) / 2) * complexityWeight
 */
@Pipe({ name: 'priorityScore', standalone: true })
export class PriorityScorePipe implements PipeTransform {
  transform(urgency: number, importance: number, complexity: number): number {
    const weight = COMPLEXITY_WEIGHTS[complexity] ?? 0.7;
    return Math.round(((urgency + importance) / 2) * weight * 100) / 100;
  }
}
