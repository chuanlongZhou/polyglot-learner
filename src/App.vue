<template>
  <v-app>
    <v-app-bar color="primary" dark>
      <v-app-bar-title>
        <img 
          src="/favicon.png" 
          alt="Polyglot Learner" 
          class="app-bar-icon"
        />
        Polyglot Learner - Learn Multiple Languages
      </v-app-bar-title>
      
      <!-- Centered Navigation Tabs -->
      <v-tabs
        v-model="activeTab"
        color="white"
        align-tabs="center"
        class="centered-tabs"
        density="compact"
      >
        <v-tab value="list">
          <v-icon left>mdi-format-list-bulleted</v-icon>
          List
        </v-tab>
        
        <v-tab value="cards">
          <v-icon left>mdi-cards</v-icon>
          Cards
        </v-tab>
        
        <v-tab value="quiz">
          <v-icon left>mdi-help-circle</v-icon>
          Quiz
        </v-tab>
        
        <v-tab value="stats">
          <v-icon left>mdi-chart-line</v-icon>
          Stats
        </v-tab>
      </v-tabs>
      
      <v-spacer />
      
      <v-btn
        @click="showSettings = true"
        icon
        variant="text"
      >
        <v-icon>mdi-cog</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main class="full-width">
      <v-container fluid class="pa-0">

        <v-tabs-window v-model="activeTab">
          <v-tabs-window-item value="list">
            <ListView />
          </v-tabs-window-item>
          
          <v-tabs-window-item value="cards">
            <CardView />
          </v-tabs-window-item>
          
          <v-tabs-window-item value="quiz">
            <QuizView />
          </v-tabs-window-item>
          
          <v-tabs-window-item value="stats">
            <StatsView />
          </v-tabs-window-item>
        </v-tabs-window>
      </v-container>
    </v-main>

    <!-- Settings Dialog -->
    <v-dialog v-model="showSettings" max-width="800px">
      <v-card>
        <v-card-title>
          <v-icon left>mdi-cog</v-icon>
          Settings
        </v-card-title>
        
        <v-card-text>
          <TtsSelector />
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showSettings = false" color="primary">
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Save Reminder -->
    <SaveReminder />

    <!-- Footer -->
    <v-footer class="footer">
      <v-container>
        <v-row align="center" justify="center">
          <v-col cols="auto" class="text-center">
            <a 
              href="https://defve1988.github.io/" 
              target="_blank" 
              rel="noopener noreferrer"
              class="footer-link"
            >
              <span class="footer-text">Designed by DEFVE</span>
              <img 
                src="/favicon.png" 
                alt="DEFVE Logo" 
                class="footer-icon"
              />
            </a>
          </v-col>
        </v-row>
      </v-container>
    </v-footer>
  </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useWordsStore } from '@/stores/useWordsStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { debugStoredWords } from '@/utils/idb';
import ListView from '@/components/ListView.vue';
import CardView from '@/views/CardView.vue';
import QuizView from '@/views/QuizView.vue';
import StatsView from '@/views/StatsView.vue';
import TtsSelector from '@/components/TtsSelector.vue';
import SaveReminder from '@/components/SaveReminder.vue';

const wordsStore = useWordsStore();
const settingsStore = useSettingsStore();

// Local state
const activeTab = ref('list');
const showSettings = ref(false);

// Initialize app
onMounted(async () => {
  // Check if we should clear data on startup (for development)
  const clearOnStartup = import.meta.env.VITE_CLEAR_DATA_ON_STARTUP === 'true';
  
  if (clearOnStartup) {
    console.log('Development mode: Clearing all data on startup');
    await wordsStore.restore(); // Load first to get the store
    wordsStore.reset();
    await settingsStore.loadSettings();
    settingsStore.reset();
  } else {
    await wordsStore.restore();
    await settingsStore.loadSettings();
  }
  
  // Debug: Check what's actually stored in IndexedDB
  console.log('=== DEBUGGING INDEXEDDB CONTENTS ===');
  await debugStoredWords();
  console.log('=== END DEBUG ===');
});
</script>

<style>
.full-width {
  width: 100%;
  max-width: none;
}

.centered-tabs {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  flex: 0 0 auto;
}

.centered-tabs :deep(.v-tab) {
  color: rgba(255, 255, 255, 0.7) !important;
  font-weight: 500;
}

.centered-tabs :deep(.v-tab--selected) {
  color: white !important;
  font-weight: 600;
}

.centered-tabs :deep(.v-tab__slider) {
  background-color: white;
}

.v-main {
  width: 100%;
}

.v-container--fluid {
  max-width: none;
  width: 100%;
}

/* Responsive design for smaller screens */
@media (max-width: 768px) {
  .centered-tabs {
    position: static;
    transform: none;
    margin: 0 16px;
  }
  
  .centered-tabs :deep(.v-tab) {
    font-size: 0.875rem;
    padding: 0 8px;
  }
  
  .centered-tabs :deep(.v-tab .v-icon) {
    font-size: 1.25rem;
  }
}

@media (max-width: 480px) {
  .centered-tabs :deep(.v-tab) {
    font-size: 0.75rem;
    padding: 0 4px;
  }
  
  .centered-tabs :deep(.v-tab .v-icon) {
    font-size: 1rem;
  }
}

/* Footer Styles */
.footer {
  background-color: #f5f5f5;
  border-top: 1px solid #e0e0e0;
  padding: 16px 0;
}

.footer-link {
  text-decoration: none;
  color: #666;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: color 0.3s ease;
}

.footer-link:hover {
  color: #1976d2;
  text-decoration: none;
  background: none;
}

.footer-text {
  font-size: 1rem;
  font-weight: 600;
}

/* App Bar Icon */
.app-bar-icon {
  width: 48px;
  height: 48px;
  object-fit: contain;
  margin-right: 16px;
  transition: transform 0.3s ease;
  cursor: pointer;
  vertical-align: middle;
}

/* App Bar Title Alignment */
.v-app-bar-title {
  display: flex;
  align-items: center;
}

.app-bar-icon:hover {
  transform: scaleX(-1);
  animation: flip 0.6s ease-in-out;
}

/* Footer Icon Animation */
.footer-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
  transition: transform 0.3s ease;
}

.footer-link:hover .footer-icon {
  transform: scaleX(-1);
  animation: flip 0.6s ease-in-out;
}

@keyframes flip {
  0% {
    transform: scaleX(1);
  }
  50% {
    transform: scaleX(-1) scaleY(1.2);
  }
  100% {
    transform: scaleX(-1) scaleY(1);
  }
}
</style>
