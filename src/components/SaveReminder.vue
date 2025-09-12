<template>
  <v-snackbar
    v-model="showReminder"
    :timeout="0"
    color="warning"
    multi-line
  >
    <template #default>
      <div class="d-flex align-center">
        <v-icon left>mdi-content-save-alert</v-icon>
        <div>
          <div class="font-weight-bold">Unsaved Changes</div>
          <div>You have unsaved changes. Save your work before closing the app.</div>
        </div>
      </div>
    </template>
    
    <template #actions>
      <v-btn
        @click="saveAndExport"
        :loading="saving"
        color="white"
        variant="text"
      >
        Save & Export
      </v-btn>
      <v-btn
        @click="dismiss"
        color="white"
        variant="text"
      >
        Dismiss
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useWordsStore } from '@/stores/useWordsStore';
import { downloadCsv } from '@/utils/csv';

const wordsStore = useWordsStore();

// Local state
const showReminder = ref(false);
const saving = ref(false);

// Computed
const hasUnsavedChanges = computed(() => wordsStore.dirty);

// Methods
async function saveAndExport() {
  saving.value = true;
  
  try {
    // Persist to IndexedDB
    await wordsStore.persist();
    
    // Export CSV
    const csvContent = wordsStore.exportCsv();
    const timestamp = new Date().toISOString().split('T')[0];
    downloadCsv(csvContent, `words-${timestamp}.csv`);
    
    showReminder.value = false;
  } catch (error) {
    console.error('Failed to save and export:', error);
  } finally {
    saving.value = false;
  }
}

function dismiss() {
  showReminder.value = false;
}

function handleBeforeUnload(event: BeforeUnloadEvent) {
  if (hasUnsavedChanges.value) {
    event.preventDefault();
    event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
    return event.returnValue;
  }
}

// Lifecycle
onMounted(() => {
  // Show reminder when there are unsaved changes
  watch(hasUnsavedChanges, (newValue) => {
    if (newValue) {
      showReminder.value = true;
    }
  });
  
  // Add beforeunload listener
  window.addEventListener('beforeunload', handleBeforeUnload);
});

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload);
});
</script>
