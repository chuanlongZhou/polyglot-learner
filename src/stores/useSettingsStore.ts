import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { SettingsState, TtsProvider, VoiceInfo } from '@/types';
import { saveSettings as saveSettingsToIdb, loadSettings as loadSettingsFromIdb } from '@/utils/idb';
import { createTtsEngine, getAvailableProviders, isWebSpeechAvailable } from '@/utils/tts';

/**
 * Settings store for managing app preferences and TTS configuration
 */
export const useSettingsStore = defineStore('settings', () => {
  // State
  const ttsProvider = ref<TtsProvider>('WebSpeech');
  const webVoices = ref<Record<string, string>>({}); // lang -> voiceId
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const availableProviders = computed(() => getAvailableProviders());
  
  const currentTtsEngine = computed(() => {
    try {
      return createTtsEngine(ttsProvider.value);
    } catch (err) {
      console.error('Failed to create TTS engine:', err);
      return null;
    }
  });

  const isWebSpeechReady = computed(() => isWebSpeechAvailable());
  

  // Actions
  async function loadSettings(): Promise<void> {
    loading.value = true;
    error.value = null;
    
    try {
      const savedSettings = await loadSettingsFromIdb();
      
      if (savedSettings.ttsProvider) {
        ttsProvider.value = savedSettings.ttsProvider;
      }
      
      if (savedSettings.webVoices) {
        webVoices.value = savedSettings.webVoices;
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      error.value = err instanceof Error ? err.message : 'Failed to load settings';
    } finally {
      loading.value = false;
    }
  }

  async function saveSettings(): Promise<void> {
    try {
      // Create a plain object with only serializable data
      const settings: SettingsState = {
        ttsProvider: ttsProvider.value,
        webVoices: { ...webVoices.value }, // Create a copy to ensure it's plain
        google: { apiKey: '' }, // Keep empty for compatibility
      };
      
      console.log('[DEBUG] Saving settings:', settings);
      await saveSettingsToIdb(settings);
      console.log('[DEBUG] Settings saved successfully');
    } catch (err) {
      console.error('Failed to save settings:', err);
      error.value = err instanceof Error ? err.message : 'Failed to save settings';
    }
  }

  function setTtsProvider(provider: TtsProvider): void {
    ttsProvider.value = provider;
    saveSettings();
  }

  function setWebVoice(lang: string, voiceId: string): void {
    console.log('[DEBUG] Setting web voice:', { lang, voiceId });
    console.log('[DEBUG] Current webVoices before:', { ...webVoices.value });
    
    webVoices.value[lang] = voiceId;
    
    console.log('[DEBUG] Current webVoices after:', { ...webVoices.value });
    saveSettings();
  }


  function getWebVoiceForLanguage(lang: string): string | null {
    console.log(`[DEBUG] Looking for voice for language: "${lang}"`);
    console.log(`[DEBUG] Available voices:`, { ...webVoices.value });
    
    // Try exact match first
    let voiceId = webVoices.value[lang];
    if (voiceId) {
      console.log(`[DEBUG] Found exact match: ${voiceId}`);
      return voiceId;
    }
    
    // Try language code only (e.g., 'fr' for 'fr-FR')
    const langCode = lang.split('-')[0];
    voiceId = webVoices.value[langCode];
    if (voiceId) {
      console.log(`[DEBUG] Found language code match: ${voiceId}`);
      return voiceId;
    }
    
    // Try to find a voice that starts with this language code
    // This handles cases where we have 'fr' but voices are stored as 'fr-FR'
    for (const [storedLang, storedVoiceId] of Object.entries(webVoices.value)) {
      if (storedLang.startsWith(langCode + '-')) {
        console.log(`[DEBUG] Found voice with matching language prefix: ${storedLang} -> ${storedVoiceId}`);
        return storedVoiceId;
      }
    }
    
    console.log(`[DEBUG] No voice found for language: ${lang}`);
    return null;
  }

  async function loadWebVoices(): Promise<VoiceInfo[]> {
    if (!isWebSpeechReady.value) {
      return [];
    }

    try {
      const engine = createTtsEngine('WebSpeech');
      return await engine.listVoices();
    } catch (err) {
      console.error('Failed to load web voices:', err);
      return [];
    }
  }


  async function speakText(text: string, lang: string, voiceId?: string): Promise<void> {
    if (!currentTtsEngine.value) {
      throw new Error('TTS engine not available');
    }

    try {
      // If no voiceId provided, try to get the saved voice for this language
      const selectedVoiceId = voiceId || getWebVoiceForLanguage(lang);
      console.log(`[DEBUG] Speaking "${text}" in ${lang} with voice:`, selectedVoiceId);
      
      await currentTtsEngine.value.speak(text, lang, selectedVoiceId);
    } catch (err) {
      console.error('Failed to speak text:', err);
      throw new Error(`TTS error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  function cancelSpeech(): void {
    if (currentTtsEngine.value) {
      currentTtsEngine.value.cancel();
    }
  }

  function clearError(): void {
    error.value = null;
  }

  function reset(): void {
    ttsProvider.value = 'WebSpeech';
    webVoices.value = {};
    error.value = null;
  }

  return {
    // State (only serializable data)
    ttsProvider,
    webVoices,
    loading,
    error,
    
    // Getters (computed properties - not serialized)
    availableProviders,
    currentTtsEngine,
    isWebSpeechReady,
    
    // Actions
    loadSettings,
    saveSettings,
    setTtsProvider,
    setWebVoice,
    getWebVoiceForLanguage,
    loadWebVoices,
    speakText,
    cancelSpeech,
    clearError,
    reset,
  };
});
