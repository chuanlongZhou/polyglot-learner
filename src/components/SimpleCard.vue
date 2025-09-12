<template>
  <v-card
    @click="handleCardClick"
    class="simple-card"
    :class="{ 'flipped': isFlipped }"
    elevation="8"
  >
    <v-card-text class="text-center pa-8">
      <div v-if="!isFlipped" class="front-content">
        <div class="text-h4 mb-4">{{ word.text_src }}</div>
        <div class="text-h6 text-grey">
          {{ getLanguageDisplayName(word.lang_src) }}
        </div>
      </div>
      
      <div v-else class="back-content">
        <div class="text-h4 mb-4">{{ word.text_tgt }}</div>
        <div class="text-h6 text-grey mb-4">
          {{ getLanguageDisplayName(word.lang_tgt) }}
        </div>
        
        <div v-if="word.notes" class="text-body-1 mt-4 pa-4 bg-grey-lighten-4 rounded">
          <v-icon left>mdi-note-text</v-icon>
          {{ word.notes }}
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { getLanguageDisplayName } from '@/utils/normalize';
import type { WordItem } from '@/types';

const settingsStore = useSettingsStore();

// Props
const props = defineProps<{
  word: WordItem;
  frontLanguage: string;
  backLanguage: string;
}>();

// Local state
const isFlipped = ref(false);

// Methods
async function handleCardClick() {
  // Play the front language text
  try {
    await settingsStore.speakText(props.word.text_src, props.word.lang_src);
  } catch (error) {
    console.error('TTS error:', error);
  }
  
  // Flip the card
  isFlipped.value = !isFlipped.value;
}

// Reset flip state when word changes
watch(() => props.word.id, () => {
  isFlipped.value = false;
});
</script>

<style scoped>
.simple-card {
  cursor: pointer;
  transition: transform 0.6s;
  transform-style: preserve-3d;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.simple-card.flipped {
  transform: rotateY(180deg);
}

.front-content,
.back-content {
  backface-visibility: hidden;
  width: 100%;
}

.back-content {
  transform: rotateY(180deg);
}

.simple-card:hover {
  transform: scale(1.02);
}

.simple-card.flipped:hover {
  transform: rotateY(180deg) scale(1.02);
}
</style>
