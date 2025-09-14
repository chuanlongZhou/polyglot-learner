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
              <v-col cols="12" md="2">
                <v-select
                  v-model="frontLanguage"
                  :items="languageOptions"
                  label="Front Language"
                  @update:model-value="updateFilteredWords"
                />
              </v-col>
              
              <v-col cols="12" md="2">
                <v-select
                  v-model="backLanguage"
                  :items="languageOptions"
                  label="Back Language"
                  @update:model-value="updateFilteredWords"
                />
              </v-col>
              
              <v-col cols="12" md="2">
                <v-select
                  v-model="cardMode"
                  :items="cardModeOptions"
                  label="Card Mode"
                  @update:model-value="updateCardMode"
                />
              </v-col>
              
              <v-col cols="12" md="2" v-if="cardMode === 'multiple'">
                <v-select
                  v-model="cardsPerPage"
                  :items="cardsPerPageOptions"
                  label="Cards per Page"
                />
              </v-col>
              
              <v-col cols="12" md="2">
                <v-select
                  v-model="sortMode"
                  :items="sortModeOptions"
                  label="Sort by"
                  @update:model-value="updateFilteredWords"
                />
              </v-col>
              
              <v-col cols="12" md="2" v-if="cardMode === 'single'">
                <v-checkbox
                  v-model="autoPlay"
                  label="Auto Play"
                  color="primary"
                  hide-details
                />
              </v-col>
            </v-row>
            
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

     <!-- Single Card Mode -->
     <v-row v-if="cardMode === 'single' && currentWord" justify="center" class="my-16">
       <v-col cols="12" md="8" lg="6" xl="5">
         <SimpleCard
           ref="simpleCardRef"
           :word="currentWord"
           :front-language="frontLanguage"
           :back-language="backLanguage"
           :is-single-card-mode="true"
           :auto-play="autoPlay"
           :card-mode="cardMode"
           @next-card="nextCard"
         />
       </v-col>
     </v-row>

     <!-- Introduction for Single Card Mode -->
     <v-row v-if="cardMode === 'single'" justify="center" class="mt-16">
      <v-col cols="12" md="8" lg="6" xl="5">
        <div class="text-center">
          <div class="text-body-2 text-grey-darken-1 mb-2">
            <strong>← →</strong> Navigate between cards
          </div>
          <div class="text-body-2 text-grey-darken-1 mb-2">
            <strong>Space</strong> Play audio and flip card
          </div>
          <div class="text-body-2 text-grey-darken-1">
            <strong>Click</strong> Play audio and flip card
          </div>
        </div>
      </v-col>
    </v-row>


     <!-- Multiple Cards Mode -->
     <div v-if="cardMode === 'multiple'" class="multiple-cards-container my-12">
      <div
        v-for="(row, rowIndex) in cardRows"
        :key="`row-${rowIndex}`"
        class="cards-row"
      >
        <div
          v-for="word in row"
          :key="word.id"
          class="card-item"
        >
          <SimpleCard
            :word="word"
            :front-language="frontLanguage"
            :back-language="backLanguage"
            :card-mode="cardMode"
          />
        </div>
      </div>
    </div>

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

     <!-- Navigation Buttons -->
     <v-row v-if="filteredWords.length > 0" class="mt-8" justify="center">
      <v-col cols="12" class="d-flex gap-2 justify-center align-center">
        <v-btn
          v-if="cardMode === 'single'"
          @click="previousCard"
          :disabled="currentIndex === 0"
          prepend-icon="mdi-chevron-left"
          variant="outlined"
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
        
        <!-- Multiple card mode group navigation -->
        <v-btn
          v-if="cardMode === 'multiple'"
          @click="previousGroup"
          :disabled="!canGoToPreviousGroup"
          prepend-icon="mdi-chevron-left"
          variant="outlined"
        >
          Previous Group
        </v-btn>
        
        <v-btn
          v-if="cardMode === 'multiple'"
          @click="nextGroup"
          :disabled="!canGoToNextGroup"
          prepend-icon="mdi-chevron-right"
        >
          Next Group
        </v-btn>
        
        <div v-if="cardMode === 'single'" class="d-flex align-center ml-4">
          Card {{ currentIndex + 1 }} of {{ filteredWords.length }}
        </div>
        
        <div v-if="cardMode === 'multiple'" class="d-flex align-center ml-4">
          Group {{ currentGroup + 1 }} of {{ totalGroups }}
        </div>
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
const cardsPerPage = ref(15);
const currentIndex = ref(0);
const shuffledWords = ref<WordItem[]>([]);
const autoPlay = ref(false);
const sortMode = ref<'least-learned' | 'most-errors' | 'earliest-review' | 'random'>('least-learned');
const simpleCardRef = ref<InstanceType<typeof SimpleCard> | null>(null);

// Multiple card mode group navigation
const currentGroup = ref(0);

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
  { title: '5 Cards', value: 5 },
  { title: '10 Cards', value: 10 },
  { title: '15 Cards', value: 15 },
  { title: '20 Cards', value: 20 },
];

const sortModeOptions = [
  { title: 'Least Learned', value: 'least-learned' },
  { title: 'Most Errors', value: 'most-errors' },
  { title: 'Earliest Last Review', value: 'earliest-review' },
  { title: 'Random', value: 'random' },
];

// Computed
const filteredWords = computed(() => {
  const words = wordsStore.getLanguagePairs(frontLanguage.value, backLanguage.value);
  return applySorting(words, sortMode.value);
});

// Sorting functions
function applySorting(words: WordItem[], mode: string): WordItem[] {
  const sortedWords = [...words];
  
  switch (mode) {
    case 'least-learned':
      return sortedWords.sort((a, b) => {
        const timesDiff = a.times - b.times;
        return timesDiff !== 0 ? timesDiff : Math.random() - 0.5;
      });
    
    case 'most-errors':
      return sortedWords.sort((a, b) => {
        const errorsDiff = b.errors - a.errors;
        return errorsDiff !== 0 ? errorsDiff : Math.random() - 0.5;
      });
    
    case 'earliest-review':
      return sortedWords.sort((a, b) => {
        const aDate = new Date(a.last_review || 0).getTime();
        const bDate = new Date(b.last_review || 0).getTime();
        const dateDiff = aDate - bDate;
        return dateDiff !== 0 ? dateDiff : Math.random() - 0.5;
      });
    
    case 'random':
      return sortedWords.sort(() => Math.random() - 0.5);
    
    default:
      return sortedWords;
  }
}

const currentWord = computed(() => {
  if (cardMode.value === 'single' && shuffledWords.value.length > 0) {
    const wordId = shuffledWords.value[currentIndex.value]?.id;
    if (wordId) {
      // Get the latest word data from the store to ensure reactivity
      const latestWords = wordsStore.getLanguagePairs(frontLanguage.value, backLanguage.value);
      const foundWord = latestWords.find(word => word.id === wordId);
      return foundWord || shuffledWords.value[currentIndex.value];
    }
  }
  return null;
});

const visibleWords = computed(() => {
  if (cardMode.value === 'multiple') {
    // Get the latest word data from the store to ensure reactivity
    const currentWords = wordsStore.getLanguagePairs(frontLanguage.value, backLanguage.value);
    const startIndex = currentGroup.value * cardsPerPage.value;
    const endIndex = startIndex + cardsPerPage.value;
    return shuffledWords.value.slice(startIndex, endIndex).map(shuffledWord => 
      currentWords.find(word => word.id === shuffledWord.id) || shuffledWord
    );
  }
  return [];
});

const cardRows = computed(() => {
  if (cardMode.value === 'multiple') {
    const words = visibleWords.value;
    const rows = [];
    for (let i = 0; i < words.length; i += 5) {
      rows.push(words.slice(i, i + 5));
    }
    return rows;
  }
  return [];
});

// Group navigation computed properties
const totalGroups = computed(() => {
  if (cardMode.value === 'multiple') {
    return Math.ceil(shuffledWords.value.length / cardsPerPage.value);
  }
  return 0;
});

const canGoToPreviousGroup = computed(() => {
  return cardMode.value === 'multiple' && currentGroup.value > 0;
});

const canGoToNextGroup = computed(() => {
  return cardMode.value === 'multiple' && currentGroup.value < totalGroups.value - 1;
});

// Methods
function setDefaultLanguages() {
  const availableLanguages = Object.keys(wordsStore.languageDistribution);
  
  if (availableLanguages.length > 0) {
    // Set French as front language if available, otherwise first available language
    if (!frontLanguage.value || !availableLanguages.includes(frontLanguage.value)) {
      if (availableLanguages.includes('fr')) {
        frontLanguage.value = 'fr';
      } else {
        frontLanguage.value = availableLanguages[0];
      }
    }
    
    // Set English as back language if available, otherwise second available language
    if (!backLanguage.value || !availableLanguages.includes(backLanguage.value)) {
      if (availableLanguages.includes('en')) {
        backLanguage.value = 'en';
      } else {
        backLanguage.value = availableLanguages.length > 1 ? availableLanguages[1] : availableLanguages[0];
      }
    }
  }
}

function updateFilteredWords() {
  shuffledWords.value = [...filteredWords.value];
  currentIndex.value = 0;
  currentGroup.value = 0;
}

function updateCardMode() {
  currentIndex.value = 0;
  currentGroup.value = 0;
  if (shuffledWords.value.length === 0) {
    updateFilteredWords();
  }
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

// Group navigation methods for multiple card mode
function previousGroup() {
  if (canGoToPreviousGroup.value) {
    currentGroup.value--;
  }
}

function nextGroup() {
  if (canGoToNextGroup.value) {
    currentGroup.value++;
  }
}

async function handleKeydown(event: KeyboardEvent) {
  // Prevent focus on any elements when using keyboard controls
  event.preventDefault();
  
  if (cardMode.value === 'single') {
    if (event.key === 'ArrowLeft') {
      // Left arrow: go to previous card
      previousCard();
    } else if (event.key === 'ArrowRight') {
      // Right arrow: go to next card
      nextCard();
    } else if (event.key === ' ') {
      // Space: play and flip current card
      if (simpleCardRef.value) {
        await simpleCardRef.value.handleSpaceKey();
      }
    }
  } else if (cardMode.value === 'multiple') {
    if (event.key === 'ArrowLeft') {
      // Left arrow: go to previous group
      previousGroup();
    } else if (event.key === 'ArrowRight') {
      // Right arrow: go to next group
      nextGroup();
    }
  }
}

// Lifecycle
onMounted(async () => {
  await wordsStore.restore();
  await settingsStore.loadSettings();
  
  // If no data exists, load example data
  if (wordsStore.totalWords === 0) {
    console.log('No data found, loading example data...');
    try {
      const response = await fetch('/example_words.csv');
      const csvText = await response.text();
      const result = await wordsStore.loadFromCsv(csvText);
      if (result.success) {
        console.log('Example data loaded successfully');
      } else {
        console.error('Failed to load example data:', result.errors);
      }
    } catch (error) {
      console.error('Error loading example data:', error);
    }
  }
  
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

/* Multiple Cards Layout */
.multiple-cards-container {
  width: 100%;
}

.cards-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
  justify-content: center;
}

.card-item {
  flex: 0 0 calc(20% - 13px); /* 5 cards per row: 100% / 5 = 20%, minus gap */
  max-width: calc(20% - 13px);
  min-width: 200px;
}

/* Responsive adjustments */
@media (max-width: 1200px) {
  .card-item {
    flex: 0 0 calc(25% - 12px); /* 4 cards per row on smaller screens */
    max-width: calc(25% - 12px);
  }
}

@media (max-width: 900px) {
  .card-item {
    flex: 0 0 calc(33.333% - 11px); /* 3 cards per row */
    max-width: calc(33.333% - 11px);
  }
}

@media (max-width: 600px) {
  .card-item {
    flex: 0 0 calc(50% - 8px); /* 2 cards per row on mobile */
    max-width: calc(50% - 8px);
  }
}

@media (max-width: 400px) {
  .card-item {
    flex: 0 0 100%; /* 1 card per row on very small screens */
    max-width: 100%;
  }
}
</style>