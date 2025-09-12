import type { WordItem, LearningPriorityComparator } from '@/types';

/**
 * Compare function for learning priority sorting
 * Priority order (high to low):
 * 1. times === 0 (unlearned first)
 * 2. errors descending (most errors first)
 * 3. last_review ascending (oldest first)
 */
export const compareByLearningPriority: LearningPriorityComparator = (a: WordItem, b: WordItem) => {
  // Unlearned items (times === 0) have highest priority
  const aUnlearned = a.times === 0 ? 0 : 1;
  const bUnlearned = b.times === 0 ? 0 : 1;
  
  if (aUnlearned !== bUnlearned) {
    return aUnlearned - bUnlearned;
  }
  
  // Then by errors (descending - most errors first)
  if (a.errors !== b.errors) {
    return b.errors - a.errors;
  }
  
  // Finally by last review date (ascending - oldest first)
  const aDate = new Date(a.last_review || 0).getTime();
  const bDate = new Date(b.last_review || 0).getTime();
  
  return aDate - bDate;
};

/**
 * Sort words by learning priority
 */
export function sortByLearningPriority(words: WordItem[]): WordItem[] {
  return [...words].sort(compareByLearningPriority);
}

/**
 * Get learning priority score for a word item
 * Lower score = higher priority
 */
export function getLearningPriorityScore(item: WordItem): number {
  const unlearnedScore = item.times === 0 ? 0 : 1000;
  const errorScore = -item.errors * 10; // Negative because more errors = higher priority
  const dateScore = new Date(item.last_review || 0).getTime() / 1000000; // Scale down
  
  return unlearnedScore + errorScore + dateScore;
}

/**
 * Check if a word item needs review
 */
export function needsReview(item: WordItem, daysThreshold: number = 7): boolean {
  if (item.times === 0) return true; // Never studied
  if (item.errors > 0) return true; // Has errors
  
  if (!item.last_review) return true; // No review date
  
  const lastReview = new Date(item.last_review);
  const daysSinceReview = (Date.now() - lastReview.getTime()) / (1000 * 60 * 60 * 24);
  
  return daysSinceReview >= daysThreshold;
}

/**
 * Calculate learning progress percentage
 */
export function calculateLearningProgress(item: WordItem): number {
  if (item.times === 0) return 0;
  
  const totalAttempts = item.times + item.errors;
  if (totalAttempts === 0) return 0;
  
  const successRate = item.times / totalAttempts;
  return Math.round(successRate * 100);
}
