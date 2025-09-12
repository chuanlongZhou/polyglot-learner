/**
 * Multi-language word row - stores all translations together
 */
export interface WordRow {
  id: string;
  words: Record<string, string>; // language -> text mapping (e.g., { "en": "hello", "fr": "bonjour" })
  times: number;
  errors: number;
  last_review?: string; // ISO string or empty
  spell_errors: number;
  notes?: string;
  stars: number; // Star rating from 0-5 (0 means no stars)
  // Learning progress per language pair
  progress: Record<string, {
    times: number;
    errors: number;
    last_review?: string;
  }>; // "en-fr" -> progress data
}

/**
 * Legacy word item for backward compatibility
 */
export interface WordItem {
  id: string;
  lang_src: string;
  lang_tgt: string;
  text_src: string;
  text_tgt: string;
  times: number;
  errors: number;
  last_review?: string; // ISO string or empty
  spell_errors: number;
  notes?: string;
  stars: number; // Star rating from 0-5 (0 means no stars)
}

/**
 * Raw CSV word data with language-specific columns
 */
export interface RawWordData {
  id: string;
  [key: string]: string; // word_{language} columns
  times: string;
  errors: string;
  last_review: string;
  spell_errors: string;
  notes: string;
  stars: string; // Star rating as string from CSV
}

/**
 * Language configuration for CSV import
 */
export interface LanguageConfig {
  sourceLanguage: string;
  targetLanguage: string;
  availableLanguages: string[];
  displayLanguages: string[]; // Languages to display in the table
}

/**
 * Language mapping for column names to major languages
 */
export interface LanguageMapping {
  [columnName: string]: string; // word_en -> English, word_fr -> French, etc.
}

/**
 * Grouped word data for table display (now just wraps WordRow)
 */
export interface GroupedWord {
  id: string;
  wordRow: WordRow;
  errors: number;
  last_review?: string;
  notes?: string;
}

/**
 * Filter interface for the List View
 */
export interface Filters {
  languages: {
    src: string[];
    tgt: string[];
  };
  errorRange: {
    min: number;
    max: number;
  };
  dateRange: {
    from: string | null;
    to: string | null;
  };
  keyword: string;
}

/**
 * TTS Provider types
 */
export type TtsProvider = 'WebSpeech';

/**
 * Voice information for TTS
 */
export interface VoiceInfo {
  name: string;
  lang: string;
  id: string;
}

/**
 * TTS Engine interface
 */
export interface TtsEngine {
  listVoices(lang?: string): Promise<VoiceInfo[]>;
  speak(text: string, lang: string, voiceId?: string): Promise<void>;
  cancel(): void;
  isSpeaking(): boolean;
}

/**
 * Google Cloud TTS configuration
 */
export interface GoogleTtsConfig {
  apiKey: string;
}

/**
 * Web Speech voices mapping
 */
export type WebVoices = Record<string, string>; // lang -> voiceId

/**
 * Settings store state
 */
export interface SettingsState {
  ttsProvider: TtsProvider;
  webVoices: WebVoices;
  google: GoogleTtsConfig;
}

/**
 * CSV import/export result
 */
export interface CsvResult<T = WordItem> {
  data: T[];
  errors: string[];
  meta: {
    fields: string[];
    totalRows: number;
    validRows: number;
  };
}

/**
 * Learning priority comparison function type
 */
export type LearningPriorityComparator = (a: WordItem, b: WordItem) => number;

/**
 * Study queue item
 */
export interface QueueItem {
  id: string;
  wordItem: WordItem;
  addedAt: string; // ISO timestamp
}

/**
 * Statistics data for charts
 */
export interface StatsData {
  totalWords: number;
  learnedWords: number;
  errorRate: number;
  languageDistribution: Record<string, number>;
  learningProgress: Array<{
    date: string;
    learned: number;
    errors: number;
  }>;
}
