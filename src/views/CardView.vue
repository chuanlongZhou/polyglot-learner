<template>
  <div class="card-view-container">
    <v-container fluid>
      <!-- Controls -->
      <v-row class="mb-4">
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <v-icon left>mdi-cards</v-icon>
            Card Study Mode
          </v-card-title>
          
          <v-card-text>
            <v-row>
              <v-col cols="12" md="3">
                <v-select
                  v-model="frontLanguage"
                  :items="languageOptions"
                  label="Front Language"
                  @update:model-value="updateFilteredWords"
                />
              </v-col>
              
              <v-col cols="12" md="3">
                <v-select
                  v-model="backLanguage"
                  :items="languageOptions"
                  label="Back Language"
                  @update:model-value="updateFilteredWords"
                />
              </v-col>
              
              <v-col cols="12" md="3">
                <v-select
                  v-model="cardMode"
                  :items="cardModeOptions"
                  label="Card Mode"
                  @update:model-value="updateCardMode"
                />
              </v-col>
              
              <v-col cols="12" md="3" v-if="cardMode === 'multiple'">
                <v-select
                  v-model="cardsPerPage"
                  :items="cardsPerPageOptions"
                  label="Cards per Page"
                />
              </v-col>
            </v-row>
            
            <v-row class="mt-2">
              <v-col cols="12" class="d-flex gap-2">
                <v-btn
                  @click="shuffleCards"
                  color="secondary"
                  prepend-icon="mdi-shuffle"
                >
                  Shuffle Cards
                </v-btn>
                
                <v-btn
                  v-if="cardMode === 'single'"
                  @click="previousCard"
                  :disabled="currentIndex === 0"
                  prepend-icon="mdi-chevron-left"
                >
                  Previous
                </v-btn>
                
                <v-btn
                  v-if="cardMode === 'single'"
                  @click="nextCard"
                  :disabled="currentIndex >= filteredWords.length - 1"
                  prepend-icon="mdi-chevron-right"
                >
                  Next
                </v-btn>
                
                <v-spacer />
                
                <div v-if="cardMode === 'single'" class="d-flex align-center">
                  Card {{ currentIndex + 1 }} of {{ filteredWords.length }}
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Single Card Mode -->
    <v-row v-if="cardMode === 'single' && currentWord" justify="center">
      <v-col cols="12" md="6" lg="4">
        <SimpleCard
          :word="currentWord"
          :front-language="frontLanguage"
          :back-language="backLanguage"
        />
      </v-col>
    </v-row>

    <!-- Multiple Cards Mode -->
    <v-row v-if="cardMode === 'multiple'">
      <v-col
        v-for="word in visibleWords"
        :key="word.id"
        :cols="12"
        :md="12 / cardsPerPage"
        :lg="12 / cardsPerPage"
        class="mb-4"
      >
        <SimpleCard
          :word="word"
          :front-language="frontLanguage"
          :back-language="backLanguage"
        />
      </v-col>
    </v-row>

    <!-- No Cards Message -->
    <v-row v-if="filteredWords.length === 0" justify="center">
      <v-col cols="12" md="6">
        <v-card>
          <v-card-text class="text-center pa-8">
            <v-icon size="64" color="grey">mdi-cards-outline</v-icon>
            <div class="text-h5 mt-4">No cards available</div>
            <div class="text-body-1 text-grey mt-2">
              No words found for the selected language combination.
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useWordsStore } from '@/stores/useWordsStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { getLanguageDisplayName, LANGUAGE_NAMES } from '@/utils/normalize';
import SimpleCard from '@/components/SimpleCard.vue';
import type { WordItem } from '@/types';

const wordsStore = useWordsStore();
const settingsStore = useSettingsStore();

// Local state - will be set based on available languages
const frontLanguage = ref('');
const backLanguage = ref('');
const cardMode = ref<'single' | 'multiple'>('single');
const cardsPerPage = ref(4);
const currentIndex = ref(0);
const shuffledWords = ref<WordItem[]>([]);

// Options - only show languages that are actually present in the CSV data
const languageOptions = computed(() => {
  const availableLanguages = Object.keys(wordsStore.languageDistribution);
  return availableLanguages.map(code => ({
    title: getLanguageDisplayName(code),
    value: code,
  }));
});

const cardModeOptions = [
  { title: 'Single Card', value: 'single' },
  { title: 'Multiple Cards', value: 'multiple' },
];

const cardsPerPageOptions = [
  { title: '2 Cards', value: 2 },
  { title: '4 Cards', value: 4 },
  { title: '6 Cards', value: 6 },
  { title: '8 Cards', value: 8 },
];

// Computed
const filteredWords = computed(() => {
  return wordsStore.getLanguagePairs(frontLanguage.value, backLanguage.value);
});

const currentWord = computed(() => {
  if (cardMode.value === 'single' && shuffledWords.value.length > 0) {
    return shuffledWords.value[currentIndex.value] || null;
  }
  return null;
});

const visibleWords = computed(() => {
  if (cardMode.value === 'multiple') {
    return shuffledWords.value.slice(0, cardsPerPage.value);
  }
  return [];
});

// Methods
function setDefaultLanguages() {
  const availableLanguages = Object.keys(wordsStore.languageDistribution);
  if (availableLanguages.length > 0) {
    // Set first available language as front language if not set
    if (!frontLanguage.value || !availableLanguages.includes(frontLanguage.value)) {
      frontLanguage.value = availableLanguages[0];
    }
    
    // Set second available language as back language if not set
    if (!backLanguage.value || !availableLanguages.includes(backLanguage.value)) {
      backLanguage.value = availableLanguages.length > 1 ? availableLanguages[1] : availableLanguages[0];
    }
  }
}

function updateFilteredWords() {
  shuffledWords.value = [...filteredWords.value];
  currentIndex.value = 0;
}

function updateCardMode() {
  currentIndex.value = 0;
  if (shuffledWords.value.length === 0) {
    updateFilteredWords();
  }
}

function shuffleCards() {
  const words = [...filteredWords.value];
  for (let i = words.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [words[i], words[j]] = [words[j], words[i]];
  }
  shuffledWords.value = words;
  currentIndex.value = 0;
}

function previousCard() {
  if (currentIndex.value > 0) {
    currentIndex.value--;
  }
}

function nextCard() {
  if (currentIndex.value < filteredWords.value.length - 1) {
    currentIndex.value++;
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (cardMode.value === 'single') {
    if (event.key === 'ArrowLeft') {
      previousCard();
    } else if (event.key === 'ArrowRight') {
      nextCard();
    }
  }
}

// Lifecycle
onMounted(async () => {
  await wordsStore.restore();
  await settingsStore.loadSettings();
  setDefaultLanguages();
  updateFilteredWords();
  
  // Add keyboard event listener
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});

// Watch for filtered words changes
watch(filteredWords, () => {
  updateFilteredWords();
});

// Watch for language distribution changes to update default languages
watch(() => wordsStore.languageDistribution, () => {
  setDefaultLanguages();
  updateFilteredWords();
}, { deep: true });
</script>

<style scoped>
.card-view-container {
  width: 100%;
  max-width: none;
  padding: 16px;
  margin: 0 auto;
}

.gap-2 {
  gap: 8px;
}

/* Responsive design for wide screens */
@media (min-width: 1400px) {
  .card-view-container {
    padding: 24px 48px;
  }
}

@media (min-width: 1920px) {
  .card-view-container {
    padding: 32px 64px;
  }
}

@media (max-width: 768px) {
  .card-view-container {
    padding: 8px;
  }
}
</style>