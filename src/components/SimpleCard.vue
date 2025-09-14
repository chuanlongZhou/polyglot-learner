<template>
  <div class="card-container" :class="cardModeClass" @click="handleCardClick">
    <div class="card-inner" :class="{ 'flipped': isFlipped }">
      <div class="card-front">
        <v-card elevation="8" class="h-100 card-front-style">
          <v-card-text class="text-center pa-8 d-flex align-center justify-center h-100 position-relative">
            <div :class="textClass">{{ word.text_src }}</div>
            <StarButton 
              :stars="word.stars" 
              @update:stars="handleStarUpdate"
              class="star-button"
            />
          </v-card-text>
        </v-card>
      </div>
      
      <div class="card-back">
        <v-card elevation="8" class="h-100 card-back-style">
          <v-card-text class="text-center pa-8 d-flex flex-column align-center justify-center h-100 position-relative">
            <div :class="textClass + ' mb-4'">{{ word.text_tgt }}</div>
            
            <div v-if="word.notes" class="text-body-1 text-thin mt-4 notes-text">
              {{ word.notes }}
            </div>
            <StarButton 
              :stars="word.stars" 
              @update:stars="handleStarUpdate"
              class="star-button"
            />
          </v-card-text>
        </v-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useWordsStore } from '@/stores/useWordsStore';
import { getLanguageDisplayName } from '@/utils/normalize';
import StarButton from '@/components/StarButton.vue';
import type { WordItem } from '@/types';

const settingsStore = useSettingsStore();
const wordsStore = useWordsStore();

// Props
const props = defineProps<{
  word: WordItem;
  frontLanguage: string;
  backLanguage: string;
  isSingleCardMode?: boolean;
  autoPlay?: boolean;
  cardMode?: 'single' | 'multiple';
}>();

// Emits
const emit = defineEmits<{
  (e: 'next-card'): void;
}>();

// Expose methods for parent component
defineExpose({
  handleSpaceKey
});

// Local state
const isFlipped = ref(false);
const autoNextTimeout = ref<NodeJS.Timeout | null>(null);
const autoPlayInterval = ref<NodeJS.Timeout | null>(null);
const isAutoPlaying = ref(false);
const isCardFront = ref(true); // Track if card is currently showing front (true) or back (false)
const autoFlipBackTimeout = ref<NodeJS.Timeout | null>(null); // For multiple card mode auto-flip-back

// Computed properties for dynamic styling
const cardModeClass = computed(() => {
  return props.cardMode || 'single';
});

const textClass = computed(() => {
  return props.cardMode === 'multiple' ? 'text-h4' : 'text-h2';
});

// Methods
async function handleCardClick(event: MouseEvent) {
  // Check if the click was on the star button
  const target = event.target as HTMLElement;
  if (target.closest('.star-button')) {
    return; // Don't trigger card interaction
  }

  // Clear any existing auto-flip-back timeout
  if (autoFlipBackTimeout.value) {
    clearTimeout(autoFlipBackTimeout.value);
    autoFlipBackTimeout.value = null;
  }

  // Play the front language text
  try {
    await settingsStore.speakText(props.word.text_src, props.word.lang_src);
  } catch (error) {
    console.error('TTS error:', error);
  }

  // Flip the card to show the back
  isFlipped.value = true;
  isCardFront.value = false;

  // Handle different behaviors based on card mode
  if (props.cardMode === 'multiple') {
    // Multiple card mode: play -> flip -> wait 2s -> flip back
    autoFlipBackTimeout.value = setTimeout(() => {
      isFlipped.value = false;
      isCardFront.value = true;
      autoFlipBackTimeout.value = null;
    }, 2000);
  } else if (props.isSingleCardMode && props.autoPlay) {
    // Single card mode with auto-play: play -> flip -> wait 1s -> next card
    autoNextTimeout.value = setTimeout(() => {
      emit('next-card');
    }, 1000);
  }
  // Single card mode without auto-play: just play -> flip (no auto-advance)
}

function handleStarUpdate(newStars: number) {
  // Update the word's star rating in the store
  wordsStore.updateItem(props.word.id, { stars: newStars });
}

// Space key behavior: play sound and flip card
async function handleSpaceKey() {
  // Clear any existing auto-flip-back timeout
  if (autoFlipBackTimeout.value) {
    clearTimeout(autoFlipBackTimeout.value);
    autoFlipBackTimeout.value = null;
  }

  // Play the front language text
  try {
    await settingsStore.speakText(props.word.text_src, props.word.lang_src);
  } catch (error) {
    console.error('TTS error:', error);
  }
  
  // Toggle the card state (flip between front and back)
  isFlipped.value = !isFlipped.value;
  isCardFront.value = !isCardFront.value;

  // Handle different behaviors based on card mode
  if (props.cardMode === 'multiple') {
    // Multiple card mode: play -> flip -> wait 2s -> flip back
    autoFlipBackTimeout.value = setTimeout(() => {
      isFlipped.value = false;
      isCardFront.value = true;
      autoFlipBackTimeout.value = null;
    }, 2000);
  }
  // Single card mode: just play -> flip (no auto-advance for space key)
}

// Auto-play behavior: always convert to front, then play->flip->next->loop
async function performAutoPlay() {
  if (!props.autoPlay || !props.isSingleCardMode) return;
  
  isAutoPlaying.value = true;
  
  // Always ensure card is front for auto-play
  if (!isCardFront.value) {
    isFlipped.value = false;
    isCardFront.value = true;
  }
  
  // Play the front language text
  try {
    await settingsStore.speakText(props.word.text_src, props.word.lang_src);
  } catch (error) {
    console.error('TTS error:', error);
  }
  
  // Flip the card
  isFlipped.value = true;
  isCardFront.value = false;
  
  // Wait 1 second then advance
  autoNextTimeout.value = setTimeout(() => {
    emit('next-card');
  }, 1000);
}


// Watch for auto-play changes
watch(() => props.autoPlay, (newValue) => {
  if (newValue && props.isSingleCardMode) {
    // Start auto-play immediately
    performAutoPlay();
  } else {
    // Stop auto-play
    isAutoPlaying.value = false;
    if (autoNextTimeout.value) {
      clearTimeout(autoNextTimeout.value);
      autoNextTimeout.value = null;
    }
  }
});

// Reset flip state when word changes
watch(() => props.word.id, () => {
  isFlipped.value = false;
  isCardFront.value = true; // Always start with front
  // Clear any pending auto-advance
  if (autoNextTimeout.value) {
    clearTimeout(autoNextTimeout.value);
    autoNextTimeout.value = null;
  }
  // Clear any pending auto-flip-back
  if (autoFlipBackTimeout.value) {
    clearTimeout(autoFlipBackTimeout.value);
    autoFlipBackTimeout.value = null;
  }
  
  // If auto-play is enabled, start the next card automatically
  if (props.autoPlay && props.isSingleCardMode) {
    // Small delay to ensure the card is rendered
    setTimeout(() => {
      performAutoPlay();
    }, 100);
  }
});

// Cleanup on unmount
import { onUnmounted } from 'vue';
onUnmounted(() => {
  if (autoNextTimeout.value) {
    clearTimeout(autoNextTimeout.value);
  }
  if (autoPlayInterval.value) {
    clearInterval(autoPlayInterval.value);
  }
  if (autoFlipBackTimeout.value) {
    clearTimeout(autoFlipBackTimeout.value);
  }
});
</script>

<style scoped>
.card-container {
  cursor: pointer;
  perspective: 1000px;
  margin: 0 auto; /* Center the card */
}

/* Single card mode styles */
.card-container.single {
  min-height: 300px;
  max-width: 600px; /* Larger width for single card mode */
}

/* Multiple card mode styles */
.card-container.multiple {
  min-height: 200px; /* Smaller height for multiple cards */
  max-width: 100%; /* Full width for multiple cards */
}


/* Single card mode inner height */
.card-container.single .card-inner {
  height: 300px;
}

/* Multiple card mode inner height */
.card-container.multiple .card-inner {
  height: 200px;
}

.card-inner {
  position: relative;
  width: 100%;
  text-align: center;
  /* ANIMATION OPTIONS - Choose one by uncommenting: */
  
  /* Option 1: Fast & Smooth */
  /* transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); */
  
  /* Option 2: Very Fast */
  /* transition: transform 0.15s ease-out; */
  
  /* Option 3: Bouncy */
  /* transition: transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55); */
  
  /* Option 4: Elastic */
  /* transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); */
  
  /* Option 5: Quick Snap (current) */
  transition: transform 0.2s ease-in-out;
  
  /* Option 6: Spring-like */
  /* transition: transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94); */
  
  transform-style: preserve-3d;
}

.card-inner.flipped {
  transform: rotateY(180deg);
}

.card-front,
.card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
}

.card-back {
  transform: rotateY(180deg);
}

.card-container:hover .card-inner {
  transform: scale(1.02);
}

.card-container:hover .card-inner.flipped {
  transform: rotateY(180deg) scale(1.02);
}

/* Star button positioning */
.star-button {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
}

/* Text size for single card mode */
.card-container.single .text-h2 {
  font-size: 2.5rem !important;
  font-weight: 500;
}

/* Text size for multiple card mode */
.card-container.multiple .text-h4 {
  font-size: 1.5rem !important;
  font-weight: 500;
}

/* Card front styling - keep original white background */
.card-front-style {
  background-color: white !important;
  color: black !important;
}

.card-front-style .text-h2,
.card-front-style .text-h4 {
  color: black !important;
}

/* Card back styling - reversed colors */
.card-back-style {
  background-color: #424242 !important; /* Dark grey background */
  color: white !important;
}

.card-back-style .text-h2,
.card-back-style .text-h4 {
  color: white !important;
}

.card-back-style .text-body-1 {
  color: white !important;
}

/* Notes styling for back card */
.card-back-style .notes-text {
  color: white !important;
}
</style>
