<template>
  <v-dialog v-model="dialog" max-width="600px" persistent>
    <v-card>
      <v-card-title>
        <v-icon left>mdi-translate</v-icon>
        Configure Languages
      </v-card-title>
      
      <v-card-text>
        <v-alert
          v-if="format === 'unknown'"
          type="error"
          class="mb-4"
        >
          Unable to detect CSV format. Please ensure your CSV has either:
          <ul class="mt-2">
            <li>Legacy format: <code>lang_src</code> and <code>lang_tgt</code> columns</li>
            <li>New format: <code>word_{language}</code> columns (e.g., <code>word_en</code>, <code>word_fr</code>)</li>
          </ul>
        </v-alert>
        
        <div v-else-if="format === 'legacy'">
          <v-alert
            type="info"
            class="mb-4"
          >
            Detected legacy CSV format. This format is supported and will be imported directly.
          </v-alert>
          
          <!-- Import Mode Selection -->
          <v-card variant="outlined" class="mb-4">
            <v-card-title class="text-subtitle-1 pa-4 pb-2">
              <v-icon left>mdi-import</v-icon>
              Import Mode
            </v-card-title>
            <v-card-text class="pt-0">
              <v-radio-group v-model="importMode" inline>
                <v-radio
                  label="Add to current list"
                  value="add"
                  color="primary"
                />
                <v-radio
                  label="Replace current list"
                  value="replace"
                  color="warning"
                />
              </v-radio-group>
              <div class="text-caption text-grey mt-2">
                <strong>Add to current list:</strong> New words will be added to your existing vocabulary.<br>
                <strong>Replace current list:</strong> All current words will be removed and replaced with the imported words.
              </div>
            </v-card-text>
          </v-card>
        </div>
        
        <div v-else-if="format === 'new'">
          <p class="mb-4">
            Detected new CSV format with the following languages:
            <v-chip
              v-for="lang in availableLanguages"
              :key="lang"
              class="ma-1"
              color="primary"
            >
              {{ getLanguageDisplayName(lang) }}
            </v-chip>
          </p>
          
          <!-- Import Mode Selection -->
          <v-card variant="outlined" class="mb-4">
            <v-card-title class="text-subtitle-1 pa-4 pb-2">
              <v-icon left>mdi-import</v-icon>
              Import Mode
            </v-card-title>
            <v-card-text class="pt-0">
              <v-radio-group v-model="importMode" inline>
                <v-radio
                  label="Add to current list"
                  value="add"
                  color="primary"
                />
                <v-radio
                  label="Replace current list"
                  value="replace"
                  color="warning"
                />
              </v-radio-group>
              <div class="text-caption text-grey mt-2">
                <strong>Add to current list:</strong> New words will be added to your existing vocabulary.<br>
                <strong>Replace current list:</strong> All current words will be removed and replaced with the imported words.
              </div>
            </v-card-text>
          </v-card>
          
          <v-form ref="form" v-model="valid">
            <v-row>
              <v-col cols="12">
                <v-select
                  v-model="config.displayLanguages"
                  :items="languageOptions"
                  label="Display Languages (Select up to 4 languages to show in table)"
                  multiple
                  chips
                  :rules="[v => v.length >= 2 || 'Select at least 2 languages', v => v.length <= 4 || 'Select at most 4 languages']"
                  required
                />
                <div class="text-caption text-grey mt-2">
                  All language combinations will be created for study. For example, if you select English, French, and Chinese, 
                  you'll get: English→French, English→Chinese, French→English, French→Chinese, Chinese→English, Chinese→French.
                </div>
              </v-col>
            </v-row>
          </v-form>
        </div>
      </v-card-text>
      
      <v-card-actions>
        <v-spacer />
        <v-btn
          @click="cancel"
          :disabled="loading"
          variant="text"
        >
          Cancel
        </v-btn>
        <v-btn
          v-if="format === 'legacy'"
          @click="importLegacy"
          :loading="loading"
          color="primary"
        >
          Import Legacy Format
        </v-btn>
        <v-btn
          v-else-if="format === 'new'"
          @click="importWithConfig"
          :disabled="!valid || loading"
          :loading="loading"
          color="primary"
        >
          Import with Configuration
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useWordsStore } from '@/stores/useWordsStore';
import { parseCsvToWords, parseCsvToWordsWithConfig, parseCsvToWordRows } from '@/utils/csv';
import { getLanguageDisplayName, LANGUAGE_NAMES } from '@/utils/normalize';
import type { LanguageConfig } from '@/types';

const wordsStore = useWordsStore();

// Props
const props = defineProps<{
  modelValue: boolean;
  csvContent: string;
  format: 'legacy' | 'new' | 'unknown';
  availableLanguages: string[];
}>();

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'imported': [success: boolean, errors: string[]];
}>();

// Local state
const dialog = ref(false);
const valid = ref(false);
const loading = ref(false);
const form = ref();
const importMode = ref<'add' | 'replace'>('add');

const config = ref<LanguageConfig>({
  sourceLanguage: '',
  targetLanguage: '',
  availableLanguages: [],
});

// Computed
const languageOptions = computed(() => 
  props.availableLanguages.map(lang => ({
    title: getLanguageDisplayName(lang),
    value: lang,
  }))
);

// Methods
function cancel() {
  dialog.value = false;
  emit('update:modelValue', false);
}

async function importLegacy() {
  loading.value = true;
  
  try {
    // Clear existing data if replace mode is selected
    if (importMode.value === 'replace') {
      wordsStore.reset();
    }
    
    const result = await wordsStore.loadFromCsv(props.csvContent);
    emit('imported', result.success, result.errors);
    if (result.success) {
      cancel();
    }
  } catch (error) {
    emit('imported', false, [error instanceof Error ? error.message : 'Unknown error']);
  } finally {
    loading.value = false;
  }
}

async function importWithConfig() {
  if (!valid.value) return;
  
  loading.value = true;
  
  try {
    // Clear existing data if replace mode is selected
    if (importMode.value === 'replace') {
      wordsStore.reset();
    }
    
    const result = parseCsvToWordRows(props.csvContent);
    
    if (result.errors.length > 0) {
      emit('imported', false, result.errors);
    } else {
      // Add rows to store in bulk (only one persist operation)
      result.data.forEach(row => wordsStore.addRow(row));
      emit('imported', true, []);
      cancel();
    }
  } catch (error) {
    emit('imported', false, [error instanceof Error ? error.message : 'Unknown error']);
  } finally {
    loading.value = false;
  }
}

// Watch for dialog changes
watch(() => props.modelValue, (newValue) => {
  dialog.value = newValue;
  if (newValue) {
    config.value.availableLanguages = props.availableLanguages;
    // Set default values - select first 4 languages for display
    config.value.displayLanguages = props.availableLanguages.slice(0, 4);
  }
});

watch(dialog, (newValue) => {
  if (!newValue) {
    emit('update:modelValue', false);
  }
});
</script>
