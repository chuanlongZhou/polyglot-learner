/**
 * Text normalization utilities for spelling checks and text processing
 */

/**
 * Normalize text for comparison (remove accents, convert to lowercase, etc.)
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Check if two texts are similar (for spelling error detection)
 */
export function isSimilarText(text1: string, text2: string, threshold: number = 0.8): boolean {
  const normalized1 = normalizeText(text1);
  const normalized2 = normalizeText(text2);
  
  if (normalized1 === normalized2) return true;
  
  const similarity = calculateSimilarity(normalized1, normalized2);
  return similarity >= threshold;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }
  
  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Calculate similarity ratio between two strings (0-1)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1;
  
  const distance = levenshteinDistance(str1, str2);
  return (maxLength - distance) / maxLength;
}

/**
 * Extract language code from BCP-47 language tag
 */
export function extractLanguageCode(langTag: string): string {
  return langTag.split('-')[0];
}

/**
 * Validate BCP-47 language tag format
 */
export function isValidLanguageTag(tag: string): boolean {
  const bcp47Regex = /^[a-z]{2,3}(-[A-Z]{2})?(-[a-z0-9]{5,8})?(-[a-z0-9]{1,8})?(-[a-z0-9]{1,8})?$/i;
  return bcp47Regex.test(tag);
}

/**
 * Get common language names for display
 */
export const LANGUAGE_NAMES: Record<string, string> = {
  'en': 'English',
  'en-US': 'English (US)',
  'en-GB': 'English (UK)',
  'fr': 'French',
  'fr-FR': 'French (France)',
  'fr-CA': 'French (Canada)',
  'es': 'Spanish',
  'es-ES': 'Spanish (Spain)',
  'es-MX': 'Spanish (Mexico)',
  'de': 'German',
  'de-DE': 'German (Germany)',
  'it': 'Italian',
  'it-IT': 'Italian (Italy)',
  'pt': 'Portuguese',
  'pt-PT': 'Portuguese (Portugal)',
  'pt-BR': 'Portuguese (Brazil)',
  'ru': 'Russian',
  'ru-RU': 'Russian (Russia)',
  'ja': 'Japanese',
  'ja-JP': 'Japanese (Japan)',
  'ko': 'Korean',
  'ko-KR': 'Korean (Korea)',
  'zh': 'Chinese',
  'zh-CN': 'Chinese (Simplified)',
  'zh-TW': 'Chinese (Traditional)',
  'ar': 'Arabic',
  'ar-SA': 'Arabic (Saudi Arabia)',
  'hi': 'Hindi',
  'hi-IN': 'Hindi (India)',
  'th': 'Thai',
  'th-TH': 'Thai (Thailand)',
  'vi': 'Vietnamese',
  'vi-VN': 'Vietnamese (Vietnam)',
};

/**
 * Get display name for a language code
 */
export function getLanguageDisplayName(langCode: string): string {
  return LANGUAGE_NAMES[langCode] || langCode;
}

/**
 * Generate a unique ID for word items
 */
export function generateWordId(): string {
  return crypto.randomUUID();
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString();
}

/**
 * Format date for ISO string storage
 */
export function formatDateISO(date: Date = new Date()): string {
  return date.toISOString();
}
