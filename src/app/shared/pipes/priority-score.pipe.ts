import { Pipe, PipeTransform } from '@angular/core';
import { calculatePriorityScore } from '../models/request.model';

/**
 * Computes priority score from urgency, importance and complexity.
 * Formula aligned with DB trigger:
 * (urgency + importance) * (6 - complexity) / 5
 */
@Pipe({ name: 'priorityScore', standalone: true })
export class PriorityScorePipe implements PipeTransform {
  transform(urgency: number, importance: number, complexity: number): number {
    return calculatePriorityScore(urgency, importance, complexity);
  }
}
