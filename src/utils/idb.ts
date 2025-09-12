import { get, set, del, clear, keys } from 'idb-keyval';
import type { WordItem, SettingsState } from '@/types';

/**
 * IndexedDB utility functions for data persistence
 */

const STORAGE_KEYS = {
  WORDS: 'polyglot_words',
  SETTINGS: 'polyglot_settings',
  QUEUE: 'polyglot_queue',
  LAST_EXPORT: 'polyglot_last_export',
} as const;

/**
 * Save words to IndexedDB
 */
export async function saveWords(words: WordItem[]): Promise<void> {
  try {
    // Create completely plain objects to avoid cloning issues
    const plainWords = words.map(word => ({
      id: String(word.id),
      lang_src: String(word.lang_src),
      lang_tgt: String(word.lang_tgt),
      text_src: String(word.text_src),
      text_tgt: String(word.text_tgt),
      times: Number(word.times),
      errors: Number(word.errors),
      last_review: word.last_review ? String(word.last_review) : undefined,
      spell_errors: Number(word.spell_errors),
      notes: word.notes ? String(word.notes) : undefined,
    }));
    
    await set(STORAGE_KEYS.WORDS, plainWords);
    console.log(`Saved ${words.length} words to IndexedDB`);
  } catch (error) {
    console.error('Failed to save words to IndexedDB:', error);
    throw new Error('Failed to save words');
  }
}

/**
 * Load words from IndexedDB
 */
export async function loadWords(): Promise<WordItem[]> {
  try {
    const words = await get<WordItem[]>(STORAGE_KEYS.WORDS);
    return words || [];
  } catch (error) {
    console.error('Failed to load words from IndexedDB:', error);
    return [];
  }
}

/**
 * Save settings to IndexedDB
 */
export async function saveSettings(settings: SettingsState): Promise<void> {
  try {
    // Create a completely plain object to avoid cloning issues
    const plainSettings = {
      ttsProvider: String(settings.ttsProvider),
      webVoices: { ...settings.webVoices }, // Ensure it's a plain object
      google: {
        apiKey: String(settings.google?.apiKey || ''),
      },
    };
    
    console.log('[DEBUG] Attempting to save plain settings:', plainSettings);
    await set(STORAGE_KEYS.SETTINGS, plainSettings);
    console.log('Settings saved to IndexedDB');
  } catch (error) {
    console.error('Failed to save settings to IndexedDB:', error);
    console.error('Settings that failed to save:', settings);
    throw new Error('Failed to save settings');
  }
}

/**
 * Load settings from IndexedDB
 */
export async function loadSettings(): Promise<Partial<SettingsState>> {
  try {
    const settings = await get<SettingsState>(STORAGE_KEYS.SETTINGS);
    return settings || {};
  } catch (error) {
    console.error('Failed to load settings from IndexedDB:', error);
    return {};
  }
}

/**
 * Save study queue to IndexedDB
 */
export async function saveQueue(queueIds: string[]): Promise<void> {
  try {
    await set(STORAGE_KEYS.QUEUE, queueIds);
    console.log(`Saved ${queueIds.length} items to study queue`);
  } catch (error) {
    console.error('Failed to save queue to IndexedDB:', error);
    throw new Error('Failed to save queue');
  }
}

/**
 * Load study queue from IndexedDB
 */
export async function loadQueue(): Promise<string[]> {
  try {
    const queue = await get<string[]>(STORAGE_KEYS.QUEUE);
    return queue || [];
  } catch (error) {
    console.error('Failed to load queue from IndexedDB:', error);
    return [];
  }
}

/**
 * Save last export timestamp
 */
export async function saveLastExport(timestamp: string): Promise<void> {
  try {
    await set(STORAGE_KEYS.LAST_EXPORT, timestamp);
  } catch (error) {
    console.error('Failed to save last export timestamp:', error);
  }
}

/**
 * Load last export timestamp
 */
export async function loadLastExport(): Promise<string | null> {
  try {
    const timestamp = await get<string>(STORAGE_KEYS.LAST_EXPORT);
    return timestamp || null;
  } catch (error) {
    console.error('Failed to load last export timestamp:', error);
    return null;
  }
}

/**
 * Clear all data from IndexedDB
 */
export async function clearAllData(): Promise<void> {
  try {
    await clear();
    console.log('All data cleared from IndexedDB');
  } catch (error) {
    console.error('Failed to clear IndexedDB:', error);
    throw new Error('Failed to clear data');
  }
}

/**
 * Get storage usage information
 */
export async function getStorageInfo(): Promise<{
  totalKeys: number;
  keys: string[];
  estimatedSize: number;
}> {
  try {
    const allKeys = await keys();
    const keyCount = allKeys.length;
    
    // Estimate size by sampling a few keys
    let estimatedSize = 0;
    const sampleSize = Math.min(5, keyCount);
    
    for (let i = 0; i < sampleSize; i++) {
      const key = allKeys[i];
      const value = await get(key);
      if (value) {
        estimatedSize += JSON.stringify(value).length;
      }
    }
    
    // Extrapolate to total size
    if (sampleSize > 0) {
      estimatedSize = Math.round((estimatedSize / sampleSize) * keyCount);
    }
    
    return {
      totalKeys: keyCount,
      keys: allKeys as string[],
      estimatedSize,
    };
  } catch (error) {
    console.error('Failed to get storage info:', error);
    return {
      totalKeys: 0,
      keys: [],
      estimatedSize: 0,
    };
  }
}

/**
 * Debug function to inspect stored words in IndexedDB
 */
export async function debugStoredWords(): Promise<{
  totalWords: number;
  uniqueRows: number;
  languagePairs: Record<string, number>;
  sampleWords: WordItem[];
}> {
  try {
    const words = await loadWords();
    const totalWords = words.length;
    
    // Count unique rows (by base ID)
    const uniqueRowIds = new Set(words.map(word => word.id.split('_')[0]));
    const uniqueRows = uniqueRowIds.size;
    
    // Count language pairs
    const languagePairs: Record<string, number> = {};
    words.forEach(word => {
      const pair = `${word.lang_src}→${word.lang_tgt}`;
      languagePairs[pair] = (languagePairs[pair] || 0) + 1;
    });
    
    // Get sample words (first 5)
    const sampleWords = words.slice(0, 5);
    
    console.log(`[DEBUG] IndexedDB contains:`);
    console.log(`- Total word items: ${totalWords}`);
    console.log(`- Unique rows: ${uniqueRows}`);
    console.log(`- Language pairs:`, languagePairs);
    console.log(`- Sample words:`, sampleWords);
    
    return {
      totalWords,
      uniqueRows,
      languagePairs,
      sampleWords,
    };
  } catch (error) {
    console.error('Failed to debug stored words:', error);
    return {
      totalWords: 0,
      uniqueRows: 0,
      languagePairs: {},
      sampleWords: [],
    };
  }
}

/**
 * Check if IndexedDB is available
 */
export function isIndexedDBAvailable(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

/**
 * Initialize IndexedDB and return availability status
 */
export async function initializeStorage(): Promise<{
  available: boolean;
  error?: string;
}> {
  if (!isIndexedDBAvailable()) {
    return {
      available: false,
      error: 'IndexedDB is not available in this browser',
    };
  }
  
  try {
    // Test write/read to ensure IndexedDB is working
    const testKey = 'polyglot_test';
    const testValue = { test: true, timestamp: Date.now() };
    
    await set(testKey, testValue);
    const retrieved = await get(testKey);
    
    if (!retrieved || retrieved.test !== true) {
      return {
        available: false,
        error: 'IndexedDB write/read test failed',
      };
    }
    
    // Clean up test data
    await del(testKey);
    
    return { available: true };
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
