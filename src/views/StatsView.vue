<template>
  <div class="stats-view-container">
    <v-container fluid>
      <!-- Simple Overview Cards -->
      <v-row class="mb-6">
        <v-col cols="12" sm="6" md="3">
          <v-card class="stats-card" elevation="3">
            <v-card-text class="text-center pa-6">
              <v-icon size="64" color="primary">mdi-book</v-icon>
              <div class="text-h3 mt-3 font-weight-bold">{{ totalWords }}</div>
              <div class="text-h6 text-grey">Total Words</div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" sm="6" md="3">
          <v-card class="stats-card" elevation="3">
            <v-card-text class="text-center pa-6">
              <v-icon size="64" color="warning">mdi-alert-circle</v-icon>
              <div class="text-h3 mt-3 font-weight-bold">{{ Math.round(errorRate) }}%</div>
              <div class="text-h6 text-grey">Error Rate</div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" sm="6" md="3">
          <v-card class="stats-card" elevation="3">
            <v-card-text class="text-center pa-6">
              <v-icon size="64" color="teal">mdi-calendar-today</v-icon>
              <div class="text-h3 mt-3 font-weight-bold">{{ practicedToday }}</div>
              <div class="text-h6 text-grey">Practiced Today</div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" sm="6" md="3">
          <v-card class="stats-card" elevation="3">
            <v-card-text class="text-center pa-6">
              <v-icon size="64" color="success">mdi-trophy</v-icon>
              <div class="text-h3 mt-3 font-weight-bold">{{ masteredWords }}</div>
              <div class="text-h6 text-grey">Mastered</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Today's Quiz Errors -->
      <v-row class="mt-4">
        <v-col cols="12">
          <v-card class="elevation-3">
            <v-card-title class="d-flex align-center">
              <v-icon left color="error">mdi-alert-circle</v-icon>
              Today's Quiz Errors
              <v-spacer />
              <v-chip 
                v-if="todaysQuizErrors.length > 0"
                color="error" 
                variant="outlined"
                size="small"
              >
                {{ todaysQuizErrors.length }} Errors
              </v-chip>
              <v-chip 
                v-else
                color="success" 
                variant="outlined"
                size="small"
              >
                No Errors Today!
              </v-chip>
              <v-progress-circular
                v-if="loading"
                indeterminate
                size="20"
                width="2"
                color="primary"
                class="ml-2"
              />
            </v-card-title>
            <v-card-text>
              <div v-if="todaysQuizErrors.length === 0" class="text-center pa-8">
                <v-icon size="64" color="success" class="mb-4">mdi-check-circle</v-icon>
                <div class="text-h6">Great job! No quiz errors today.</div>
                <div class="text-body-2 text-grey mt-2">Keep up the good work!</div>
              </div>
              <div v-else>
                <v-list>
                  <v-list-item
                    v-for="(error, index) in todaysQuizErrors"
                    :key="index"
                    class="error-item"
                  >
                    <template #prepend>
                      <v-icon color="error" size="small">mdi-close-circle</v-icon>
                    </template>
                    
                    <v-list-item-title class="font-weight-medium">
                      {{ error.question }} → {{ error.correctAnswer }}
                    </v-list-item-title>
                    
                    <v-list-item-subtitle class="text-error">
                      <strong>Your answer:</strong> {{ error.userAnswer === 'SKIPPED' ? 'Skipped' : error.userAnswer }}
                    </v-list-item-subtitle>
                    
                    <template #append>
                      <div class="d-flex align-center">
                        <StarButton
                          :stars="getWordStars(error.question, error.correctAnswer)"
                          @update:stars="(newStars) => updateWordStars(error.question, error.correctAnswer, newStars)"
                          size="small"
                        />
                        <v-chip size="small" color="grey" variant="outlined" class="ml-2">
                          {{ formatTime(error.timestamp) }}
                        </v-chip>
                      </div>
                    </template>
                  </v-list-item>
                </v-list>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Simple Actions -->
      <v-row class="mt-4">
        <v-col cols="12">
          <v-card class="elevation-3">
            <v-card-title class="d-flex align-center">
              <v-icon left color="primary">mdi-cog</v-icon>
              Actions
            </v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12" sm="6" md="3">
                  <v-btn
                    @click="exportCsv"
                    color="primary"
                    prepend-icon="mdi-download"
                    block
                    variant="outlined"
                  >
                    Export CSV
                  </v-btn>
                </v-col>
                
                <v-col cols="12" sm="6" md="3">
                  <v-btn
                    @click="clearTodaysErrors"
                    color="warning"
                    prepend-icon="mdi-delete"
                    block
                    variant="outlined"
                  >
                    Clear Today's Errors
                  </v-btn>
                </v-col>
                
                <v-col cols="12" sm="6" md="3">
                  <v-btn
                    @click="refreshStats"
                    color="info"
                    prepend-icon="mdi-refresh"
                    block
                    variant="outlined"
                  >
                    Refresh
                  </v-btn>
                </v-col>
                
                <v-col cols="12" sm="6" md="3">
                  <v-btn
                    @click="clearAllProgress"
                    color="error"
                    prepend-icon="mdi-delete-forever"
                    block
                    variant="outlined"
                  >
                    Reset All Progress
                  </v-btn>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useWordsStore } from '@/stores/useWordsStore';
import { downloadCsv } from '@/utils/csv';
import { saveQuizErrors, loadQuizErrors } from '@/utils/idb';
import StarButton from '@/components/StarButton.vue';

const wordsStore = useWordsStore();

// Local state
const loading = ref(false);
const todaysQuizErrors = ref<Array<{
  question: string;
  correctAnswer: string;
  userAnswer: string;
  timestamp: string;
}>>([]);

// Simple computed properties
const totalWords = computed(() => wordsStore.totalWords);

const errorRate = computed(() => wordsStore.errorRate);

const practicedToday = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return wordsStore.getAllItems().filter(word => {
    if (!word.last_review) return false;
    const reviewDate = new Date(word.last_review);
    reviewDate.setHours(0, 0, 0, 0);
    return reviewDate.getTime() === today.getTime();
  }).length;
});

const masteredWords = computed(() => {
  return wordsStore.getAllItems().filter(word => word.times >= 5 && word.errors === 0).length;
});

// Methods
function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getWordStars(question: string, correctAnswer: string): number {
  // Find the word item that matches this error
  const wordItem = wordsStore.getAllItems().find(item => 
    item.text_src === question && item.text_tgt === correctAnswer
  );
  return wordItem?.stars || 0;
}

function updateWordStars(question: string, correctAnswer: string, newStars: number): void {
  // Find and update the word item that matches this error
  const wordItem = wordsStore.getAllItems().find(item => 
    item.text_src === question && item.text_tgt === correctAnswer
  );
  
  if (wordItem) {
    wordsStore.updateItem(wordItem.id, { stars: newStars });
    console.log(`Updated stars for "${question} → ${correctAnswer}" to ${newStars}`);
  } else {
    console.warn(`Could not find word item for "${question} → ${correctAnswer}"`);
  }
}

function exportCsv() {
  const csvContent = wordsStore.exportCsv();
  const timestamp = new Date().toISOString().split('T')[0];
  downloadCsv(csvContent, `words-${timestamp}.csv`);
}

function clearTodaysErrors() {
  if (confirm('Clear today\'s quiz errors? This action cannot be undone.')) {
    todaysQuizErrors.value = [];
    saveQuizErrors([]);
  }
}

async function refreshStats() {
  // Show loading state and reload the data
  loading.value = true;
  await loadTodaysErrors();
  loading.value = false;
}

function clearAllProgress() {
  if (confirm('Are you sure you want to reset all learning progress? This action cannot be undone.')) {
    wordsStore.getAllItems().forEach(word => {
      wordsStore.updateItem(word.id, {
        times: 0,
        errors: 0,
        spell_errors: 0,
        last_review: '',
      });
    });
  }
}

async function loadTodaysErrors() {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const allErrors = await loadQuizErrors();
    
    // Filter errors from today and sort by timestamp (newest first)
    const todaysErrors = allErrors.filter(error => 
      error.timestamp.startsWith(today)
    ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    todaysQuizErrors.value = todaysErrors;
    console.log(`Loaded ${todaysErrors.length} quiz errors for today`);
  } catch (error) {
    console.error('Failed to load quiz errors:', error);
    todaysQuizErrors.value = [];
  }
}

// Auto-refresh todays errors periodically
let refreshInterval: number | null = null;

// Set up page visibility change listener to refresh when user returns to tab
function handleVisibilityChange() {
  if (!document.hidden) {
    // User returned to the tab, refresh the errors
    loadTodaysErrors();
  }
}

// Listen for storage changes (when data is updated in another tab/window)
function handleStorageChange(event: StorageEvent) {
  if (event.key === 'polyglot_quiz_errors' || event.key === null) {
    // Quiz errors were updated, refresh our data
    loadTodaysErrors();
  }
}

// Lifecycle
onMounted(async () => {
  loading.value = true;
  await wordsStore.restore();
  await loadTodaysErrors();
  loading.value = false;
  
  // Set up auto-refresh every 10 seconds
  refreshInterval = window.setInterval(() => {
    loadTodaysErrors();
  }, 10000);
  
  // Listen for page visibility changes
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Listen for window focus to refresh when user switches back
  window.addEventListener('focus', loadTodaysErrors);
  
  // Listen for storage changes (IndexedDB updates from other tabs)
  window.addEventListener('storage', handleStorageChange);
});

// Cleanup on unmount
onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  window.removeEventListener('focus', loadTodaysErrors);
  window.removeEventListener('storage', handleStorageChange);
});
</script>

<style scoped>
.stats-view-container {
  width: 100%;
  max-width: none;
  padding: 16px;
  margin: 0 auto;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

/* Stats Cards */
.stats-card {
  transition: all 0.3s ease;
  border-radius: 16px;
  overflow: hidden;
  background: white;
}

.stats-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
}

/* Error items */
.error-item {
  border-left: 4px solid #f44336;
  margin-bottom: 8px;
  border-radius: 0 8px 8px 0;
}

.error-item:hover {
  background-color: rgba(244, 67, 54, 0.04);
}

/* Star button and timestamp alignment */
.error-item .v-list-item__append {
  align-items: center;
  gap: 8px;
}

/* Responsive design */
@media (min-width: 1400px) {
  .stats-view-container {
    padding: 24px 48px;
  }
}

@media (min-width: 1920px) {
  .stats-view-container {
    padding: 32px 64px;
  }
}

@media (max-width: 768px) {
  .stats-view-container {
    padding: 8px;
  }
  
  .stats-card .v-card-text {
    padding: 20px !important;
  }
}

/* Button hover effects */
.v-btn {
  transition: all 0.3s ease;
}

.v-btn:hover {
  transform: translateY(-1px);
}
</style>
