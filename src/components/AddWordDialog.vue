<template>
  <v-dialog v-model="dialog" max-width="600px" persistent>
    <v-card>
      <v-card-title>
        <v-icon left>mdi-plus</v-icon>
        Add New Word
      </v-card-title>
      
      <v-card-text>
        <v-form ref="form" v-model="valid">
          <v-row>
            <v-col cols="12" md="6">
              <v-select
                v-model="formData.lang_src"
                :items="languageOptions"
                label="Source Language"
                :rules="[v => !!v || 'Source language is required']"
                required
              />
            </v-col>
            
            <v-col cols="12" md="6">
              <v-select
                v-model="formData.lang_tgt"
                :items="languageOptions"
                label="Target Language"
                :rules="[v => !!v || 'Target language is required']"
                required
              />
            </v-col>
          </v-row>
          
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.text_src"
                label="Source Text"
                :rules="[v => !!v || 'Source text is required']"
                required
              />
            </v-col>
            
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.text_tgt"
                label="Target Text"
                :rules="[v => !!v || 'Target text is required']"
                required
              />
            </v-col>
          </v-row>
          
          <v-row>
            <v-col cols="12">
              <v-textarea
                v-model="formData.notes"
                label="Notes (Optional)"
                rows="3"
                auto-grow
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      
      <v-card-actions>
        <v-spacer />
        <v-btn
          @click="closeDialog"
          :disabled="loading"
          variant="text"
        >
          Cancel
        </v-btn>
        <v-btn
          @click="addWord"
          :disabled="!valid || loading"
          :loading="loading"
          color="primary"
        >
          Add Word
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useWordsStore } from '@/stores/useWordsStore';
import { generateWordId, LANGUAGE_NAMES } from '@/utils/normalize';
import type { WordItem } from '@/types';

const wordsStore = useWordsStore();

// Props
const props = defineProps<{
  modelValue: boolean;
}>();

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'wordAdded': [word: WordItem];
}>();

// Local state
const dialog = ref(false);
const valid = ref(false);
const loading = ref(false);
const form = ref();

const formData = ref({
  lang_src: '',
  lang_tgt: '',
  text_src: '',
  text_tgt: '',
  notes: '',
});

// Computed
const languageOptions = computed(() => 
  Object.entries(LANGUAGE_NAMES).map(([code, name]) => ({
    title: name,
    value: code,
  }))
);

// Methods
function closeDialog() {
  dialog.value = false;
  resetForm();
  emit('update:modelValue', false);
}

function resetForm() {
  formData.value = {
    lang_src: '',
    lang_tgt: '',
    text_src: '',
    text_tgt: '',
    notes: '',
  };
  if (form.value) {
    form.value.reset();
  }
}

async function addWord() {
  if (!valid.value) return;
  
  loading.value = true;
  
  try {
    const newWord: WordItem = {
      id: generateWordId(),
      lang_src: formData.value.lang_src,
      lang_tgt: formData.value.lang_tgt,
      text_src: formData.value.text_src.trim(),
      text_tgt: formData.value.text_tgt.trim(),
      times: 0,
      errors: 0,
      last_review: '',
      spell_errors: 0,
      notes: formData.value.notes.trim() || undefined,
    };
    
    wordsStore.addItem(newWord);
    emit('wordAdded', newWord);
    closeDialog();
  } catch (error) {
    console.error('Failed to add word:', error);
  } finally {
    loading.value = false;
  }
}

// Watch for dialog changes
watch(() => props.modelValue, (newValue) => {
  dialog.value = newValue;
});

watch(dialog, (newValue) => {
  if (!newValue) {
    emit('update:modelValue', false);
  }
});
</script>
