<template>
  <div class="quiz-view-container">
    <v-container fluid>
      <v-row justify="center">
        <v-col cols="12" md="8" lg="6" xl="4">
        <v-card v-if="currentQuestion" class="elevation-8">
          <v-card-title class="text-center pa-4">
            <v-icon left>mdi-help-circle</v-icon>
            Quiz Mode
          </v-card-title>
          
          <v-card-text class="pa-8">
            <div class="text-h5 mb-4">{{ currentQuestion.text_src }}</div>
            <div class="text-body-1 text-grey mb-6">
              {{ getLanguageDisplayName(currentQuestion.lang_src) }} → {{ getLanguageDisplayName(currentQuestion.lang_tgt) }}
            </div>
            
            <v-text-field
              v-model="userAnswer"
              :label="`Translate to ${getLanguageDisplayName(currentQuestion.lang_tgt)}`"
              @keyup.enter="checkAnswer"
              :disabled="showResult"
              autofocus
            />
            
            <div v-if="showResult" class="mt-4">
              <v-alert
                :type="isCorrect ? 'success' : 'error'"
                :text="isCorrect ? 'Correct!' : `Incorrect. The answer is: ${currentQuestion.text_tgt}`"
                class="mb-4"
              />
              
              <div v-if="currentQuestion.notes" class="text-body-1">
                <v-icon left>mdi-note-text</v-icon>
                {{ currentQuestion.notes }}
              </div>
            </div>
          </v-card-text>
          
          <v-card-actions class="justify-center pa-4">
            <v-btn
              v-if="!showResult"
              @click="checkAnswer"
              :disabled="!userAnswer.trim()"
              color="primary"
              size="large"
            >
              Check Answer
            </v-btn>
            
            <div v-else class="d-flex gap-4">
              <v-btn
                @click="nextQuestion"
                color="primary"
                size="large"
                prepend-icon="mdi-skip-next"
              >
                Next Question
              </v-btn>
              
              <v-btn
                @click="speakAnswer"
                color="secondary"
                size="large"
                prepend-icon="mdi-volume-high"
              >
                Speak Answer
              </v-btn>
            </div>
          </v-card-actions>
        </v-card>
        
        <v-card v-else class="elevation-8">
          <v-card-text class="text-center pa-8">
            <v-icon size="64" color="grey">mdi-help-circle-outline</v-icon>
            <div class="text-h5 mt-4">No questions available</div>
            <div class="text-body-1 text-grey mt-2">
              Add some words to start quizzing!
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Quiz Stats -->
    <v-row justify="center" class="mt-4">
      <v-col cols="12" md="8" lg="6">
        <v-card>
          <v-card-text>
            <v-row>
              <v-col cols="6" md="3" class="text-center">
                <div class="text-h4">{{ correctAnswers }}</div>
                <div class="text-body-2 text-grey">Correct</div>
              </v-col>
              
              <v-col cols="6" md="3" class="text-center">
                <div class="text-h4">{{ incorrectAnswers }}</div>
                <div class="text-body-2 text-grey">Incorrect</div>
              </v-col>
              
              <v-col cols="6" md="3" class="text-center">
                <div class="text-h4">{{ currentQuestionIndex + 1 }}</div>
                <div class="text-body-2 text-grey">Question</div>
              </v-col>
              
              <v-col cols="6" md="3" class="text-center">
                <div class="text-h4">{{ accuracy }}%</div>
                <div class="text-body-2 text-grey">Accuracy</div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Quiz Controls -->
    <v-row justify="center" class="mt-4">
      <v-col cols="12" md="8" lg="6">
        <v-card>
          <v-card-text class="text-center">
            <div class="d-flex justify-center gap-4">
              <v-btn
                @click="startNewQuiz"
                color="primary"
                prepend-icon="mdi-play"
              >
                New Quiz
              </v-btn>
              
              <v-btn
                @click="shuffleQuestions"
                color="secondary"
                prepend-icon="mdi-shuffle"
              >
                Shuffle
              </v-btn>
              
              <v-btn
                @click="resetStats"
                color="error"
                prepend-icon="mdi-refresh"
              >
                Reset Stats
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useWordsStore } from '@/stores/useWordsStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { getLanguageDisplayName, normalizeText, isSimilarText } from '@/utils/normalize';
import type { WordItem } from '@/types';

const wordsStore = useWordsStore();
const settingsStore = useSettingsStore();

// Local state
const currentQuestionIndex = ref(0);
const userAnswer = ref('');
const showResult = ref(false);
const isCorrect = ref(false);
const correctAnswers = ref(0);
const incorrectAnswers = ref(0);
const quizWords = ref<WordItem[]>([]);

// Computed
const currentQuestion = computed(() => {
  return quizWords.value[currentQuestionIndex.value] || null;
});

const accuracy = computed(() => {
  const total = correctAnswers.value + incorrectAnswers.value;
  return total > 0 ? Math.round((correctAnswers.value / total) * 100) : 0;
});

// Methods
function startNewQuiz() {
  // For quiz, we'll use all available language pairs for now
  // In the future, this could be made configurable
  quizWords.value = [...wordsStore.getAllItems()];
  currentQuestionIndex.value = 0;
  userAnswer.value = '';
  showResult.value = false;
  correctAnswers.value = 0;
  incorrectAnswers.value = 0;
}

function shuffleQuestions() {
  const words = [...quizWords.value];
  for (let i = words.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [words[i], words[j]] = [words[j], words[i]];
  }
  quizWords.value = words;
  currentQuestionIndex.value = 0;
  userAnswer.value = '';
  showResult.value = false;
}

function checkAnswer() {
  if (!currentQuestion.value || !userAnswer.value.trim()) return;
  
  const correctText = currentQuestion.value.text_tgt;
  const userText = userAnswer.value.trim();
  
  // Check for exact match first
  if (correctText.toLowerCase() === userText.toLowerCase()) {
    isCorrect.value = true;
    correctAnswers.value++;
  } else {
    // Check for similar text (fuzzy matching)
    isCorrect.value = isSimilarText(correctText, userText, 0.8);
    if (isCorrect.value) {
      correctAnswers.value++;
    } else {
      incorrectAnswers.value++;
    }
  }
  
  showResult.value = true;
  
  // Update word statistics
  updateWordStats(isCorrect.value);
}

function updateWordStats(correct: boolean) {
  if (!currentQuestion.value) return;
  
  const updatedWord = {
    ...currentQuestion.value,
    times: currentQuestion.value.times + 1,
    errors: correct ? currentQuestion.value.errors : currentQuestion.value.errors + 1,
    last_review: new Date().toISOString(),
  };
  
  wordsStore.updateItem(currentQuestion.value.id, updatedWord);
}

function nextQuestion() {
  currentQuestionIndex.value++;
  userAnswer.value = '';
  showResult.value = false;
  isCorrect.value = false;
}

async function speakAnswer() {
  if (!currentQuestion.value) return;
  
  try {
    await settingsStore.speakText(currentQuestion.value.text_tgt, currentQuestion.value.lang_tgt);
  } catch (error) {
    console.error('TTS error:', error);
  }
}

function resetStats() {
  correctAnswers.value = 0;
  incorrectAnswers.value = 0;
  currentQuestionIndex.value = 0;
  userAnswer.value = '';
  showResult.value = false;
}

// Initialize
onMounted(async () => {
  await wordsStore.restore();
  await settingsStore.loadSettings();
  startNewQuiz();
});
</script>

<style scoped>
.quiz-view-container {
  width: 100%;
  max-width: none;
  padding: 16px;
  margin: 0 auto;
}

/* Responsive design for wide screens */
@media (min-width: 1400px) {
  .quiz-view-container {
    padding: 24px 48px;
  }
}

@media (min-width: 1920px) {
  .quiz-view-container {
    padding: 32px 64px;
  }
}

@media (max-width: 768px) {
  .quiz-view-container {
    padding: 8px;
  }
}
</style>
