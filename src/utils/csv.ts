import Papa from 'papaparse';
import type { WordItem, WordRow, CsvResult, RawWordData, LanguageConfig, LanguageMapping } from '@/types';
import { generateWordId, isValidLanguageTag, extractLanguageCode, LANGUAGE_NAMES } from './normalize';

/**
 * CSV utility functions for import/export of word items
 */

/**
 * Extract available languages from CSV headers
 */
export function extractLanguagesFromHeaders(headers: string[]): string[] {
  return headers
    .filter(header => header.startsWith('word_'))
    .map(header => header.replace('word_', ''))
    .filter(lang => isValidLanguageTag(lang) || isValidLanguageTag(lang + '-US')); // Handle both 'en' and 'en-US' formats
}

/**
 * Create language mapping from column names to display names
 */
export function createLanguageMapping(headers: string[]): LanguageMapping {
  const mapping: LanguageMapping = {};
  
  headers
    .filter(header => header.startsWith('word_'))
    .forEach(header => {
      const langCode = header.replace('word_', '');
      const displayName = LANGUAGE_NAMES[langCode] || LANGUAGE_NAMES[langCode + '-US'] || langCode;
      mapping[header] = displayName;
    });
  
  return mapping;
}

/**
 * Parse CSV string and convert to WordRow array (stores rows together)
 */
export function parseCsvToWordRows(csvString: string): CsvResult<WordRow> {
  const errors: string[] = [];
  const validRows: WordRow[] = [];
  
  const parseResult = Papa.parse<RawWordData>(csvString, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });
  
  if (parseResult.errors.length > 0) {
    errors.push(...parseResult.errors.map(err => `Row ${err.row}: ${err.message}`));
  }
  
  const headers = parseResult.meta.fields || [];
  const wordColumns = headers.filter(header => header.startsWith('word_'));
  const languageMapping = createLanguageMapping(headers);
  
  if (wordColumns.length < 2) {
    errors.push('At least 2 language columns (word_*) are required');
    return { data: [], errors, meta: { fields: headers, totalRows: 0, validRows: 0 } };
  }
  
  // Process each row and create a single WordRow
  parseResult.data.forEach((row: RawWordData, index: number) => {
    try {
      const wordRow = validateAndConvertRowToWordRow(row, index + 1, wordColumns, languageMapping);
      if (wordRow) {
        validRows.push(wordRow);
      }
    } catch (error) {
      errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
  
  return {
    data: validRows,
    errors,
    meta: {
      fields: headers,
      totalRows: parseResult.data.length,
      validRows: validRows.length,
    },
  };
}

/**
 * Validate and convert a CSV row to a WordRow object
 */
function validateAndConvertRowToWordRow(
  row: RawWordData, 
  rowNumber: number, 
  wordColumns: string[], 
  languageMapping: LanguageMapping
): WordRow | null {
  const errors: string[] = [];
  
  // Required fields
  const id = row.id?.trim() || generateWordId();
  
  // Numeric fields with defaults
  const times = parseInt(row.times) || 0;
  const learned = parseInt(row.learned) || 0;
  const errors_count = parseInt(row.errors) || 0;
  const spellErrors = parseInt(row.spell_errors) || 0;
  const stars = isNaN(parseInt(row.stars)) ? 0 : parseInt(row.stars);
  
  // Date field
  const lastReview = row.last_review?.trim() || undefined;
  if (lastReview && isNaN(Date.parse(lastReview))) {
    errors.push(`Invalid last_review date format: ${lastReview}`);
  }
  
  // Notes field
  const notes = row.notes?.trim() || undefined;
  
  // Extract words for each language
  const words: Record<string, string> = {};
  let hasAtLeastTwoWords = false;
  
  wordColumns.forEach(column => {
    const text = row[column]?.trim();
    if (text) {
      const language = column.replace('word_', '');
      words[language] = text;
      if (Object.keys(words).length >= 2) {
        hasAtLeastTwoWords = true;
      }
    }
  });
  
  if (!hasAtLeastTwoWords) {
    errors.push('At least 2 languages must have text');
  }
  
  if (errors.length > 0) {
    throw new Error(errors.join('; '));
  }
  
  return {
    id,
    words,
    times,
    learned,
    errors: errors_count,
    last_review: lastReview,
    spell_errors: spellErrors,
    notes,
    stars,
    progress: {}, // Initialize empty progress tracking
  };
}

/**
 * Parse CSV with all languages and create multiple word items (legacy)
 */
export function parseCsvToWordsMultiLanguage(csvString: string, displayLanguages: string[]): CsvResult {
  const errors: string[] = [];
  const validWords: WordItem[] = [];
  
  const parseResult = Papa.parse<RawWordData>(csvString, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });
  
  if (parseResult.errors.length > 0) {
    errors.push(...parseResult.errors.map(err => `Row ${err.row}: ${err.message}`));
  }
  
  const headers = parseResult.meta.fields || [];
  const wordColumns = headers.filter(header => header.startsWith('word_'));
  const languageMapping = createLanguageMapping(headers);
  
  if (wordColumns.length < 2) {
    errors.push('At least 2 language columns (word_*) are required');
    return { data: [], errors, meta: { fields: headers, totalRows: 0, validRows: 0 } };
  }
  
  // Process each row and create word pairs for display languages
  parseResult.data.forEach((row: RawWordData, index: number) => {
    try {
      const rowWords = validateAndConvertRowMultiLanguage(row, index + 1, displayLanguages, languageMapping);
      validWords.push(...rowWords);
    } catch (error) {
      errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
  
  return {
    data: validWords,
    errors,
    meta: {
      fields: headers,
      totalRows: parseResult.data.length,
      validRows: validWords.length,
    },
  };
}

/**
 * Validate and convert a CSV row to multiple WordItem objects for different language pairs
 */
function validateAndConvertRowMultiLanguage(
  row: RawWordData, 
  rowNumber: number, 
  displayLanguages: string[], 
  languageMapping: LanguageMapping
): WordItem[] {
  const words: WordItem[] = [];
  const errors: string[] = [];
  
  // Required fields
  const id = row.id?.trim() || generateWordId();
  
  // Numeric fields with defaults
  const times = parseInt(row.times) || 0;
  const learned = parseInt(row.learned) || 0;
  const errors_count = parseInt(row.errors) || 0;
  const spellErrors = parseInt(row.spell_errors) || 0;
  const stars = isNaN(parseInt(row.stars)) ? 0 : parseInt(row.stars);
  
  // Date field
  const lastReview = row.last_review?.trim() || undefined;
  if (lastReview && isNaN(Date.parse(lastReview))) {
    errors.push(`Invalid last_review date format: ${lastReview}`);
  }
  
  // Notes field
  const notes = row.notes?.trim() || undefined;
  
  if (errors.length > 0) {
    throw new Error(errors.join('; '));
  }
  
  // Create word pairs for each combination of display languages
  for (let i = 0; i < displayLanguages.length; i++) {
    for (let j = 0; j < displayLanguages.length; j++) {
      if (i === j) continue; // Skip same language pairs
      
      const sourceLang = displayLanguages[i];
      const targetLang = displayLanguages[j];
      const sourceCol = `word_${sourceLang}`;
      const targetCol = `word_${targetLang}`;
      
      const sourceText = row[sourceCol]?.trim();
      const targetText = row[targetCol]?.trim();
      
      if (sourceText && targetText) {
        words.push({
          id: `${id}_${sourceLang}_${targetLang}`,
          lang_src: sourceLang,
          lang_tgt: targetLang,
          text_src: sourceText,
          text_tgt: targetText,
          times,
          errors: errors_count,
          last_review: lastReview,
          spell_errors: spellErrors,
          notes,
          stars,
        });
      }
    }
  }
  
  return words;
}

/**
 * Parse CSV string and convert to WordItem array with language configuration
 */
export function parseCsvToWordsWithConfig(csvString: string, config: LanguageConfig): CsvResult {
  const errors: string[] = [];
  const validWords: WordItem[] = [];
  
  const parseResult = Papa.parse<RawWordData>(csvString, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });
  
  if (parseResult.errors.length > 0) {
    errors.push(...parseResult.errors.map(err => `Row ${err.row}: ${err.message}`));
  }
  
  const expectedHeaders = ['id', 'times', 'errors', 'last_review', 'spell_errors', 'notes'];
  const actualHeaders = parseResult.meta.fields || [];
  
  // Check for required word columns
  const sourceWordCol = `word_${config.sourceLanguage}`;
  const targetWordCol = `word_${config.targetLanguage}`;
  
  if (!actualHeaders.includes(sourceWordCol)) {
    errors.push(`Missing required column: ${sourceWordCol}`);
  }
  if (!actualHeaders.includes(targetWordCol)) {
    errors.push(`Missing required column: ${targetWordCol}`);
  }
  
  // Check for missing standard headers
  const missingHeaders = expectedHeaders.filter(header => !actualHeaders.includes(header));
  if (missingHeaders.length > 0) {
    errors.push(`Missing required headers: ${missingHeaders.join(', ')}`);
  }
  
  // Process each row
  parseResult.data.forEach((row: RawWordData, index: number) => {
    try {
      const wordItem = validateAndConvertRowWithConfig(row, index + 1, config);
      if (wordItem) {
        validWords.push(wordItem);
      }
    } catch (error) {
      errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
  
  return {
    data: validWords,
    errors,
    meta: {
      fields: actualHeaders,
      totalRows: parseResult.data.length,
      validRows: validWords.length,
    },
  };
}

/**
 * Parse CSV string and convert to WordItem array (legacy format)
 */
export function parseCsvToWords(csvString: string): CsvResult {
  const errors: string[] = [];
  const validWords: WordItem[] = [];
  
  const parseResult = Papa.parse(csvString, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });
  
  if (parseResult.errors.length > 0) {
    errors.push(...parseResult.errors.map(err => `Row ${err.row}: ${err.message}`));
  }
  
  const expectedHeaders = ['id', 'lang_src', 'lang_tgt', 'text_src', 'text_tgt', 'times', 'errors', 'last_review', 'spell_errors', 'notes'];
  const actualHeaders = parseResult.meta.fields || [];
  
  // Check for missing headers
  const missingHeaders = expectedHeaders.filter(header => !actualHeaders.includes(header));
  if (missingHeaders.length > 0) {
    errors.push(`Missing required headers: ${missingHeaders.join(', ')}`);
  }
  
  // Process each row
  parseResult.data.forEach((row: any, index: number) => {
    try {
      const wordItem = validateAndConvertRow(row, index + 1);
      if (wordItem) {
        validWords.push(wordItem);
      }
    } catch (error) {
      errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
  
  return {
    data: validWords,
    errors,
    meta: {
      fields: actualHeaders,
      totalRows: parseResult.data.length,
      validRows: validWords.length,
    },
  };
}

/**
 * Validate and convert a CSV row to WordItem with language configuration
 */
function validateAndConvertRowWithConfig(row: RawWordData, rowNumber: number, config: LanguageConfig): WordItem | null {
  const errors: string[] = [];
  
  // Required fields
  const id = row.id?.trim() || generateWordId();
  const sourceWordCol = `word_${config.sourceLanguage}`;
  const targetWordCol = `word_${config.targetLanguage}`;
  const textSrc = row[sourceWordCol]?.trim();
  const textTgt = row[targetWordCol]?.trim();
  
  if (!textSrc) errors.push(`${sourceWordCol} is required`);
  if (!textTgt) errors.push(`${targetWordCol} is required`);
  
  // Numeric fields with defaults
  const times = parseInt(row.times) || 0;
  const learned = parseInt(row.learned) || 0;
  const errors_count = parseInt(row.errors) || 0;
  const spellErrors = parseInt(row.spell_errors) || 0;
  const stars = isNaN(parseInt(row.stars)) ? 0 : parseInt(row.stars);
  
  // Date field
  const lastReview = row.last_review?.trim() || undefined;
  if (lastReview && isNaN(Date.parse(lastReview))) {
    errors.push(`Invalid last_review date format: ${lastReview}`);
  }
  
  // Notes field
  const notes = row.notes?.trim() || undefined;
  
  if (errors.length > 0) {
    throw new Error(errors.join('; '));
  }
  
  return {
    id,
    lang_src: config.sourceLanguage,
    lang_tgt: config.targetLanguage,
    text_src: textSrc,
    text_tgt: textTgt,
    times,
    errors: errors_count,
    last_review: lastReview,
    spell_errors: spellErrors,
    notes,
    stars,
  };
}

/**
 * Validate and convert a CSV row to WordItem (legacy format)
 */
function validateAndConvertRow(row: any, rowNumber: number): WordItem | null {
  const errors: string[] = [];
  
  // Required fields
  const id = row.id?.trim() || generateWordId();
  const langSrc = row.lang_src?.trim();
  const langTgt = row.lang_tgt?.trim();
  const textSrc = row.text_src?.trim();
  const textTgt = row.text_tgt?.trim();
  
  if (!langSrc) errors.push('lang_src is required');
  if (!langTgt) errors.push('lang_tgt is required');
  if (!textSrc) errors.push('text_src is required');
  if (!textTgt) errors.push('text_tgt is required');
  
  // Validate language codes
  if (langSrc && !isValidLanguageTag(langSrc)) {
    errors.push(`Invalid lang_src format: ${langSrc}`);
  }
  if (langTgt && !isValidLanguageTag(langTgt)) {
    errors.push(`Invalid lang_tgt format: ${langTgt}`);
  }
  
  // Numeric fields with defaults
  const times = parseInt(row.times) || 0;
  const learned = parseInt(row.learned) || 0;
  const errors_count = parseInt(row.errors) || 0;
  const spellErrors = parseInt(row.spell_errors) || 0;
  const stars = isNaN(parseInt(row.stars)) ? 0 : parseInt(row.stars);
  
  // Date field
  const lastReview = row.last_review?.trim() || undefined;
  if (lastReview && isNaN(Date.parse(lastReview))) {
    errors.push(`Invalid last_review date format: ${lastReview}`);
  }
  
  // Notes field
  const notes = row.notes?.trim() || undefined;
  
  if (errors.length > 0) {
    throw new Error(errors.join('; '));
  }
  
  return {
    id,
    lang_src: langSrc,
    lang_tgt: langTgt,
    text_src: textSrc,
    text_tgt: textTgt,
    times,
    errors: errors_count,
    last_review: lastReview,
    spell_errors: spellErrors,
    notes,
    stars,
  };
}

/**
 * Convert WordItem array to CSV string
 */
export function convertWordsToCsv(words: WordItem[]): string {
  const csvData = words.map(word => ({
    id: word.id,
    lang_src: word.lang_src,
    lang_tgt: word.lang_tgt,
    text_src: word.text_src,
    text_tgt: word.text_tgt,
    times: word.times,
    learned: 0, // Default value for legacy format
    errors: word.errors,
    last_review: word.last_review || '',
    spell_errors: word.spell_errors,
    notes: word.notes || '',
    stars: word.stars,
  }));
  
  return Papa.unparse(csvData, {
    header: true,
    delimiter: ',',
  });
}

/**
 * Download CSV file
 */
export function downloadCsv(csvContent: string, filename: string = 'words.csv'): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Generate language pairs on-demand from WordRow data for specific source/target languages
 */
export function generateLanguagePairs(
  rows: WordRow[], 
  sourceLanguage: string, 
  targetLanguage: string
): WordItem[] {
  const wordItems: WordItem[] = [];
  
  rows.forEach(row => {
    const sourceText = row.words[sourceLanguage];
    const targetText = row.words[targetLanguage];
    
    if (sourceText && targetText) {
      wordItems.push({
        id: `${row.id}_${sourceLanguage}_${targetLanguage}`,
        lang_src: sourceLanguage,
        lang_tgt: targetLanguage,
        text_src: sourceText,
        text_tgt: targetText,
        times: row.times,
        errors: row.errors,
        last_review: row.last_review,
        spell_errors: row.spell_errors,
        notes: row.notes,
        stars: row.stars,
      });
    }
  });
  
  return wordItems;
}

/**
 * Get all available language pairs from WordRow data
 */
export function getAllLanguagePairs(rows: WordRow[]): { source: string; target: string }[] {
  const pairs: { source: string; target: string }[] = [];
  const allLanguages = new Set<string>();
  
  // Collect all languages from all rows
  rows.forEach(row => {
    Object.keys(row.words).forEach(lang => allLanguages.add(lang));
  });
  
  // Generate all possible pairs
  const languages = Array.from(allLanguages);
  for (let i = 0; i < languages.length; i++) {
    for (let j = 0; j < languages.length; j++) {
      if (i !== j) {
        pairs.push({
          source: languages[i],
          target: languages[j]
        });
      }
    }
  }
  
  return pairs;
}

/**
 * Read CSV file from input element
 */
export function readCsvFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        resolve(content);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsText(file, 'utf-8');
  });
}

/**
 * Validate CSV file before import
 */
export function validateCsvFile(file: File): Promise<{ valid: boolean; errors: string[] }> {
  return new Promise((resolve) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      resolve({ valid: false, errors: ['File must be a CSV file'] });
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      resolve({ valid: false, errors: ['File size must be less than 10MB'] });
      return;
    }
    
    readCsvFile(file)
      .then(content => {
        const result = parseCsvToWords(content);
        resolve({
          valid: result.errors.length === 0,
          errors: result.errors,
        });
      })
      .catch(() => {
        resolve({ valid: false, errors: ['Failed to read file'] });
      });
  });
}

/**
 * Detect CSV format and extract available languages
 */
export function detectCsvFormat(csvString: string): { 
  format: 'legacy' | 'new' | 'unknown';
  availableLanguages: string[];
  headers: string[];
} {
  const parseResult = Papa.parse(csvString, {
    header: true,
    skipEmptyLines: true,
    preview: 1, // Only parse first row to get headers
  });
  
  const headers = parseResult.meta.fields || [];
  
  // Check for legacy format (lang_src, lang_tgt)
  if (headers.includes('lang_src') && headers.includes('lang_tgt')) {
    return {
      format: 'legacy',
      availableLanguages: [],
      headers,
    };
  }
  
  // Check for new format (word_{language})
  const wordColumns = headers.filter(header => header.startsWith('word_'));
  if (wordColumns.length >= 2) {
    const languages = extractLanguagesFromHeaders(headers);
    return {
      format: 'new',
      availableLanguages: languages,
      headers,
    };
  }
  
  return {
    format: 'unknown',
    availableLanguages: [],
    headers,
  };
}

/**
 * Generate example CSV content (new format)
 */
export function generateExampleCsvNewFormat(): string {
  const exampleData = [
    {
      id: '1',
      word_en: 'hello',
      word_fr: 'bonjour',
      word_zh: '你好',
      times: 0,
      learned: 0,
      errors: 0,
      last_review: '',
      spell_errors: 0,
      notes: '',
      stars: 0,
    },
    {
      id: '2',
      word_en: 'thank you',
      word_fr: 'merci',
      word_zh: '谢谢',
      times: 0,
      learned: 0,
      errors: 0,
      last_review: '',
      spell_errors: 0,
      notes: '',
      stars: 0,
    },
    {
      id: '3',
      word_en: 'where',
      word_fr: 'où',
      word_zh: '哪里',
      times: 0,
      learned: 0,
      errors: 0,
      last_review: '',
      spell_errors: 0,
      notes: '',
      stars: 0,
    },
  ];
  
  return Papa.unparse(exampleData, {
    header: true,
    delimiter: ',',
  });
}

/**
 * Generate example CSV content (legacy format)
 */
export function generateExampleCsv(): string {
  const exampleWords: WordItem[] = [
    {
      id: '1',
      lang_src: 'en-US',
      lang_tgt: 'fr-FR',
      text_src: 'hello',
      text_tgt: 'bonjour',
      times: 0,
      errors: 0,
      last_review: '',
      spell_errors: 0,
      notes: '',
      stars: 0,
    },
    {
      id: '2',
      lang_src: 'en-US',
      lang_tgt: 'fr-FR',
      text_src: 'thank you',
      text_tgt: 'merci',
      times: 0,
      errors: 0,
      last_review: '',
      spell_errors: 0,
      notes: '',
      stars: 0,
    },
    {
      id: '3',
      lang_src: 'en-US',
      lang_tgt: 'zh-CN',
      text_src: 'where',
      text_tgt: '哪里',
      times: 0,
      errors: 0,
      last_review: '',
      spell_errors: 0,
      notes: '',
      stars: 0,
    },
  ];
  
  return convertWordsToCsv(exampleWords);
}
