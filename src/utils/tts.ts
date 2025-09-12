import type { TtsEngine, TtsProvider, VoiceInfo } from '@/types';

/**
 * Text-to-Speech utility functions
 */

/**
 * Web Speech API implementation
 */
class WebSpeechTtsEngine implements TtsEngine {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private lastSpeechTime: number = 0;
  private _isSpeaking: boolean = false;
  private speechQueue: Array<{
    text: string;
    lang: string;
    voiceId?: string;
    resolve: () => void;
    reject: (error: Error) => void;
  }> = [];

  async listVoices(lang?: string): Promise<VoiceInfo[]> {
    return new Promise((resolve) => {
      const voices = speechSynthesis.getVoices();
      
      if (voices.length === 0) {
        // Voices might not be loaded yet, wait for them
        speechSynthesis.onvoiceschanged = () => {
          const loadedVoices = speechSynthesis.getVoices();
          resolve(this.filterVoices(loadedVoices, lang));
        };
      } else {
        resolve(this.filterVoices(voices, lang));
      }
    });
  }

  private filterVoices(voices: SpeechSynthesisVoice[], lang?: string): VoiceInfo[] {
    return voices
      .filter(voice => {
        if (lang) {
          return voice.lang === lang || voice.lang.startsWith(lang.split('-')[0]);
        }
        return true;
      })
      .map(voice => ({
        name: voice.name,
        lang: voice.lang,
        id: voice.voiceURI,
      }))
      .sort((a, b) => a.lang.localeCompare(b.lang));
  }

  async speak(text: string, lang: string, voiceId?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Add to queue instead of immediate execution
      this.speechQueue.push({
        text,
        lang,
        voiceId,
        resolve,
        reject,
      });

      // Process queue if not already speaking
      if (!this._isSpeaking) {
        this.processQueue();
      }
    });
  }

  private async processQueue(): Promise<void> {
    if (this.speechQueue.length === 0) {
      this._isSpeaking = false;
      return;
    }

    this._isSpeaking = true;
    const { text, lang, voiceId, resolve, reject } = this.speechQueue.shift()!;

    try {
      await this.executeSpeech(text, lang, voiceId);
      resolve();
    } catch (error) {
      reject(error instanceof Error ? error : new Error('Speech failed'));
    }

    // Process next item in queue after a small delay
    setTimeout(() => this.processQueue(), 100);
  }

  private async executeSpeech(text: string, lang: string, voiceId?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Cancel any current speech
      this.cancel();
      
      // Add delay to prevent rapid-fire speech requests
      const now = Date.now();
      const timeSinceLastSpeech = now - this.lastSpeechTime;
      if (timeSinceLastSpeech < 200) { // Increased to 200ms minimum delay
        setTimeout(() => this.executeSpeech(text, lang, voiceId).then(resolve).catch(reject), 200 - timeSinceLastSpeech);
        return;
      }
      this.lastSpeechTime = now;

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Normalize language code for better voice matching
      const normalizedLang = this.normalizeLanguageCode(lang);
      utterance.lang = normalizedLang;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Set voice if specified, otherwise try to find best voice for language
      if (voiceId) {
        const voices = speechSynthesis.getVoices();
        const selectedVoice = voices.find(voice => voice.voiceURI === voiceId);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
          console.log(`[DEBUG] Using selected voice: ${selectedVoice.name} (${selectedVoice.voiceURI})`);
        } else {
          console.warn(`[DEBUG] Voice not found: ${voiceId}. Available voices:`, voices.map(v => v.voiceURI));
        }
      } else {
        // Try to find the best voice for the language
        const voices = speechSynthesis.getVoices();
        const bestVoice = this.findBestVoiceForLanguage(voices, normalizedLang);
        if (bestVoice) {
          utterance.voice = bestVoice;
          console.log(`[DEBUG] Using best voice for ${normalizedLang}: ${bestVoice.name} (${bestVoice.voiceURI})`);
        } else {
          console.log(`[DEBUG] No voice found for ${normalizedLang}, using default`);
        }
      }

      // Set up event handlers
      utterance.onend = () => {
        this.currentUtterance = null;
        resolve();
      };

      utterance.onerror = (event) => {
        this.currentUtterance = null;
        console.warn(`TTS Error for "${text}" in ${lang}:`, event.error);
        
        // Don't try fallback for interrupted speech - just resolve
        if (event.error === 'interrupted') {
          console.log('Speech was interrupted, resolving...');
          resolve();
          return;
        }
        
        // Try fallback if original language fails (but not for interruption)
        if (normalizedLang !== 'en-US') {
          console.log('Attempting fallback to English...');
          utterance.lang = 'en-US';
          utterance.voice = null; // Let browser choose default English voice
          
          // Re-attach handlers for fallback
          utterance.onend = () => {
            this.currentUtterance = null;
            resolve(); // Still resolve successfully for fallback
          };
          
          utterance.onerror = (fallbackEvent) => {
            this.currentUtterance = null;
            if (fallbackEvent.error === 'interrupted') {
              console.log('Fallback speech was interrupted, resolving...');
              resolve();
            } else {
              reject(new Error(`Speech synthesis failed even with fallback: ${fallbackEvent.error}`));
            }
          };
          
          speechSynthesis.speak(utterance);
          return;
        }
        
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      this.currentUtterance = utterance;
      speechSynthesis.speak(utterance);
    });
  }

  cancel(): void {
    if (this.currentUtterance) {
      speechSynthesis.cancel();
      this.currentUtterance = null;
    }
    
    // Clear the queue and reject all pending promises
    this.speechQueue.forEach(({ reject }) => {
      reject(new Error('Speech cancelled'));
    });
    this.speechQueue = [];
    this._isSpeaking = false;
  }

  isSpeaking(): boolean {
    return this._isSpeaking || this.speechQueue.length > 0;
  }

  private normalizeLanguageCode(lang: string): string {
    // Convert common language codes to proper format
    const langMap: Record<string, string> = {
      'ja': 'ja-JP',
      'zh': 'zh-CN',
      'zh-cn': 'zh-CN',
      'zh-tw': 'zh-TW',
      'en': 'en-US',
      'fr': 'fr-FR',
      'de': 'de-DE',
      'es': 'es-ES',
      'it': 'it-IT',
      'pt': 'pt-PT',
      'ru': 'ru-RU',
      'ko': 'ko-KR',
      'ar': 'ar-SA',
    };
    
    const lowerLang = lang.toLowerCase();
    return langMap[lowerLang] || lang;
  }

  private findBestVoiceForLanguage(voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | null {
    // First try exact match
    let voice = voices.find(v => v.lang === lang);
    if (voice) return voice;
    
    // Try language code only (e.g., 'ja' for 'ja-JP')
    const langCode = lang.split('-')[0];
    voice = voices.find(v => v.lang.startsWith(langCode));
    if (voice) return voice;
    
    // Try similar languages
    const similarMap: Record<string, string[]> = {
      'ja': ['zh', 'ko'],
      'zh': ['ja', 'ko'],
      'ko': ['ja', 'zh'],
      'fr': ['es', 'it'],
      'es': ['fr', 'it'],
      'it': ['fr', 'es'],
    };
    
    const similar = similarMap[langCode];
    if (similar) {
      for (const similarLang of similar) {
        voice = voices.find(v => v.lang.startsWith(similarLang));
        if (voice) return voice;
      }
    }
    
    // Return first available voice as last resort
    return voices.length > 0 ? voices[0] : null;
  }
}


/**
 * TTS Engine factory
 */
export function createTtsEngine(provider: TtsProvider, apiKey?: string): TtsEngine {
  switch (provider) {
    case 'WebSpeech':
      return new WebSpeechTtsEngine();
    default:
      throw new Error(`Unknown TTS provider: ${provider}`);
  }
}

/**
 * Get available TTS providers
 */
export function getAvailableProviders(): TtsProvider[] {
  return ['WebSpeech'];
}

/**
 * Check if Web Speech API is available
 */
export function isWebSpeechAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}


/**
 * Get default voice for a language
 */
export function getDefaultVoiceForLanguage(voices: VoiceInfo[], lang: string): VoiceInfo | null {
  // First try exact match
  let voice = voices.find(v => v.lang === lang);
  
  // Then try language code only
  if (!voice) {
    const langCode = lang.split('-')[0];
    voice = voices.find(v => v.lang.startsWith(langCode));
  }
  
  // Finally, return first available voice
  if (!voice && voices.length > 0) {
    voice = voices[0];
  }
  
  return voice || null;
}

/**
 * Preload voices for better performance
 */
export async function preloadVoices(engine: TtsEngine): Promise<void> {
  try {
    await engine.listVoices();
    console.log('Voices preloaded successfully');
  } catch (error) {
    console.warn('Failed to preload voices:', error);
  }
}
