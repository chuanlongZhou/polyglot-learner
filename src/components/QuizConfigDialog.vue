<template>
  <v-dialog v-model="isOpen" max-width="600px" persistent>
    <v-card>
      <v-card-title class="text-h5 pa-4">
        <v-icon left>mdi-cog</v-icon>
        Quiz Configuration
      </v-card-title>
      
      <v-card-text class="pa-4">
        <v-form ref="form" v-model="valid">
          <!-- Language Selection -->
          <v-row>
            <v-col cols="12">
              <h3 class="text-h6 mb-3">Language Selection</h3>
            </v-col>
            
            <v-col cols="6">
              <v-select
                v-model="config.questionLanguage"
                :items="languageOptions"
                label="Question Language"
                :rules="[v => !!v || 'Question language is required']"
                required
                @update:model-value="onQuestionLanguageChange"
              />
            </v-col>
            
            <v-col cols="6">
              <v-select
                v-model="config.answerLanguage"
                :items="answerLanguageOptions"
                label="Answer Language"
                :rules="[v => !!v || 'Answer language is required']"
                required
                @update:model-value="onAnswerLanguageChange"
              />
            </v-col>
          </v-row>
          
          <!-- Quiz Number -->
          <v-row>
            <v-col cols="12">
              <h3 class="text-h6 mb-3">Quiz Settings</h3>
            </v-col>
            
            <v-col cols="6">
              <v-select
                v-model="config.quizNumber"
                :items="quizNumberOptions"
                label="Number of Questions"
                :rules="[v => !!v || 'Quiz number is required']"
                required
              />
            </v-col>
            
            <v-col cols="6">
              <v-select
                v-model="config.quizOrder"
                :items="quizOrderOptions"
                label="Question Order"
                :rules="[v => !!v || 'Quiz order is required']"
                required
              />
            </v-col>
          </v-row>
          
          <!-- Quiz Type -->
          <v-row>
            <v-col cols="12">
              <h3 class="text-h6 mb-3">Quiz Type</h3>
            </v-col>
            
            <v-col cols="12">
              <v-radio-group v-model="config.quizType" inline>
                <v-radio
                  label="Word Meaning"
                  value="word_meaning"
                  prepend-icon="mdi-translate"
                />
                <v-radio
                  label="Sound to Meaning"
                  value="sound_meaning"
                  prepend-icon="mdi-volume-high"
                />
                <v-radio
                  label="Spelling"
                  value="spelling"
                  prepend-icon="mdi-spell-check"
                />
              </v-radio-group>
            </v-col>
          </v-row>
          
        </v-form>
      </v-card-text>
      
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn
          @click="cancel"
          color="grey"
          variant="text"
        >
          Cancel
        </v-btn>
        <v-btn
          @click="startQuiz"
          color="primary"
          :disabled="!valid || availableWordsCount === 0"
          prepend-icon="mdi-play"
        >
          Start Quiz
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useWordsStore } from '@/stores/useWordsStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import type { WordItem, QuizConfig } from '@/types';


const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'start-quiz': [config: QuizConfig];
}>();

const wordsStore = useWordsStore();
const settingsStore = useSettingsStore();
const form = ref();
const valid = ref(false);

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

// Default configuration
const getDefaultConfig = (): QuizConfig => ({
  questionLanguage: 'all',
  answerLanguage: 'all',
  quizNumber: 10,
  quizOrder: 'random',
  quizType: 'word_meaning'
});

const config = ref<QuizConfig>(getDefaultConfig());

// Get available languages from the store
const availableLanguages = computed(() => {
  const languages = new Set<string>();
  wordsStore.rows.forEach(row => {
    Object.keys(row.words).forEach(lang => {
      languages.add(lang);
    });
  });
  return Array.from(languages).sort();
});

const languageOptions = computed(() => [
  { title: 'All Languages', value: 'all' },
  ...availableLanguages.value.map(lang => ({
    title: getLanguageDisplayName(lang),
    value: lang
  }))
]);

const answerLanguageOptions = computed(() => {
  const options = [
    { title: 'All Languages', value: 'all' }
  ];
  
  // If question language is not 'all', exclude it from answer options
  if (config.value.questionLanguage !== 'all') {
    const filteredLangs = availableLanguages.value.filter(lang => lang !== config.value.questionLanguage);
    options.push(...filteredLangs.map(lang => ({
      title: getLanguageDisplayName(lang),
      value: lang
    })));
  } else {
    options.push(...availableLanguages.value.map(lang => ({
      title: getLanguageDisplayName(lang),
      value: lang
    })));
  }
  
  return options;
});

const quizNumberOptions = [
  { title: '10 Questions', value: 10 },
  { title: '15 Questions', value: 15 },
  { title: '20 Questions', value: 20 },
  { title: '25 Questions', value: 25 },
  { title: '50 Questions', value: 50 }
];

const quizOrderOptions = [
  { title: 'Random', value: 'random' },
  { title: 'By Last Review (Oldest First)', value: 'lastreview' },
  { title: 'By Error Count (Most Errors First)', value: 'errors' },
  { title: 'By Stars (Highest First)', value: 'stars' }
];

const availableWordsCount = computed(() => {
  if (!config.value.questionLanguage || !config.value.answerLanguage) return 0;
  
  let count = 0;
  wordsStore.rows.forEach(row => {
    const languages = Object.keys(row.words);
    
    if (config.value.questionLanguage === 'all' && config.value.answerLanguage === 'all') {
      // Count all possible pairs
      count += languages.length * (languages.length - 1);
    } else if (config.value.questionLanguage === 'all') {
      // Count all languages as question, specific as answer
      count += languages.filter(lang => lang !== config.value.answerLanguage).length;
    } else if (config.value.answerLanguage === 'all') {
      // Count specific as question, all others as answer
      count += languages.filter(lang => lang !== config.value.questionLanguage).length;
    } else {
      // Both specific languages
      if (languages.includes(config.value.questionLanguage) && 
          languages.includes(config.value.answerLanguage) &&
          config.value.questionLanguage !== config.value.answerLanguage) {
        count += 1;
      }
    }
  });
  
  return count;
});

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

function onQuestionLanguageChange() {
  // Reset answer language if it's the same as question language
  if (config.value.questionLanguage === config.value.answerLanguage && config.value.questionLanguage !== 'all') {
    config.value.answerLanguage = 'all';
  }
}

function onAnswerLanguageChange() {
  // Reset question language if it's the same as answer language
  if (config.value.answerLanguage === config.value.questionLanguage && config.value.answerLanguage !== 'all') {
    config.value.questionLanguage = 'all';
  }
}

function startQuiz() {
  // Prevent same language selection
  if (config.value.questionLanguage === config.value.answerLanguage && 
      config.value.questionLanguage !== 'all') {
    alert('Question and answer languages cannot be the same. Please select different languages or use "All" for one of them.');
    return;
  }
  
  if (valid.value && availableWordsCount.value > 0) {
    // Save the configuration for next time
    settingsStore.setLastQuizConfig(config.value);
    
    emit('start-quiz', { ...config.value });
    isOpen.value = false;
  }
}

function cancel() {
  isOpen.value = false;
}

// Load last configuration when dialog opens
watch(isOpen, (newValue) => {
  if (newValue) {
    // Try to load the last quiz configuration
    const lastConfig = settingsStore.getLastQuizConfig();
    if (lastConfig) {
      config.value = { ...lastConfig };
    } else {
      config.value = getDefaultConfig();
    }
    valid.value = false;
  }
});
</script>

<style scoped>
.v-radio-group {
  margin-top: 8px;
}

.v-radio {
  margin-right: 24px;
}
</style>
