<template>
  <div class="spelling-quiz">
    <div class="text-center">
      <!-- Question Text (Source Language) -->
      <div class="text-h4 mb-4">{{ question.text_src }}</div>
      <div class="text-body-1 text-grey mb-6">
        Spell this word in {{ getLanguageDisplayName(question.lang_tgt) }}
      </div>
      
      <!-- Audio Play Button -->
      <v-btn
        @click="playQuestionAudio"
        color="primary"
        variant="outlined"
        class="mb-6"
        prepend-icon="mdi-volume-high"
        size="large"
      >
        Play Question
      </v-btn>
      
      <!-- Spelling Input -->
      <v-text-field
        ref="spellingInput"
        v-model="spellingAnswer"
        :label="`Spell in ${getLanguageDisplayName(question.lang_tgt)}`"
        @keydown.enter="checkSpellingAnswer"
        :disabled="isAnswered"
        autofocus
        class="mb-6"
        variant="outlined"
        size="large"
      />
      
      <!-- Skip Button -->
      <v-btn
        @click="skipQuestion"
        color="error"
        variant="outlined"
        prepend-icon="mdi-skip-next"
      >
        Skip
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import type { WordItem } from '@/types';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { normalizeText, isSimilarText } from '@/utils/normalize';

interface Props {
  question: WordItem;
}

interface Emits {
  (e: 'answer', answer: string, isCorrect: boolean): void;
  (e: 'skip'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const settingsStore = useSettingsStore();

// State
const spellingAnswer = ref('');
const isAnswered = ref(false);
const spellingInput = ref<any>(null);

// Methods
function getLanguageDisplayName(lang: string): string {
  const languageNames: Record<string, string> = {
    'en': 'English',
    'fr': 'French',
    'es': 'Spanish',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese',
    'ar': 'Arabic',
    'hi': 'Hindi',
    'th': 'Thai',
    'vi': 'Vietnamese',
    'tr': 'Turkish',
    'pl': 'Polish',
    'nl': 'Dutch',
    'sv': 'Swedish',
    'da': 'Danish',
    'no': 'Norwegian',
    'fi': 'Finnish',
    'cs': 'Czech',
    'hu': 'Hungarian',
    'ro': 'Romanian',
    'bg': 'Bulgarian',
    'hr': 'Croatian',
    'sk': 'Slovak',
    'sl': 'Slovenian',
    'et': 'Estonian',
    'lv': 'Latvian',
    'lt': 'Lithuanian',
    'uk': 'Ukrainian',
    'be': 'Belarusian',
    'mk': 'Macedonian',
    'sq': 'Albanian',
    'mt': 'Maltese',
    'is': 'Icelandic',
    'ga': 'Irish',
    'cy': 'Welsh',
    'eu': 'Basque',
    'ca': 'Catalan',
    'gl': 'Galician'
  };
  
  return languageNames[lang] || lang.toUpperCase();
}

async function playQuestionAudio() {
  if (!props.question) return;
  
  try {
    await settingsStore.speakText(props.question.text_src, props.question.lang_src);
  } catch (error) {
    console.error('TTS error:', error);
  }
}

function checkSpellingAnswer() {
  if (isAnswered.value || !spellingAnswer.value.trim()) return;
  
  const correctText = props.question.text_tgt.toLowerCase();
  const userText = spellingAnswer.value.trim().toLowerCase();
  
  // Check for exact match first
  let isCorrect = false;
  if (correctText === userText) {
    isCorrect = true;
  } else {
    // Check for similar text (fuzzy matching)
    isCorrect = isSimilarText(correctText, userText, 0.8);
  }
  
  isAnswered.value = true;
  emit('answer', spellingAnswer.value, isCorrect);
}

function skipQuestion() {
  if (isAnswered.value) return;
  
  isAnswered.value = true;
  emit('skip');
}

// Focus input when component mounts
nextTick(() => {
  if (spellingInput.value && spellingInput.value.focus) {
    spellingInput.value.focus();
  }
});
</script>

<style scoped>
.spelling-quiz {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.text-h4 {
  font-weight: bold;
  color: #1976d2;
}

.text-body-1.text-grey {
  color: #757575;
}
</style>
