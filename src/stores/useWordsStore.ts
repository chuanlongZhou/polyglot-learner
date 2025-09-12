import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { WordItem, WordRow, Filters } from '@/types';
import { sortByLearningPriority } from '@/utils/learning';
import { parseCsvToWords, parseCsvToWordRows, convertWordsToCsv, generateLanguagePairs, getAllLanguagePairs } from '@/utils/csv';
import { saveWords, loadWords } from '@/utils/idb';

/**
 * Words store for managing word items and CSV operations
 */
export const useWordsStore = defineStore('words', () => {
  // State
  const rows = ref<WordRow[]>([]);
  const dirty = ref(false);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const totalWords = computed(() => rows.value.length);
  
  const learnedWords = computed(() => 
    rows.value.filter(row => row.times > 0).length
  );
  
  const errorRate = computed(() => {
    const totalAttempts = rows.value.reduce((sum, row) => sum + row.times + row.errors, 0);
    const totalErrors = rows.value.reduce((sum, row) => sum + row.errors, 0);
    return totalAttempts > 0 ? (totalErrors / totalAttempts) * 100 : 0;
  });

  const languageDistribution = computed(() => {
    const distribution: Record<string, number> = {};
    rows.value.forEach(row => {
      // Count each language in the row
      Object.keys(row.words).forEach(lang => {
        distribution[lang] = (distribution[lang] || 0) + 1;
      });
    });
    return distribution;
  });

  // Actions
  async function loadFromCsv(csv: string): Promise<{ success: boolean; errors: string[] }> {
    loading.value = true;
    error.value = null;
    
    try {
      const result = parseCsvToWordRows(csv);
      
      if (result.errors.length > 0) {
        return { success: false, errors: result.errors };
      }
      
      rows.value = result.data;
      dirty.value = true;
      
      // Persist to IndexedDB
      await persist();
      
      return { success: true, errors: [] };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      error.value = errorMessage;
      return { success: false, errors: [errorMessage] };
    } finally {
      loading.value = false;
    }
  }

  function exportCsv(): string {
    // Convert WordRow back to WordItem format for export
    const wordItems: WordItem[] = [];
    rows.value.forEach(row => {
      const languages = Object.keys(row.words);
      // Create word pairs for each combination
      for (let i = 0; i < languages.length; i++) {
        for (let j = 0; j < languages.length; j++) {
          if (i !== j) {
            const srcLang = languages[i];
            const tgtLang = languages[j];
            wordItems.push({
              id: `${row.id}_${srcLang}_${tgtLang}`,
              lang_src: srcLang,
              lang_tgt: tgtLang,
              text_src: row.words[srcLang],
              text_tgt: row.words[tgtLang],
              times: row.times,
              errors: row.errors,
              last_review: row.last_review,
              spell_errors: row.spell_errors,
              notes: row.notes,
              stars: row.stars,
            });
          }
        }
      }
    });
    return convertWordsToCsv(wordItems);
  }

  function addRow(row: WordRow): void {
    rows.value.push(row);
    dirty.value = true;
    // Don't await persist() to avoid blocking the UI
    persist().catch(err => {
      console.error('Failed to persist after adding row:', err);
    });
  }

  function updateRow(id: string, patch: Partial<WordRow>): void {
    const index = rows.value.findIndex(row => row.id === id);
    if (index !== -1) {
      rows.value[index] = { ...rows.value[index], ...patch };
      dirty.value = true;
      persist().catch(err => {
        console.error('Failed to persist after updating row:', err);
      });
    }
  }

  function deleteRow(id: string): void {
    const index = rows.value.findIndex(row => row.id === id);
    if (index !== -1) {
      rows.value.splice(index, 1);
      dirty.value = true;
      persist().catch(err => {
        console.error('Failed to persist after deleting row:', err);
      });
    }
  }

  // Legacy functions for backward compatibility
  function addItem(item: WordItem): void {
    // Convert WordItem to WordRow if needed
    const existingRow = rows.value.find(row => row.id === item.id.split('_')[0]);
    if (existingRow) {
      // Add to existing row
      existingRow.words[item.lang_src] = item.text_src;
      existingRow.words[item.lang_tgt] = item.text_tgt;
      dirty.value = true;
    } else {
      // Create new row
      const newRow: WordRow = {
        id: item.id.split('_')[0],
        words: {
          [item.lang_src]: item.text_src,
          [item.lang_tgt]: item.text_tgt,
        },
        times: item.times,
        errors: item.errors,
        last_review: item.last_review,
        spell_errors: item.spell_errors,
        notes: item.notes,
        stars: item.stars,
        progress: {},
      };
      addRow(newRow);
    }
  }

  function updateItem(id: string, patch: Partial<WordItem>): void {
    const baseId = id.split('_')[0];
    const row = rows.value.find(row => row.id === baseId);
    if (row) {
      if (patch.times !== undefined) row.times = patch.times;
      if (patch.errors !== undefined) row.errors = patch.errors;
      if (patch.last_review !== undefined) row.last_review = patch.last_review;
      if (patch.spell_errors !== undefined) row.spell_errors = patch.spell_errors;
      if (patch.notes !== undefined) row.notes = patch.notes;
      dirty.value = true;
      persist().catch(err => {
        console.error('Failed to persist after updating item:', err);
      });
    }
  }

  function deleteItem(id: string): void {
    const baseId = id.split('_')[0];
    deleteRow(baseId);
  }

  function bulkAddItems(newItems: WordItem[]): void {
    newItems.forEach(item => {
      items.value.push(item);
    });
    dirty.value = true;
    // Only persist once for the entire batch
    persist().catch(err => {
      console.error('Failed to persist after bulk adding items:', err);
    });
  }

  function bulkAddToQueue(ids: string[]): void {
    // This will be handled by the queue store
    // We just mark as dirty here
    dirty.value = true;
  }

  function filtered(filters: Filters): WordItem[] {
    let filtered = [...items.value];

    // Language filters
    if (filters.languages.src.length > 0) {
      filtered = filtered.filter(item => filters.languages.src.includes(item.lang_src));
    }
    if (filters.languages.tgt.length > 0) {
      filtered = filtered.filter(item => filters.languages.tgt.includes(item.lang_tgt));
    }

    // Error range filter
    filtered = filtered.filter(item => 
      item.errors >= filters.errorRange.min && 
      item.errors <= filters.errorRange.max
    );

    // Date range filter
    if (filters.dateRange.from) {
      filtered = filtered.filter(item => {
        if (!item.last_review) return false;
        return new Date(item.last_review) >= new Date(filters.dateRange.from!);
      });
    }
    if (filters.dateRange.to) {
      filtered = filtered.filter(item => {
        if (!item.last_review) return true;
        return new Date(item.last_review) <= new Date(filters.dateRange.to!);
      });
    }

    // Keyword filter
    if (filters.keyword.trim()) {
      const keyword = filters.keyword.toLowerCase();
      filtered = filtered.filter(item => 
        item.text_src.toLowerCase().includes(keyword) ||
        item.text_tgt.toLowerCase().includes(keyword) ||
        (item.notes && item.notes.toLowerCase().includes(keyword))
      );
    }

    return filtered;
  }

  function getSortedByPriority(): WordItem[] {
    return sortByLearningPriority(items.value);
  }

  function getWordsNeedingReview(daysThreshold: number = 7): WordItem[] {
    return items.value.filter(item => {
      if (item.times === 0) return true; // Never studied
      if (item.errors > 0) return true; // Has errors
      
      if (!item.last_review) return true; // No review date
      
      const lastReview = new Date(item.last_review);
      const daysSinceReview = (Date.now() - lastReview.getTime()) / (1000 * 60 * 60 * 24);
      
      return daysSinceReview >= daysThreshold;
    });
  }

  async function persist(): Promise<void> {
    try {
      // Convert WordRow to WordItem format for storage (backward compatibility)
      const wordItems: WordItem[] = [];
      console.log(`[DEBUG] Starting persist with ${rows.value.length} rows`);
      
      rows.value.forEach((row, rowIndex) => {
        const languages = Object.keys(row.words);
        console.log(`[DEBUG] Row ${rowIndex + 1} (ID: ${row.id}) has languages:`, languages);
        
        // Create word pairs for each combination
        for (let i = 0; i < languages.length; i++) {
          for (let j = 0; j < languages.length; j++) {
            if (i !== j) {
              const srcLang = languages[i];
              const tgtLang = languages[j];
              wordItems.push({
                id: `${row.id}_${srcLang}_${tgtLang}`,
                lang_src: srcLang,
                lang_tgt: tgtLang,
                text_src: row.words[srcLang],
                text_tgt: row.words[tgtLang],
                times: row.times,
                errors: row.errors,
                last_review: row.last_review,
                spell_errors: row.spell_errors,
                notes: row.notes,
              });
            }
          }
        }
      });
      
      console.log(`[DEBUG] Generated ${wordItems.length} word items from ${rows.value.length} rows`);
      console.log(`[DEBUG] Expected: ${rows.value.length} rows × 12 pairs = ${rows.value.length * 12} items`);
      
      await saveWords(wordItems);
      dirty.value = false;
    } catch (err) {
      console.error('Failed to persist words:', err);
      error.value = err instanceof Error ? err.message : 'Failed to save words';
    }
  }

  async function restore(): Promise<void> {
    loading.value = true;
    error.value = null;
    
    try {
      const savedWords = await loadWords();
      
      // Convert WordItem array back to WordRow array
      const rowMap = new Map<string, WordRow>();
      
      savedWords.forEach(wordItem => {
        const baseId = wordItem.id.split('_')[0];
        
        if (!rowMap.has(baseId)) {
          rowMap.set(baseId, {
            id: baseId,
            words: {},
            times: wordItem.times,
            errors: wordItem.errors,
            last_review: wordItem.last_review,
            spell_errors: wordItem.spell_errors,
            notes: wordItem.notes,
            stars: wordItem.stars,
            progress: {},
          });
        }
        
        const row = rowMap.get(baseId)!;
        row.words[wordItem.lang_src] = wordItem.text_src;
        row.words[wordItem.lang_tgt] = wordItem.text_tgt;
      });
      
      rows.value = Array.from(rowMap.values());
      dirty.value = false;
    } catch (err) {
      console.error('Failed to restore words:', err);
      error.value = err instanceof Error ? err.message : 'Failed to load words';
    } finally {
      loading.value = false;
    }
  }

  function clearError(): void {
    error.value = null;
  }

  function reset(): void {
    rows.value = [];
    dirty.value = false;
    error.value = null;
  }

  // On-demand language pair generation methods
  function getLanguagePairs(sourceLanguage: string, targetLanguage: string): WordItem[] {
    return generateLanguagePairs(rows.value, sourceLanguage, targetLanguage);
  }

  function getAllAvailableLanguagePairs(): { source: string; target: string }[] {
    return getAllLanguagePairs(rows.value);
  }

  // Legacy method for backward compatibility - generates ALL pairs (use sparingly)
  function getAllItems(): WordItem[] {
    console.warn('Using legacy getAllItems() method - consider using getLanguagePairs() instead');
    const wordItems: WordItem[] = [];
    rows.value.forEach(row => {
      const languages = Object.keys(row.words);
      // Create word pairs for each combination
      for (let i = 0; i < languages.length; i++) {
        for (let j = 0; j < languages.length; j++) {
          if (i !== j) {
            const srcLang = languages[i];
            const tgtLang = languages[j];
            wordItems.push({
              id: `${row.id}_${srcLang}_${tgtLang}`,
              lang_src: srcLang,
              lang_tgt: tgtLang,
              text_src: row.words[srcLang],
              text_tgt: row.words[tgtLang],
              times: row.times,
              errors: row.errors,
              last_review: row.last_review,
              spell_errors: row.spell_errors,
              notes: row.notes,
              stars: row.stars,
            });
          }
        }
      }
    });
    return wordItems;
  }

  return {
    // State
    rows,
    dirty,
    loading,
    error,
    
    // Getters
    totalWords,
    learnedWords,
    errorRate,
    languageDistribution,
    
    // Language pair methods (recommended)
    getLanguagePairs,
    getAllAvailableLanguagePairs,
    getAllItems, // Legacy method for backward compatibility
    
    // Actions
    loadFromCsv,
    exportCsv,
    addRow,
    updateRow,
    deleteRow,
    addItem, // Legacy function
    updateItem, // Legacy function
    deleteItem, // Legacy function
    bulkAddItems, // Legacy function
    bulkAddToQueue,
    filtered,
    getSortedByPriority,
    getWordsNeedingReview,
    persist,
    restore,
    clearError,
    reset,
  };
});
