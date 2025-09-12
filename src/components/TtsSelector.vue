<template>
  <v-card>
    <v-card-title>
      <v-icon left>mdi-volume-high</v-icon>
      Text-to-Speech Settings
    </v-card-title>
    
    <v-card-text>
      <v-row>
        <v-col cols="12" md="6">
          <v-select
            v-model="settingsStore.ttsProvider"
            :items="availableProviders"
            label="TTS Provider"
            @update:model-value="handleProviderChange"
            :disabled="loading"
          />
        </v-col>
        
      </v-row>
      
      <v-row v-if="settingsStore.ttsProvider === 'WebSpeech'">
        <v-col cols="12">
          <v-select
            v-for="lang in availableLanguages"
            :key="lang"
            v-model="selectedVoices[lang]"
            :items="getVoicesForLanguage(lang)"
            :label="`Voice for ${getLanguageDisplayName(lang)}`"
            :disabled="loading"
            @update:model-value="(voiceId) => handleVoiceChange(lang, voiceId)"
            clearable
          />
        </v-col>
      </v-row>
      
      <v-alert
        v-if="error"
        type="error"
        dismissible
        @click:close="settingsStore.clearError"
        class="mt-4"
      >
        {{ error }}
      </v-alert>
    </v-card-text>
    
    <v-card-actions>
      <v-btn
        @click="handleClearAllData"
        :disabled="loading"
        color="error"
        variant="outlined"
      >
        <v-icon left>mdi-delete-sweep</v-icon>
        Clear All Data
      </v-btn>
      <v-spacer />
      <v-btn
        @click="testTts"
        :disabled="!canTestTts || loading"
        color="primary"
        variant="outlined"
      >
        <v-icon left>mdi-play</v-icon>
        Test TTS
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useWordsStore } from '@/stores/useWordsStore';
import { useQueueStore } from '@/stores/useQueueStore';
import { getLanguageDisplayName } from '@/utils/normalize';
import { clearAllData } from '@/utils/idb';
import type { VoiceInfo } from '@/types';

const settingsStore = useSettingsStore();
const wordsStore = useWordsStore();
const queueStore = useQueueStore();

// Local state
const loading = ref(false);
const error = ref<string | null>(null);
const selectedVoices = ref<Record<string, string>>({});
const webVoices = ref<VoiceInfo[]>([]);

// Computed
const availableProviders = computed(() => 
  settingsStore.availableProviders.map(provider => ({
    title: 'Web Speech API',
    value: provider,
  }))
);

const availableLanguages = computed(() => {
  const languages = new Set<string>();
  webVoices.value.forEach(voice => {
    languages.add(voice.lang);
  });
  return Array.from(languages).sort();
});

const canTestTts = computed(() => {
  return settingsStore.isWebSpeechReady;
});

// Methods
async function loadVoices() {
  loading.value = true;
  error.value = null;
  
  try {
    webVoices.value = await settingsStore.loadWebVoices();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load voices';
  } finally {
    loading.value = false;
  }
}

function getVoicesForLanguage(lang: string) {
  return webVoices.value
    .filter(voice => voice.lang === lang)
    .map(voice => ({
      title: voice.name,
      value: voice.id,
    }));
}

function handleProviderChange(provider: string) {
  settingsStore.setTtsProvider(provider as any);
  loadVoices();
}


function handleVoiceChange(lang: string, voiceId: string) {
  console.log('[DEBUG] Voice change:', { lang, voiceId });
  settingsStore.setWebVoice(lang, voiceId);
}

async function testTts() {
  try {
    await settingsStore.speakText('Hello, this is a test.', 'en-US');
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'TTS test failed';
  }
}

async function handleClearAllData() {
  if (!confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
    return;
  }
  
  loading.value = true;
  error.value = null;
  
  try {
    // Clear all data from IndexedDB
    await clearAllData();
    
    // Reset all stores
    wordsStore.reset();
    queueStore.reset();
    settingsStore.reset();
    
    // Show success message
    alert('All data has been cleared successfully. The page will refresh.');
    
    // Refresh the page to ensure clean state
    window.location.reload();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to clear data';
  } finally {
    loading.value = false;
  }
}

// Watch for provider changes
watch(() => settingsStore.ttsProvider, loadVoices);

// Initialize
onMounted(async () => {
  await settingsStore.loadSettings();
  selectedVoices.value = { ...settingsStore.webVoices };
  await loadVoices();
});
</script>
