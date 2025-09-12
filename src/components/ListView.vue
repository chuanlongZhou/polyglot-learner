<template>
  <div class="list-view-container">
    <!-- Header -->
    <div class="header-section">
      <div class="d-flex align-center">
        <v-icon left size="large">mdi-format-list-bulleted</v-icon>
        <span class="text-h5 font-weight-bold">Word List</span>
      </div>
    </div>

    <!-- Action Controls (First Row) -->
    <div class="action-section">
      <v-card>
        <v-card-text class="py-4">
          <div class="action-row">
            <v-btn
              @click="triggerFileImport"
              color="secondary"
              prepend-icon="mdi-upload"
              variant="outlined"
            >
              Import CSV
            </v-btn>
            
            <v-btn
              @click="exportToCsv"
              color="success"
              prepend-icon="mdi-download"
              variant="outlined"
            >
              Export CSV
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Search and Sort Controls (Second Row) -->
    <div class="controls-section">
      <v-card>
        <v-card-text class="py-4">
          <div class="controls-row">
            <div class="search-control">
              <v-text-field
                v-model="searchQuery"
                label="Search words"
                prepend-inner-icon="mdi-magnify"
                clearable
                variant="outlined"
                density="comfortable"
                hide-details
              />
            </div>
            
            <div class="sort-control">
              <v-select
                v-model="sortBy"
                :items="sortOptions"
                label="Sort by"
                variant="outlined"
                density="comfortable"
                hide-details
              />
            </div>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Data Table -->
    <div class="table-section">
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="d-flex align-center">
            <span class="text-h6 font-weight-medium">Words ({{ filteredWords.length }})</span>
          </div>
          
          <div class="d-flex align-center gap-2">
            <v-btn
              v-if="selectedWords.length > 0"
              @click="addToQueue"
              color="success"
              prepend-icon="mdi-plus-circle"
              size="large"
              variant="outlined"
            >
              Add to Queue ({{ selectedWords.length }})
            </v-btn>
          </div>
        </v-card-title>
        
        <v-divider />
        
        <div class="table-container">
          <v-data-table
            v-model="selectedWords"
            :headers="headers"
            :items="filteredWords"
            :loading="wordsStore.loading"
            :items-per-page="itemsPerPage"
            :items-per-page-options="[50, 100, 150, 200]"
            item-key="id"
            show-select
            class="word-table"
            :class="{ 'table-compact': windowWidth < 1200 }"
            :disable-sort="false"
            :disable-filter="false"
          >
            <!-- Dynamic Language Columns -->
            <template v-for="(lang, index) in availableLanguages" :key="`text_${lang}`" #[`item.text_${lang}`]="{ item }">
              <!-- Input row -->
              <v-text-field
                v-if="item.id === 'input-row'"
                v-model="newWordData[lang]"
                :label="getLanguageDisplayName(lang)"
                density="compact"
                variant="outlined"
                hide-details
                :tabindex="index + 1"
                autofocus="false"
                @keyup.enter="handleEnterKey"
                @keyup.escape="handleEscapeKey"
                :hint="canAddWord ? 'Press Enter to add word' : 'Fill at least 2 languages'"
                persistent-hint
              />
              <!-- Regular row -->
              <span 
                v-else-if="getTextForGroupedWord(item, lang)"
                @click="speakText(getTextForGroupedWord(item, lang), lang)"
                class="clickable-text"
                :title="`Click to speak: ${getTextForGroupedWord(item, lang)}`"
              >
                {{ getTextForGroupedWord(item, lang) }}
              </span>
              <span v-else class="text-grey">-</span>
            </template>
            
            <!-- No languages available message -->
            <template v-if="availableLanguages.length === 0" #item.text_en="{ item }">
              <div v-if="item.id === 'input-row'" class="text-center text-grey pa-4">
                <v-icon size="large" class="mb-2">mdi-translate</v-icon>
                <div>No languages detected. Please import a CSV file first.</div>
              </div>
            </template>
            
            <!-- Last Review Column -->
            <template #item.last_review="{ item }">
              <!-- Input row -->
              <span v-if="item.id === 'input-row'" class="text-grey">-</span>
              <!-- Regular row -->
              <span v-else-if="item.last_review && item.last_review.trim()">
                {{ new Date(item.last_review).toLocaleString(undefined, {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                }) }}
              </span>
              <span v-else class="text-grey">Never</span>
            </template>
            
            <!-- Stars Column -->
            <template #item.stars="{ item }">
              <!-- Input row -->
              <span v-if="item.id === 'input-row'" class="text-grey">-</span>
              <!-- Regular row -->
              <div v-else class="d-flex align-center">
                <StarButton
                  :stars="item.wordRow.stars"
                  @update:stars="updateStars(item.id, $event)"
                />
              </div>
            </template>
            
            <!-- Notes Column -->
            <template #item.notes="{ item }">
              <!-- Input row -->
              <v-text-field
                v-if="item.id === 'input-row'"
                v-model="newWordNotes"
                label="Notes"
                density="compact"
                variant="outlined"
                hide-details
                :tabindex="availableLanguages.length + 1"
                @keyup.enter="handleEnterKey"
                @keyup.escape="handleEscapeKey"
                :hint="canAddWord ? 'Press Enter to add word' : 'Fill at least 2 languages'"
                persistent-hint
              />
              <!-- Regular row -->
              <div v-else-if="editingNotes === item.id">
                <v-text-field
                  v-model="editingNotesText"
                  @keyup.enter="saveNotes(item.id)"
                  @keyup.escape="cancelEditNotes"
                  @blur="saveNotes(item.id)"
                  autofocus
                  density="compact"
                  variant="outlined"
                />
              </div>
              <div v-else @click="startEditNotes(item)" class="cursor-pointer">
                <span v-if="item.notes">{{ item.notes }}</span>
                <span v-else class="text-grey">Click to add notes</span>
              </div>
            </template>
            
            <!-- Actions Column -->
            <template #item.actions="{ item }">
              <!-- Input row -->
              <div v-if="item.id === 'input-row'" class="d-flex gap-2">
                <v-btn
                  @click="addNewWord"
                  icon
                  size="small"
                  color="success"
                  variant="text"
                  :disabled="!canAddWord"
                >
                  <v-icon>mdi-plus</v-icon>
                </v-btn>
                <v-btn
                  @click="cancelAddingWord"
                  icon
                  size="small"
                  color="grey"
                  variant="text"
                >
                  <v-icon>mdi-close</v-icon>
                </v-btn>
              </div>
              <!-- Regular row -->
              <v-btn
                v-else
                @click="deleteGroupedWord(item)"
                icon
                size="small"
                color="error"
                variant="text"
              >
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </template>
          </v-data-table>
        </div>
      </v-card>
    </div>

    <!-- Language Configuration Dialog -->
    <LanguageConfigDialog
      v-model="showLanguageConfig"
      :csv-content="csvContent"
      :format="csvFormat"
      :available-languages="csvLanguages"
      @imported="handleImportResult"
    />
    
    <!-- Hidden file input -->
    <input
      ref="fileInput"
      type="file"
      accept=".csv"
      @change="handleFileImport"
      style="display: none"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick, reactive } from 'vue';
import { useWordsStore } from '@/stores/useWordsStore';
import { useQueueStore } from '@/stores/useQueueStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { getLanguageDisplayName, LANGUAGE_NAMES } from '@/utils/normalize';
import { detectCsvFormat, readCsvFile } from '@/utils/csv';
import LanguageConfigDialog from './LanguageConfigDialog.vue';
import StarButton from './StarButton.vue';
import type { WordItem, GroupedWord, WordRow } from '@/types';

const wordsStore = useWordsStore();
const queueStore = useQueueStore();
const settingsStore = useSettingsStore();

// Local state
const selectedWords = ref<WordItem[]>([]);
const editingNotes = ref<string | null>(null);
const editingNotesText = ref('');
const showLanguageConfig = ref(false);
const csvContent = ref('');
const csvFormat = ref<'legacy' | 'new' | 'unknown'>('unknown');
const fileInput = ref<HTMLInputElement>();

// Input row state
const newWordData = reactive<{ [key: string]: string }>({});
const newWordNotes = ref('');

// Initialize language fields
const initializeLanguageFields = () => {
  availableLanguages.value.forEach(lang => {
    if (!(lang in newWordData)) {
      newWordData[lang] = '';
    }
  });
};

// Track new words that should stay at top (array maintains insertion order)
const newWordIds = ref<string[]>([]);
const hasUserSorted = ref(false);

// Search and sort
const searchQuery = ref('');
const sortBy = ref('last_review');
const itemsPerPage = ref(100);

// Window width tracking for responsive design
const windowWidth = ref(window.innerWidth);

function updateWindowWidth() {
  windowWidth.value = window.innerWidth;
}

onMounted(() => {
  window.addEventListener('resize', updateWindowWidth);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateWindowWidth);
});

// Dynamic sort options
const sortOptions = computed(() => {
  const languageSorts = availableLanguages.value.map(lang => ({
    title: `${getLanguageDisplayName(lang)} Alphabetical`,
    value: `text_${lang}`,
  }));
  
  return [
    { title: 'Stars (Highest First)', value: '-stars' },
    { title: 'Stars (Lowest First)', value: 'stars' },
    { title: 'Last Review (Oldest First)', value: 'last_review' },
    { title: 'Last Review (Newest First)', value: '-last_review' },
    { title: 'Errors (Most First)', value: '-errors' },
    { title: 'Errors (Least First)', value: 'errors' },
    ...languageSorts,
  ];
});

// Watch for sort changes
watch(sortBy, () => {
  hasUserSorted.value = true;
  // Clear new words tracking when user sorts
  newWordIds.value = [];
});

// Watch for search changes
watch(searchQuery, () => {
  // Clear new words tracking when user searches
  if (searchQuery.value.trim()) {
    hasUserSorted.value = true;
    newWordIds.value = [];
  }
});

// Computed
const availableLanguages = computed(() => {
  const languages = new Set<string>();
  wordsStore.rows.forEach(row => {
    Object.keys(row.words).forEach(lang => languages.add(lang));
  });
  return Array.from(languages).sort();
});

// Languages detected from CSV content during import
const csvLanguages = computed(() => {
  if (!csvContent.value) return [];
  
  try {
    const lines = csvContent.value.split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const languageColumns = headers.filter(h => h.startsWith('word_'));
    return languageColumns.map(col => col.replace('word_', '')).sort();
  } catch {
    return [];
  }
});

const filteredWords = computed(() => {
  // Convert WordRow to GroupedWord for table display
  let words = wordsStore.rows.map(row => ({
    id: row.id,
    wordRow: row,
    errors: row.errors,
    last_review: row.last_review,
    notes: row.notes,
  }));
  
  // Search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    words = words.filter(word => {
      // Search in all language texts
      const hasMatchingText = Object.values(word.wordRow.words).some(text => 
        text.toLowerCase().includes(query)
      );
      // Search in notes
      const hasMatchingNotes = word.notes && word.notes.toLowerCase().includes(query);
      return hasMatchingText || hasMatchingNotes;
    });
  }
  
  // No need to group since we're already working with WordRow data
  const groupedArray = words;
  
  // Sort groups
  groupedArray.sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy.value) {
      case 'stars':
        aValue = a.wordRow.stars;
        bValue = b.wordRow.stars;
        break;
      case '-stars':
        aValue = b.wordRow.stars;
        bValue = a.wordRow.stars;
        break;
      case 'last_review':
        aValue = a.last_review && a.last_review.trim() ? new Date(a.last_review).getTime() : 0;
        bValue = b.last_review && b.last_review.trim() ? new Date(b.last_review).getTime() : 0;
        break;
      case '-last_review':
        aValue = b.last_review && b.last_review.trim() ? new Date(b.last_review).getTime() : 0;
        bValue = a.last_review && a.last_review.trim() ? new Date(a.last_review).getTime() : 0;
        break;
      case 'errors':
        aValue = a.errors;
        bValue = b.errors;
        break;
      case '-errors':
        aValue = b.errors;
        bValue = a.errors;
        break;
      default:
        // Handle dynamic language columns
        if (sortBy.value.startsWith('text_')) {
          const language = sortBy.value.replace('text_', '');
          aValue = getTextForGroupedWord(a, language).toLowerCase();
          bValue = getTextForGroupedWord(b, language).toLowerCase();
        } else {
          return 0;
        }
        break;
    }
    
    if (aValue < bValue) return -1;
    if (aValue > bValue) return 1;
    return 0;
  });
  
  // Always add input row at the top
  const inputRow: GroupedWord = {
    id: 'input-row',
    words: [],
    errors: 0,
    last_review: '',
    notes: '',
  };
  
  // If user hasn't sorted and there are new words, put them at top
  if (!hasUserSorted.value && newWordIds.value.length > 0) {
    const newWords = groupedArray.filter(word => 
      newWordIds.value.includes(word.id)
    );
    const oldWords = groupedArray.filter(word => 
      !newWordIds.value.includes(word.id)
    );
    
    // Sort new words by insertion order (newest first)
    // Since we add to newWordIds in order, we need to reverse to get newest first
    newWords.sort((a, b) => {
      const aIndex = newWordIds.value.indexOf(a.id);
      const bIndex = newWordIds.value.indexOf(b.id);
      return bIndex - aIndex; // Newest first (higher index = newer)
    });
    
    return [inputRow, ...newWords, ...oldWords];
  }
  
  return [inputRow, ...groupedArray];
});

// Check if we can add a word
const canAddWord = computed(() => {
  const languages = availableLanguages.value;
  if (languages.length < 2) return false;
  
  const filledLanguages = languages.filter(lang => newWordData[lang]?.trim());
  return filledLanguages.length >= 2;
});

// Dynamic table headers
const headers = computed(() => {
  const languageHeaders = availableLanguages.value.map(lang => ({
    title: getLanguageDisplayName(lang),
    key: `text_${lang}`,
    sortable: false,
  }));
  
  return [
    ...languageHeaders,
    { title: 'Stars', key: 'stars', sortable: true },
    { title: 'Errors', key: 'errors', sortable: true },
    { title: 'Last Review', key: 'last_review', sortable: true },
    { title: 'Notes', key: 'notes', sortable: false },
    { title: 'Actions', key: 'actions', sortable: false },
  ];
});

// Methods
function getTextForLanguage(item: WordItem, language: string): string {
  if (item.lang_src === language) {
    return item.text_src;
  } else if (item.lang_tgt === language) {
    return item.text_tgt;
  }
  return '';
}

function getTextForGroupedWord(groupedWord: GroupedWord, language: string): string {
  return groupedWord.wordRow.words[language] || '';
}

async function speakText(text: string, lang: string) {
  try {
    await settingsStore.speakText(text, lang);
  } catch (error) {
    console.error('TTS error:', error);
  }
}

function addToQueue() {
  const ids = selectedWords.value.map(item => item.id);
  queueStore.add(ids);
  selectedWords.value = [];
}

function deleteGroupedWord(groupedWord: GroupedWord) {
  if (confirm('Are you sure you want to delete this word group?')) {
    wordsStore.deleteRow(groupedWord.id);
  }
}

function updateStars(id: string, stars: number) {
  wordsStore.updateRow(id, { stars });
}


async function handleFileImport(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (!file) return;
  
  try {
    const content = await readCsvFile(file);
    const format = detectCsvFormat(content);
    
    csvContent.value = content;
    csvFormat.value = format.format;
    
    if (format.format === 'legacy' || format.format === 'new') {
      // Show language configuration dialog for both formats
      showLanguageConfig.value = true;
    } else {
      alert('Unknown CSV format. Please check your file format.');
    }
  } catch (error) {
    alert('Failed to read file: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
  
  // Reset file input
  if (target) target.value = '';
}

function handleImportResult(success: boolean, errors: string[]) {
  if (success) {
    // CSV imported successfully - no alert needed
  } else {
    alert('Import failed: ' + errors.join(', '));
  }
  showLanguageConfig.value = false;
}

function triggerFileImport() {
  fileInput.value?.click();
}

function startEditNotes(item: GroupedWord) {
  editingNotes.value = item.id;
  editingNotesText.value = item.notes || '';
}

function saveNotes(id: string) {
  if (editingNotes.value === id) {
    // Update notes for all words in the group
    const groupedWord = filteredWords.value.find(gw => gw.id === id);
    if (groupedWord) {
      groupedWord.words.forEach(word => {
        wordsStore.updateItem(word.id, { notes: editingNotesText.value });
      });
    }
    editingNotes.value = null;
    editingNotesText.value = '';
  }
}

function cancelEditNotes() {
  editingNotes.value = null;
  editingNotesText.value = '';
}

// Input row functions
async function cancelAddingWord() {
  console.log('Clearing input fields, current data:', newWordData);
  // Clear all language fields by creating a new object
  const clearedData: { [key: string]: string } = {};
  availableLanguages.value.forEach(lang => {
    clearedData[lang] = '';
  });
  Object.assign(newWordData, clearedData);
  newWordNotes.value = '';
  console.log('After clearing, data:', newWordData);
}

function handleEnterKey(event: KeyboardEvent) {
  event.preventDefault();
  event.stopPropagation();
  
  // Only add word if the button would be enabled
  if (canAddWord.value) {
    addNewWord();
  }
}

function handleEscapeKey(event: KeyboardEvent) {
  event.preventDefault();
  event.stopPropagation();
  cancelAddingWord();
}

function addNewWord() {
  console.log('Adding new word, current data:', newWordData);
  const languages = availableLanguages.value;
  if (languages.length < 2) {
    alert('At least 2 languages are required to add a word');
    return;
  }
  
  // Check if at least 2 languages have text
  const filledLanguages = languages.filter(lang => {
    const value = newWordData[lang];
    console.log(`Language ${lang}: "${value}" (trimmed: "${value?.trim()}")`);
    return value?.trim();
  });
  console.log('Filled languages:', filledLanguages);
  if (filledLanguages.length < 2) {
    alert('Please fill in at least 2 languages');
    return;
  }
  
  // Create a single WordRow with all language translations
  const wordRow: WordRow = {
    id: `word_${Date.now()}`,
    words: {},
    times: 0,
    errors: 0,
    last_review: new Date().toISOString(), // Set to current date and time
    spell_errors: 0,
    notes: newWordNotes.value.trim() || undefined,
    stars: 0,
    progress: {}
  };
  
  // Add all filled languages to the word row
  filledLanguages.forEach(lang => {
    wordRow.words[lang] = newWordData[lang].trim();
  });
  
  console.log('Created word row:', wordRow);
  
  // Add the word row
  wordsStore.addRow(wordRow);
  
  // Track this as a new word for priority display
  newWordIds.value.push(wordRow.id);
  
  // Reset input
  cancelAddingWord();
}

// Export functionality
function exportToCsv() {
  if (wordsStore.rows.length === 0) {
    alert('No words to export');
    return;
  }
  
  // Get all unique languages from rows
  const allLanguages = new Set<string>();
  wordsStore.rows.forEach(row => {
    Object.keys(row.words).forEach(lang => allLanguages.add(lang));
  });
  const languages = Array.from(allLanguages).sort();
  
  // Create CSV headers
  const headers = ['id', ...languages.map(lang => `word_${lang}`), 'times', 'errors', 'last_review', 'spell_errors', 'notes', 'stars'];
  
  // Create CSV rows
  const rows = wordsStore.rows.map(row => {
    const csvRow: { [key: string]: string } = {
      id: row.id,
      times: row.times.toString(),
      errors: row.errors.toString(),
      last_review: row.last_review && row.last_review.trim() ? row.last_review : '',
      spell_errors: row.spell_errors.toString(),
      notes: row.notes || '',
      stars: row.stars.toString(),
    };
    
    // Add language columns
    languages.forEach(lang => {
      csvRow[`word_${lang}`] = row.words[lang] || '';
    });
    
    return csvRow;
  });
  
  // Convert to CSV
  const csvContent = [headers.join(','), ...rows.map(row => 
    headers.map(header => {
      const value = row[header] || '';
      // Escape commas and quotes
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  )].join('\n');
  
  // Download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `words_export_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Initialize
onMounted(async () => {
  await wordsStore.restore();
  await queueStore.loadQueue();
  await settingsStore.loadSettings();
  initializeLanguageFields();
  
  // Clear any leftover new word tracking from previous sessions
  newWordIds.value = [];
  hasUserSorted.value = false;
});

// Watch for language changes
watch(availableLanguages, () => {
  initializeLanguageFields();
}, { immediate: true });
</script>

<style scoped>
.list-view-container {
  width: 100%;
  max-width: none;
  padding: 16px;
  margin: 0 auto;
}

.header-section {
  margin-bottom: 16px;
}

.action-section {
  margin-bottom: 16px;
}

.controls-section {
  margin-bottom: 24px;
}

.action-row {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.controls-row {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.search-control {
  flex: 1;
  min-width: 250px;
}

.sort-control {
  flex: 0 0 200px;
}

.table-section {
  width: 100%;
}

.table-container {
  overflow-x: auto;
  width: 100%;
}

.word-table {
  width: 100%;
  min-width: 800px;
}

.word-table :deep(.v-data-table__wrapper) {
  width: 100%;
}

.word-table :deep(.v-data-table__wrapper table) {
  width: 100%;
  table-layout: fixed;
}

/* Ensure proper tab navigation in data table */
.word-table :deep(.v-text-field input) {
  tabindex: inherit !important;
}

.word-table :deep(.v-text-field .v-field__input) {
  tabindex: inherit !important;
}

/* Make sure input fields are focusable */
.word-table :deep(.v-text-field) {
  position: relative;
}

.word-table :deep(.v-text-field input) {
  position: relative;
  z-index: 1;
}

/* Responsive design for different screen sizes */
/* Extra wide screens - use more space */
@media (min-width: 1400px) {
  .list-view-container {
    padding: 24px 48px;
  }
  
  .word-table {
    min-width: 1000px;
  }
  
  .controls-row {
    flex-direction: row;
    gap: 24px;
  }
  
  .search-control {
    flex: 1;
    max-width: 400px;
  }
  
  .filter-controls {
    gap: 16px;
  }
}

@media (min-width: 1920px) {
  .list-view-container {
    padding: 32px 64px;
  }
  
  .word-table {
    min-width: 1200px;
  }
  
  .controls-row {
    gap: 32px;
  }
  
  .search-control {
    max-width: 500px;
  }
}

@media (max-width: 1400px) {
  .list-view-container {
    padding: 12px;
  }
  
  .action-row {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .controls-row {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .search-control,
  .sort-control {
    flex: 1;
    min-width: unset;
  }
}

@media (max-width: 1200px) {
  .word-table {
    min-width: 700px;
  }
  
  .table-compact :deep(.v-data-table__wrapper table th),
  .table-compact :deep(.v-data-table__wrapper table td) {
    padding: 8px 4px;
    font-size: 0.875rem;
  }
}

@media (max-width: 768px) {
  .list-view-container {
    padding: 8px;
  }
  
  .header-section {
    padding: 0 16px;
  }
  
  .controls-section .v-card-text {
    padding: 16px;
  }
  
  .word-table {
    min-width: 600px;
  }
  
  .table-compact :deep(.v-data-table__wrapper table th),
  .table-compact :deep(.v-data-table__wrapper table td) {
    padding: 6px 2px;
    font-size: 0.8rem;
  }
  
  /* Responsive pagination */
  .word-table :deep(.v-data-table-footer) {
    flex-direction: column;
    gap: 16px;
    align-items: center;
  }
  
  .word-table :deep(.v-data-table-footer__items-per-page) {
    min-width: 100px;
  }
  
  .word-table :deep(.v-data-table-footer__pagination) {
    min-width: 180px;
  }
}

@media (max-width: 480px) {
  .list-view-container {
    padding: 4px;
  }
  
  .action-row {
    flex-direction: column;
    gap: 8px;
  }
  
  .action-row .v-btn {
    width: 100%;
  }
  
  .word-table {
    min-width: 500px;
  }
  
  .table-compact :deep(.v-data-table__wrapper table th),
  .table-compact :deep(.v-data-table__wrapper table td) {
    padding: 4px 1px;
    font-size: 0.75rem;
  }
  
  /* Mobile pagination */
  .word-table :deep(.v-data-table-footer) {
    padding: 12px 16px;
  }
  
  .word-table :deep(.v-data-table-footer__items-per-page) {
    min-width: 80px;
  }
  
  .word-table :deep(.v-data-table-footer__pagination) {
    min-width: 160px;
  }
  
  .word-table :deep(.v-data-table-footer__pagination .v-btn) {
    min-width: 36px;
    height: 36px;
  }
}

/* Pagination styling */
.word-table :deep(.v-data-table-footer) {
  padding: 16px 24px;
}

.word-table :deep(.v-data-table-footer__items-per-page) {
  min-width: 120px;
}

.word-table :deep(.v-data-table-footer__items-per-page .v-select) {
  min-width: 100px;
}

.word-table :deep(.v-data-table-footer__items-per-page .v-field) {
  min-width: 100px;
}

.word-table :deep(.v-data-table-footer__pagination) {
  min-width: 200px;
}

.word-table :deep(.v-data-table-footer__pagination .v-btn) {
  min-width: 40px;
  height: 40px;
}

/* Legacy styles */
.cursor-pointer {
  cursor: pointer;
}

.clickable-text {
  cursor: pointer;
  color: #1976D2;
  text-decoration: underline;
}

.clickable-text:hover {
  color: #1565C0;
  text-decoration: none;
}
</style>