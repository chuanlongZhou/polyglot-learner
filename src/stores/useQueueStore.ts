import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { QueueItem, WordItem } from '@/types';
import { saveQueue as saveQueueToIdb, loadQueue as loadQueueFromIdb } from '@/utils/idb';
import { useWordsStore } from './useWordsStore';

/**
 * Queue store for managing study queue
 */
export const useQueueStore = defineStore('queue', () => {
  // State
  const ids = ref<string[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const queueItems = computed(() => {
    const wordsStore = useWordsStore();
    return ids.value
      .map(id => {
        // Try to find the item in the legacy items array (for backward compatibility)
        const wordItem = wordsStore.getAllItems().find(item => item.id === id);
        return wordItem ? { id, wordItem, addedAt: new Date().toISOString() } : null;
      })
      .filter((item): item is QueueItem => item !== null);
  });

  const queueLength = computed(() => ids.value.length);

  const isEmpty = computed(() => ids.value.length === 0);

  // Actions
  async function loadQueue(): Promise<void> {
    loading.value = true;
    error.value = null;
    
    try {
      const savedIds = await loadQueueFromIdb();
      ids.value = savedIds;
    } catch (err) {
      console.error('Failed to load queue:', err);
      error.value = err instanceof Error ? err.message : 'Failed to load queue';
    } finally {
      loading.value = false;
    }
  }

  async function saveQueue(): Promise<void> {
    try {
      await saveQueueToIdb(ids.value);
    } catch (err) {
      console.error('Failed to save queue:', err);
      error.value = err instanceof Error ? err.message : 'Failed to save queue';
    }
  }

  function add(idsToAdd: string[]): void {
    const newIds = idsToAdd.filter(id => !ids.value.includes(id));
    ids.value.push(...newIds);
    saveQueue();
  }

  function addSingle(id: string): void {
    if (!ids.value.includes(id)) {
      ids.value.push(id);
      saveQueue();
    }
  }

  function remove(id: string): void {
    const index = ids.value.indexOf(id);
    if (index !== -1) {
      ids.value.splice(index, 1);
      saveQueue();
    }
  }

  function removeMultiple(idsToRemove: string[]): void {
    ids.value = ids.value.filter(id => !idsToRemove.includes(id));
    saveQueue();
  }

  function clear(): void {
    ids.value = [];
    saveQueue();
  }

  function moveToTop(id: string): void {
    const index = ids.value.indexOf(id);
    if (index !== -1) {
      ids.value.splice(index, 1);
      ids.value.unshift(id);
      saveQueue();
    }
  }

  function moveToBottom(id: string): void {
    const index = ids.value.indexOf(id);
    if (index !== -1) {
      ids.value.splice(index, 1);
      ids.value.push(id);
      saveQueue();
    }
  }

  function reorder(fromIndex: number, toIndex: number): void {
    const [removed] = ids.value.splice(fromIndex, 1);
    ids.value.splice(toIndex, 0, removed);
    saveQueue();
  }

  function isInQueue(id: string): boolean {
    return ids.value.includes(id);
  }

  function getNextItem(): WordItem | null {
    if (ids.value.length === 0) return null;
    
    const wordsStore = useWordsStore();
    const nextId = ids.value[0];
    const allItems = wordsStore.getAllItems();
    return allItems.find(item => item.id === nextId) || null;
  }

  function getRandomItem(): WordItem | null {
    if (ids.value.length === 0) return null;
    
    const wordsStore = useWordsStore();
    const randomId = ids.value[Math.floor(Math.random() * ids.value.length)];
    const allItems = wordsStore.getAllItems();
    return allItems.find(item => item.id === randomId) || null;
  }

  function shuffle(): void {
    for (let i = ids.value.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids.value[i], ids.value[j]] = [ids.value[j], ids.value[i]];
    }
    saveQueue();
  }

  function clearError(): void {
    error.value = null;
  }

  function reset(): void {
    ids.value = [];
    error.value = null;
  }

  return {
    // State
    ids,
    loading,
    error,
    
    // Getters
    queueItems,
    queueLength,
    isEmpty,
    
    // Actions
    loadQueue,
    saveQueue,
    add,
    addSingle,
    remove,
    removeMultiple,
    clear,
    moveToTop,
    moveToBottom,
    reorder,
    isInQueue,
    getNextItem,
    getRandomItem,
    shuffle,
    clearError,
    reset,
  };
});
