<template>
  <div class="quiz-view-container">
    <v-container fluid>
      <!-- Quiz Configuration Dialog -->
      <QuizConfigDialog
        v-model="showConfigDialog"
        @start-quiz="startQuiz"
      />
      
      <!-- Quiz Header -->
      <v-row v-if="quizState !== 'idle'" justify="center" class="mb-4">
        <v-col cols="12" md="8" lg="6">
          <v-card>
            <v-card-text class="pa-4">
              <v-row align="center">
                <v-col cols="6">
                  <div class="text-h6">
                    Question {{ currentQuestionIndex + 1 }} of {{ quizConfig?.quizNumber || 0 }}
                  </div>
                  <div class="text-body-2 text-grey">
                    {{ getQuizTypeDisplayName(quizConfig?.quizType || '') }}
                  </div>
                </v-col>
                <v-col cols="6" class="text-right">
                  <div class="text-h6">
                    Score: {{ correctAnswers }}/{{ currentQuestionIndex + 1 }}
                  </div>
                  <div class="text-body-2 text-grey">
                    {{ Math.round((correctAnswers / (currentQuestionIndex + 1)) * 100) }}% Accuracy
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      
      <!-- Quiz Question -->
      <v-row v-if="quizState === 'question'" justify="center">
        <v-col cols="12" md="8" lg="6">
          <v-card class="elevation-8">
          <v-card-title class="text-center pa-4">
            <v-icon left>mdi-help-circle</v-icon>
              {{ getQuizTypeDisplayName(quizConfig?.quizType || '') }}
          </v-card-title>
          
          <v-card-text class="pa-8">
              <!-- Word Meaning Quiz -->
              <div v-if="quizConfig?.quizType === 'word_meaning'" class="text-center">
                <div class="text-h4 mb-4">{{ currentQuestion.text_src }}</div>
            <div class="text-body-1 text-grey mb-6">
              {{ getLanguageDisplayName(currentQuestion.lang_src) }} → {{ getLanguageDisplayName(currentQuestion.lang_tgt) }}
            </div>
            
                <!-- Audio Play Button -->
                <v-btn
                  @click="playQuestionAudio"
                  color="primary"
                  variant="outlined"
                  class="mb-6"
                  prepend-icon="mdi-volume-high"
                >
                  Play Question
                </v-btn>
                
                <!-- Answer Options -->
                <div class="answer-options" :class="{ 'answer-options-6': answerOptions.length === 6 }">
                  <v-btn
                    v-for="(option, index) in answerOptions"
                    :key="index"
                    @click="selectAnswer(option)"
                    :disabled="selectedAnswer !== null"
                    :variant="selectedAnswer === option ? 'elevated' : 'outlined'"
                    :color="selectedAnswer === option ? 'primary' : 'default'"
                    class="ma-1"
                    size="large"
                    block
                  >
                    {{ option }}
                  </v-btn>
                </div>
              </div>
              
              <!-- Sound to Meaning Quiz -->
              <div v-else-if="quizConfig?.quizType === 'sound_meaning'" class="text-center">
                <div class="text-h4 mb-4">🎵 Listen to the audio</div>
                <div class="text-body-1 text-grey mb-6">
                  What does this mean in {{ getLanguageDisplayName(currentQuestion.lang_tgt) }}?
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
                  Play Audio
                </v-btn>
                
                <!-- Answer Options -->
                <div class="answer-options" :class="{ 'answer-options-6': answerOptions.length === 6 }">
                  <v-btn
                    v-for="(option, index) in answerOptions"
                    :key="index"
                    @click="selectAnswer(option)"
                    :disabled="selectedAnswer !== null"
                    :variant="selectedAnswer === option ? 'elevated' : 'outlined'"
                    :color="selectedAnswer === option ? 'primary' : 'default'"
                    class="ma-1"
                    size="large"
                    block
                  >
                    {{ option }}
                  </v-btn>
                </div>
              </div>
              
              <!-- Spelling Quiz -->
              <div v-else-if="quizConfig?.quizType === 'spelling'">
                <SpellingQuiz
                  :question="currentQuestion"
                  @answer="handleSpellingAnswer"
                  @skip="skipQuestion"
                />
              </div>
            </v-card-text>
            
            <v-card-actions v-if="quizConfig?.quizType !== 'spelling'" class="justify-center pa-4">
              <v-btn
                @click="skipQuestion"
                color="error"
                variant="outlined"
                prepend-icon="mdi-skip-next"
              >
                Skip
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
      
      <!-- Quiz Result -->
      <v-row v-if="quizState === 'result'" justify="center">
        <v-col cols="12" md="8" lg="6">
          <v-card class="elevation-8">
            <v-card-title class="text-center pa-4">
              <v-icon :color="isCorrect ? 'success' : 'error'" size="48">
                {{ isCorrect ? 'mdi-check-circle' : 'mdi-close-circle' }}
              </v-icon>
              <div class="text-h5 mt-2">
                {{ isCorrect ? 'Correct!' : 'Incorrect' }}
              </div>
            </v-card-title>
            
            <v-card-text class="pa-8">
              <!-- Show correct answer and user's answer -->
              <div class="text-center mb-6">
                <div v-if="quizConfig?.quizType === 'word_meaning' || quizConfig?.quizType === 'sound_meaning'">
                  <div class="text-h6 mb-2">Question:</div>
                  <div class="text-h4 mb-4">{{ currentQuestion.text_src }}</div>
                  <div class="text-h6 mb-2">Correct Answer:</div>
                  <div class="text-h4 text-success">{{ currentQuestion.text_tgt }}</div>
                  <div v-if="selectedAnswer" class="text-h6 mt-2">
                    Your Answer: 
                    <span :class="isCorrect ? 'text-success' : 'text-error'">
                      {{ selectedAnswer }}
                    </span>
                  </div>
                </div>
                
                <div v-else-if="quizConfig?.quizType === 'spelling'">
                  <div class="text-h6 mb-2">Word:</div>
                  <div class="text-h4 mb-4">{{ currentQuestion.text_tgt }}</div>
                  <div class="text-h6 mb-2">Your Spelling:</div>
                  <div class="spelling-result">
                    <span
                      v-for="(char, index) in spellingAnswer"
                      :key="index"
                      :class="getSpellingCharClass(char, index)"
                      class="spelling-char"
                    >
                      {{ char }}
                    </span>
                  </div>
                </div>
              </div>
              
              <!-- Audio Controls -->
              <div class="text-center mb-6">
                <v-btn
                  @click="playQuestionAudio"
                  color="primary"
                  variant="outlined"
                  class="ma-2"
                  prepend-icon="mdi-volume-high"
                >
                  Play Question
                </v-btn>
                <v-btn
                  @click="playAnswerAudio"
                  color="secondary"
                  variant="outlined"
                  class="ma-2"
                  prepend-icon="mdi-volume-high"
                >
                  Play Answer
                </v-btn>
              </div>
              
              <!-- Navigation Instruction -->
              <div class="text-center text-body-2 text-grey mb-4">
                Press <kbd class="instruction-key">SPACE</kbd> or click "Next Question" to continue
              </div>
              
              
              <!-- Notes -->
              <div v-if="currentQuestion.notes" class="text-center">
                <v-icon left>mdi-note-text</v-icon>
                {{ currentQuestion.notes }}
            </div>
          </v-card-text>
          
          <v-card-actions class="justify-center pa-4">
              <v-btn
                @click="nextQuestion"
                color="primary"
                size="large"
                prepend-icon="mdi-skip-next"
              >
                {{ isLastQuestion ? 'Finish Quiz' : 'Next Question' }}
              </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    
      <!-- Quiz Results Summary -->
      <v-row v-if="quizState === 'completed'" justify="center">
      <v-col cols="12" md="8" lg="6">
          <v-card class="elevation-8">
            <v-card-title class="text-center pa-4">
              <v-icon color="success" size="48">mdi-trophy</v-icon>
              <div class="text-h4 mt-2">Quiz Completed!</div>
            </v-card-title>
            
            <v-card-text class="pa-8">
              <v-row class="text-center">
                <v-col cols="6">
                  <div class="text-h3 text-success">{{ correctAnswers }}</div>
                  <div class="text-body-1 text-grey">Correct</div>
              </v-col>
                <v-col cols="6">
                  <div class="text-h3 text-error">{{ incorrectAnswers }}</div>
                  <div class="text-body-1 text-grey">Incorrect</div>
              </v-col>
              </v-row>
              
              <v-row class="text-center mt-4">
                <v-col cols="12">
                  <div class="text-h4">{{ Math.round((correctAnswers / (quizConfig?.quizNumber || 1)) * 100) }}%</div>
                  <div class="text-body-1 text-grey">Accuracy</div>
      </v-col>
    </v-row>
    
              <!-- Question-by-Question Results -->
              <v-divider class="my-6" />
              <div class="text-h6 mb-4">Question Results</div>
              <v-list>
                <v-list-item
                  v-for="(result, index) in quizResults"
                  :key="index"
                  :class="{ 'correct-answer': result.isCorrect, 'incorrect-answer': !result.isCorrect }"
                >
                  <template #prepend>
                    <v-icon :color="result.isCorrect ? 'success' : 'error'">
                      {{ result.isCorrect ? 'mdi-check-circle' : 'mdi-close-circle' }}
                    </v-icon>
                  </template>
                  
                  <v-list-item-title class="text-h6 mb-2">
                    {{ result.question }} - {{ result.correctAnswer }}
                  </v-list-item-title>
                  
                  <v-list-item-subtitle v-if="!result.isCorrect" class="text-error">
                    <strong>Your answer:</strong> {{ result.userAnswer === 'SKIPPED' ? 'Skipped' : result.userAnswer }}
                  </v-list-item-subtitle>
                  
                  <template #append>
                    <StarButton
                      :stars="result.stars"
                      @update:stars="(newStars) => updateResultStars(index, newStars)"
                    />
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
            
            <v-card-actions class="justify-center pa-4">
              <v-btn
                @click="startNewQuiz"
                color="primary"
                size="large"
                prepend-icon="mdi-play"
              >
                New Quiz
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
      
      <!-- Idle State -->
      <v-row v-if="quizState === 'idle'" justify="center">
        <v-col cols="12" md="8" lg="6">
          <v-card class="elevation-8">
            <v-card-text class="text-center pa-8">
              <v-icon size="64" color="primary">mdi-help-circle-outline</v-icon>
              <div class="text-h4 mt-4">Ready to Quiz?</div>
              <div class="text-body-1 text-grey mt-2 mb-6">
                Configure your quiz settings and start learning!
              </div>
              <v-btn
                @click="showConfigDialog = true"
                color="primary"
                size="large"
                prepend-icon="mdi-cog"
              >
                Configure Quiz
              </v-btn>
          </v-card-text>
        </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useWordsStore } from '@/stores/useWordsStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { normalizeText, isSimilarText } from '@/utils/normalize';
import { saveQuizErrors, loadQuizErrors } from '@/utils/idb';
import QuizConfigDialog from '@/components/QuizConfigDialog.vue';
import type { QuizConfig } from '@/types';
import StarButton from '@/components/StarButton.vue';
import SpellingQuiz from '@/components/SpellingQuiz.vue';
import type { WordItem } from '@/types';

const router = useRouter();
const wordsStore = useWordsStore();
const settingsStore = useSettingsStore();

// Quiz state
type QuizState = 'idle' | 'question' | 'result' | 'completed';

const quizState = ref<QuizState>('idle');
const showConfigDialog = ref(false);
const quizConfig = ref<QuizConfig | null>(null);
const quizWords = ref<WordItem[]>([]);
const currentQuestionIndex = ref(0);
const selectedAnswer = ref<string | null>(null);
const spellingAnswer = ref('');
const isCorrect = ref(false);
const correctAnswers = ref(0);
const incorrectAnswers = ref(0);
const skipCount = ref(0);
const autoNextTimer = ref<number | null>(null);
const quizResults = ref<Array<{
  question: string;
  questionLang: string;
  correctAnswer: string;
  answerLang: string;
  userAnswer: string;
  isCorrect: boolean;
  wordId: string;
  stars: number;
}>>([]);

// Computed properties
const currentQuestion = computed(() => {
  return quizWords.value[currentQuestionIndex.value] || null;
});

const answerOptions = computed(() => {
  if (!currentQuestion.value || !quizConfig.value) return [];
  
  // Determine number of options based on language selection
  const isRandomLanguage = quizConfig.value.questionLanguage === 'all' || quizConfig.value.answerLanguage === 'all';
  const totalOptions = isRandomLanguage ? 6 : 4;
  const wrongAnswersNeeded = totalOptions - 1; // -1 for the correct answer
  
  const correctAnswer = currentQuestion.value.text_tgt;
  const questionLang = currentQuestion.value.lang_src;
  const answerLang = currentQuestion.value.lang_tgt;
  
  // Strategy 1: Get other translations of the same word in the answer language
  let wrongAnswers: string[] = [];
  
  // Find the same word in other language pairs
  const sameWordPairs = quizWords.value.filter(word => 
    word.id.split('_')[0] === currentQuestion.value!.id.split('_')[0] && // Same word
    word.lang_tgt === answerLang && // Same answer language
    word.text_tgt !== correctAnswer // Different text
  );
  
  wrongAnswers = sameWordPairs.map(word => word.text_tgt);
  
  // Strategy 2: Get other words in the same answer language
  if (wrongAnswers.length < wrongAnswersNeeded) {
    const otherWords = quizWords.value
      .filter(word => 
        word.id.split('_')[0] !== currentQuestion.value!.id.split('_')[0] && // Different word
        word.lang_tgt === answerLang && // Same answer language
        word.text_tgt !== correctAnswer // Different text
      )
      .map(word => word.text_tgt);
    
    wrongAnswers = [...wrongAnswers, ...otherWords];
  }
  
  // Strategy 3: Get words from any language (but not question language)
  if (wrongAnswers.length < wrongAnswersNeeded) {
    const anyLanguageWords = quizWords.value
      .filter(word => 
        word.lang_tgt !== questionLang && // Not the same as question language
        word.text_tgt !== correctAnswer // Different text
      )
      .map(word => word.text_tgt);
    
    wrongAnswers = [...wrongAnswers, ...anyLanguageWords];
  }
  
  // Remove duplicates and the correct answer
  const uniqueWrongAnswers = [...new Set(wrongAnswers)]
    .filter(answer => answer !== correctAnswer)
    .slice(0, wrongAnswersNeeded);
  
  // Strategy 4: Create variations if still not enough
  while (uniqueWrongAnswers.length < wrongAnswersNeeded) {
    const variations = [
      correctAnswer + 's', // plural
      correctAnswer.slice(0, -1) + 'e', // variation
      correctAnswer.slice(0, -2) + 'er', // variation
      'le ' + correctAnswer, // with article
      'la ' + correctAnswer, // with article
      correctAnswer.charAt(0).toUpperCase() + correctAnswer.slice(1), // capitalized
    ];
    
    const randomVariation = variations[Math.floor(Math.random() * variations.length)];
    if (!uniqueWrongAnswers.includes(randomVariation) && randomVariation !== correctAnswer) {
      uniqueWrongAnswers.push(randomVariation);
    } else {
      // Fallback to generic answers
      const genericAnswers = ['Option A', 'Option B', 'Option C', 'Option D', 'Option E', 'Option F'];
      const randomGeneric = genericAnswers[Math.floor(Math.random() * genericAnswers.length)];
      if (!uniqueWrongAnswers.includes(randomGeneric)) {
        uniqueWrongAnswers.push(randomGeneric);
      }
    }
  }
  
  // Shuffle and return with correct answer
  const options = [correctAnswer, ...uniqueWrongAnswers];
  console.log(`[DEBUG] Generated ${options.length} options for ${isRandomLanguage ? 'random' : 'specific'} language quiz:`, options);
  console.log(`[DEBUG] Question: ${currentQuestion.value.text_src} (${questionLang}) → Answer: ${correctAnswer} (${answerLang})`);
  return shuffleArray(options);
});

const isLastQuestion = computed(() => {
  return currentQuestionIndex.value >= quizConfig.value!.quizNumber - 1;
});

// Methods
function getQuizTypeDisplayName(type: string): string {
  const types: Record<string, string> = {
    'word_meaning': 'Word Meaning',
    'sound_meaning': 'Sound to Meaning',
    'spelling': 'Spelling'
  };
  return types[type] || type;
}

function getQuizOrderDisplayName(order: string): string {
  const orders: Record<string, string> = {
    'random': 'Random',
    'lastreview': 'By Last Review',
    'errors': 'By Error Count',
    'stars': 'By Stars'
  };
  return orders[order] || order;
}

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

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generateQuizWords(config: QuizConfig): WordItem[] {
  let words: WordItem[] = [];
  
  // Generate all possible word pairs based on configuration
  wordsStore.rows.forEach(row => {
    const languages = Object.keys(row.words);
    
    if (config.questionLanguage === 'all' && config.answerLanguage === 'all') {
      // For random-random mode, create one random pair per word
      if (languages.length >= 2) {
        // Randomly select two different languages
        const shuffledLangs = [...languages].sort(() => Math.random() - 0.5);
        const questionLang = shuffledLangs[0];
        const answerLang = shuffledLangs[1];
        
        words.push({
          id: `${row.id}_${questionLang}_${answerLang}`,
          lang_src: questionLang,
          lang_tgt: answerLang,
          text_src: row.words[questionLang],
          text_tgt: row.words[answerLang],
          times: row.times,
          errors: row.errors,
          last_review: row.last_review,
          spell_errors: row.spell_errors,
          notes: row.notes,
          stars: row.stars,
        });
      }
    } else if (config.questionLanguage === 'all') {
      // All languages as question, specific as answer
      languages.forEach(lang => {
        if (lang !== config.answerLanguage) {
          words.push({
            id: `${row.id}_${lang}_${config.answerLanguage}`,
            lang_src: lang,
            lang_tgt: config.answerLanguage,
            text_src: row.words[lang],
            text_tgt: row.words[config.answerLanguage],
            times: row.times,
            errors: row.errors,
            last_review: row.last_review,
            spell_errors: row.spell_errors,
            notes: row.notes,
            stars: row.stars,
          });
        }
      });
    } else if (config.answerLanguage === 'all') {
      // Specific as question, all others as answer
      languages.forEach(lang => {
        if (lang !== config.questionLanguage) {
          words.push({
            id: `${row.id}_${config.questionLanguage}_${lang}`,
            lang_src: config.questionLanguage,
            lang_tgt: lang,
            text_src: row.words[config.questionLanguage],
            text_tgt: row.words[lang],
            times: row.times,
            errors: row.errors,
            last_review: row.last_review,
            spell_errors: row.spell_errors,
            notes: row.notes,
            stars: row.stars,
          });
        }
      });
    } else {
      // Both specific languages
      if (languages.includes(config.questionLanguage) && 
          languages.includes(config.answerLanguage) &&
          config.questionLanguage !== config.answerLanguage) {
        words.push({
          id: `${row.id}_${config.questionLanguage}_${config.answerLanguage}`,
          lang_src: config.questionLanguage,
          lang_tgt: config.answerLanguage,
          text_src: row.words[config.questionLanguage],
          text_tgt: row.words[config.answerLanguage],
          times: row.times,
          errors: row.errors,
          last_review: row.last_review,
          spell_errors: row.spell_errors,
          notes: row.notes,
          stars: row.stars,
        });
      }
    }
  });
  
  // Apply sorting
  switch (config.quizOrder) {
    case 'lastreview':
      words.sort((a, b) => {
        const aDate = new Date(a.last_review || 0).getTime();
        const bDate = new Date(b.last_review || 0).getTime();
        return aDate - bDate;
      });
      break;
    case 'errors':
      words.sort((a, b) => b.errors - a.errors);
      break;
    case 'stars':
      words.sort((a, b) => b.stars - a.stars);
      break;
    case 'random':
    default:
      words = shuffleArray(words);
      break;
  }
  
  // Limit to requested number
  return words.slice(0, config.quizNumber);
}

function startQuiz(config: QuizConfig) {
  quizConfig.value = config;
  quizWords.value = generateQuizWords(config);
  
  if (quizWords.value.length === 0) {
    alert('No words available for this configuration!');
    return;
  }
  
  // Reset quiz state
  currentQuestionIndex.value = 0;
  selectedAnswer.value = null;
  spellingAnswer.value = '';
  isCorrect.value = false;
  correctAnswers.value = 0;
  incorrectAnswers.value = 0;
  skipCount.value = 0;
  quizResults.value = [];
  
  quizState.value = 'question';
  
  // Auto-play question audio for all quiz types
  setTimeout(() => playQuestionAudio(), 500);
}

async function selectAnswer(answer: string) {
  if (selectedAnswer.value !== null) return;
  
  selectedAnswer.value = answer;
  isCorrect.value = answer === currentQuestion.value!.text_tgt;
  
  if (isCorrect.value) {
    correctAnswers.value++;
  } else {
    incorrectAnswers.value++;
  }
  
  // Record quiz result
  await recordQuizResult(answer, isCorrect.value);
  
  // Update word statistics
  updateWordStats(isCorrect.value);
  
  // Show result
  quizState.value = 'result';
  
  // Auto-play correct answer audio
  setTimeout(() => playAnswerAudio(), 500);
  
  // Auto-advance after 5 seconds
  autoNextTimer.value = window.setTimeout(() => {
    nextQuestion();
  }, 5000);
}

async function handleSpellingAnswer(answer: string, isCorrectAnswer: boolean) {
  if (selectedAnswer.value !== null) return;
  
  selectedAnswer.value = answer;
  isCorrect.value = isCorrectAnswer;
  
  if (isCorrect.value) {
    correctAnswers.value++;
  } else {
    incorrectAnswers.value++;
  }
  
  // Record quiz result
  await recordQuizResult(answer, isCorrect.value);
  
  // Update word statistics
  updateWordStats(isCorrect.value);
  
  // Show result
  quizState.value = 'result';
  
  // Auto-play correct answer audio
  setTimeout(() => playAnswerAudio(), 500);
  
  // Auto-advance after 5 seconds
  autoNextTimer.value = window.setTimeout(() => {
    nextQuestion();
  }, 5000);
}

function getSpellingCharClass(char: string, index: number): string {
  if (!currentQuestion.value) return '';
  
  const correctText = currentQuestion.value.text_tgt.toLowerCase();
  const userText = spellingAnswer.value.toLowerCase();
  
  if (index >= correctText.length) return 'text-error';
  if (index >= userText.length) return 'text-grey';
  
  return correctText[index] === userText[index] ? 'text-success' : 'text-error';
}

async function skipQuestion() {
  if (selectedAnswer.value !== null) return;
  
  selectedAnswer.value = 'SKIPPED';
  isCorrect.value = false;
  incorrectAnswers.value++;
  skipCount.value++;
  
  // Record quiz result
  await recordQuizResult('SKIPPED', false);
  
  // Update word statistics (count as error)
  updateWordStats(false);
  
  quizState.value = 'result';
  
  // Auto-play correct answer audio
  setTimeout(() => playAnswerAudio(), 500);
  
  // Auto-advance after 5 seconds
  autoNextTimer.value = window.setTimeout(() => {
    nextQuestion();
  }, 5000);
}

function nextQuestion() {
  // Clear auto-advance timer
  if (autoNextTimer.value) {
    clearTimeout(autoNextTimer.value);
    autoNextTimer.value = null;
  }
  
  if (isLastQuestion.value) {
    // Quiz completed
    quizState.value = 'completed';
  } else {
    // Next question
    currentQuestionIndex.value++;
    selectedAnswer.value = null;
    spellingAnswer.value = '';
    isCorrect.value = false;
    quizState.value = 'question';
    
    // Auto-play question audio for all quiz types
    setTimeout(() => playQuestionAudio(), 500);
  }
}

async function recordQuizResult(userAnswer: string, isCorrect: boolean) {
  if (!currentQuestion.value) return;
  
  const result = {
    question: currentQuestion.value.text_src,
    questionLang: currentQuestion.value.lang_src,
    correctAnswer: currentQuestion.value.text_tgt,
    answerLang: currentQuestion.value.lang_tgt,
    userAnswer: userAnswer,
    isCorrect: isCorrect,
    wordId: currentQuestion.value.id,
    stars: currentQuestion.value.stars,
  };
  
  quizResults.value.push(result);
  
  // Save error to persistent storage if incorrect
  if (!isCorrect) {
    try {
      const existingErrors = await loadQuizErrors();
      const newError = {
        question: currentQuestion.value.text_src,
        correctAnswer: currentQuestion.value.text_tgt,
        userAnswer: userAnswer,
        timestamp: new Date().toISOString(),
      };
      existingErrors.push(newError);
      await saveQuizErrors(existingErrors);
      console.log(`Saved quiz error: ${newError.question} → ${newError.correctAnswer} (User: ${newError.userAnswer})`);
    } catch (error) {
      console.error('Failed to save quiz error:', error);
    }
  }
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

async function playQuestionAudio() {
  if (!currentQuestion.value) return;
  
  try {
    await settingsStore.speakText(currentQuestion.value.text_src, currentQuestion.value.lang_src);
  } catch (error) {
    console.error('TTS error:', error);
  }
}

async function playAnswerAudio() {
  if (!currentQuestion.value) return;
  
  try {
    await settingsStore.speakText(currentQuestion.value.text_tgt, currentQuestion.value.lang_tgt);
  } catch (error) {
    console.error('TTS error:', error);
  }
}

function onStarsChanged(stars: number) {
  if (!currentQuestion.value) return;
  
  wordsStore.updateItem(currentQuestion.value.id, { stars });
}

function updateResultStars(resultIndex: number, newStars: number) {
  // Update the result in the quiz results
  quizResults.value[resultIndex].stars = newStars;
  
  // Update the word in the store
  const result = quizResults.value[resultIndex];
  wordsStore.updateItem(result.wordId, { stars: newStars });
}

function startNewQuiz() {
  quizState.value = 'idle';
  showConfigDialog.value = true;
}

function goHome() {
  router.push('/');
}

// Keyboard shortcuts
function handleKeyPress(event: KeyboardEvent) {
  // Only handle space in result state to prevent TTS interference
  if (quizState.value === 'result' && event.code === 'Space') {
    event.preventDefault();
    nextQuestion();
  }
  
  // Prevent space from triggering other actions during quiz
  if (quizState.value === 'question' && event.code === 'Space') {
    // Only prevent default if we're in a spelling quiz (to avoid TTS issues)
    if (quizConfig.value?.quizType === 'spelling') {
      event.preventDefault();
    }
  }
}

// Lifecycle
onMounted(async () => {
  await wordsStore.restore();
  await settingsStore.loadSettings();
  document.addEventListener('keydown', handleKeyPress);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyPress);
  if (autoNextTimer.value) {
    clearTimeout(autoNextTimer.value);
  }
});
</script>

<style scoped>
.quiz-view-container {
  width: 100%;
  max-width: none;
  padding: 16px;
  margin: 0 auto;
}

.answer-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.answer-options-6 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

@media (max-width: 768px) {
  .answer-options-6 {
    grid-template-columns: 1fr;
  }
}

.instruction-key {
  background-color: #f5f5f5;
  border: 1px solid #ccc;
  border-radius: 3px;
  padding: 2px 6px;
  font-family: monospace;
  font-size: 0.9em;
  font-weight: bold;
}

.correct-answer {
  background-color: rgba(76, 175, 80, 0.1);
  border-left: 4px solid #4caf50;
}

.incorrect-answer {
  background-color: rgba(244, 67, 54, 0.1);
  border-left: 4px solid #f44336;
}

.spelling-result {
  font-size: 1.5rem;
  font-weight: bold;
  letter-spacing: 2px;
}

.spelling-char {
  display: inline-block;
  margin: 0 2px;
  padding: 2px 4px;
  border-radius: 4px;
}

.text-success {
  color: #4caf50 !important;
  background-color: rgba(76, 175, 80, 0.1);
}

.text-error {
  color: #f44336 !important;
  background-color: rgba(244, 67, 54, 0.1);
}

.text-grey {
  color: #9e9e9e !important;
}

/* Responsive design */
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
  
  .answer-options {
    gap: 4px;
  }
}
</style>