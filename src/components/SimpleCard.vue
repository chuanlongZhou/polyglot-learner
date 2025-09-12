<template>
  <div class="card-container" @click="handleCardClick">
    <v-card
      class="simple-card"
      :class="{ 'flipped': isFlipped }"
      elevation="8"
    >
      <v-card-text class="text-center pa-8 front-content">
        <div class="text-h4 mb-4">{{ word.text_src }}</div>
      </v-card-text>
      
      <v-card-text class="text-center pa-8 back-content">
        <div class="text-h4 mb-4">{{ word.text_tgt }}</div>
        
        <div v-if="word.notes" class="text-body-1 mt-4 pa-4 bg-grey-lighten-4 rounded">
          <v-icon left>mdi-note-text</v-icon>
          {{ word.notes }}
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
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
.card-container {
  cursor: pointer;
  perspective: 1000px;
  min-height: 200px;
}

.simple-card {
  transition: transform 0.6s;
  transform-style: preserve-3d;
  min-height: 200px;
  position: relative;
  width: 100%;
}

.simple-card.flipped {
  transform: rotateY(180deg);
}

.front-content,
.back-content {
  backface-visibility: hidden;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-content {
  transform: rotateY(180deg);
}

.card-container:hover .simple-card {
  transform: scale(1.02);
}

.card-container:hover .simple-card.flipped {
  transform: rotateY(180deg) scale(1.02);
}
</style>
