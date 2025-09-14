# Polyglot Drill

A modern language learning application built with Vue 3, Vuetify 3, and TypeScript. Practice vocabulary with flashcards, quizzes, and spaced repetition techniques.

## Features

### 📚 Word Management
- **CSV Import/Export**: Import word lists from CSV files or export your progress
- **Example CSV Download**: Download a sample CSV file to get started quickly
- **Multi-language Support**: Support for 20+ languages with BCP-47 language codes
- **Smart Import**: Automatically creates all language combinations from multi-language CSV
- **Inline Editing**: Edit notes directly in the word list
- **Star Rating System**: Rate words from 0-5 stars with color-coded visual feedback
- **Bulk Operations**: Select multiple words and add them to your study queue
- **Advanced Search**: Search across source text, target text, and notes
- **Flexible Sorting**: Sort by stars, last review, errors, or alphabetical order

### 🎯 Learning Modes
- **List View**: Browse and manage your vocabulary with advanced filtering
- **Flash Cards**: Study with flexible card modes and language selection
  - **Single Card Mode**: Click or press right arrow to play sound, flip card, wait 1 second, then auto-advance
  - **Multiple Card Mode**: Study multiple cards at once
  - **Star Rating**: Click stars to rate words from 0-5 with instant state updates
  - **Compact Design**: Smaller card width with larger text for better focus
- **Quiz Mode**: Comprehensive quiz system with multiple question types and configurations
  - **Language Selection**: Choose question and answer languages (including "All" option)
  - **Quiz Types**: Word meaning, sound-to-meaning, and spelling quizzes
  - **Question Count**: 10, 15, 20, 25, or 50 questions per quiz
  - **Ordering Options**: Random, by last review, by error count, or by stars
  - **Visual Feedback**: Check/cross indicators with color-coded answers
  - **Audio Integration**: Play question and answer audio with TTS
  - **Skip Functionality**: Skip questions with error tracking
  - **Auto-advance**: 5-second delay or space key to continue
  - **Results Summary**: Detailed quiz completion statistics
- **Statistics**: Track your learning progress with detailed analytics

### 🔊 Text-to-Speech
- **Web Speech API**: Built-in browser TTS support
- **Multi-language Voices**: Different voices for different languages
- **Audio Controls**: Play source and target text with one click

### 📊 Smart Learning
- **Spaced Repetition**: Algorithm prioritizes words that need review
- **Progress Tracking**: Monitor your learning statistics
- **Error Analysis**: Track mistakes and learning patterns
- **Adaptive Difficulty**: Focus on challenging words

## Tech Stack

- **Frontend**: Vue 3 + Composition API
- **UI Framework**: Vuetify 3
- **State Management**: Pinia
- **TypeScript**: Full type safety
- **Build Tool**: Vite
- **Data Persistence**: IndexedDB (idb-keyval)
- **CSV Processing**: PapaParse
- **Charts**: ECharts
- **TTS**: Web Speech API

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd polyglot-drill
```

2. Install dependencies:
```bash
npm install
```


3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

## Usage

### Adding Words

1. **Manual Entry**: Click "Add Word" in the List view
2. **CSV Import**: Click "Import CSV" and select your file
   - **New Format**: Choose source and target languages from detected columns
   - **Legacy Format**: Automatically imported with existing language settings
3. **Example CSV**: Click "Download Example" to get a sample CSV file with 50 common words in 4 languages
4. **Bulk Import**: Import large word lists from CSV files

#### Import Process

1. Click "Import CSV" button in the List view
2. Select your CSV file
3. The app will automatically detect the format:
   - **New Format**: Shows language configuration dialog
   - **Legacy Format**: Imports directly
4. For new format, select up to 4 languages to display in the table
5. All language combinations will be created automatically
6. Click "Import with Configuration" to complete

#### Multi-Language Support

The new format supports importing multiple languages and automatically creates all possible language pairs. For example, if you have a CSV with English, French, Chinese, and Japanese, and you select all 4 languages for display, the app will create:

- English → French, Chinese, Japanese
- French → English, Chinese, Japanese  
- Chinese → English, French, Japanese
- Japanese → English, French, Chinese

This gives you 12 different study combinations from a single CSV file!

### Card Study Mode

The CardView offers flexible study modes with simplified, distraction-free cards:

#### **Language Selection**
- Choose any language as the front (question) side
- Choose any language as the back (answer) side
- Study any language combination from your imported data

#### **Card Modes**
- **Single Card Mode**: Focus on one card at a time
  - Previous/Next navigation buttons
  - Keyboard arrow key support (← →)
  - Card counter display
  - **Large text size** for better readability
  - **Full card height** (300px) for optimal viewing
- **Multiple Card Mode**: Study multiple cards simultaneously
  - Choose 5, 10, 15, or 20 cards per page (default: 15)
  - All cards flip independently
  - **Compact design** with smaller height (200px) and text size
  - **Responsive grid layout** that adapts to screen size
  - **Auto-flip-back**: Click any card to play audio, flip to answer, wait 2 seconds, then flip back to front
  - **Group Navigation**: Previous/Next group buttons to navigate through pages of cards
  - **Keyboard Support**: Use arrow keys (← →) to navigate between groups
  - **Group Counter**: Shows current group and total groups (e.g., "Group 2 of 5")

#### **Interactive Features**
- **Click to Play & Flip**: Click any card to hear the front language and flip to back
- **Multiple Card Auto-Flip**: In multiple card mode, cards automatically flip back to front after 2 seconds
- **Single Card Navigation**: Use arrow keys or buttons to navigate between cards
- **Multiple Card Group Navigation**: Use arrow keys or buttons to navigate between groups of cards
- **Space Key Support**: Press space to play audio and flip cards (single card mode only)
- **Notes Display**: Notes appear on the back of cards when available
- **Shuffle Function**: Randomize card order anytime
- **Smooth Animations**: 3D flip effect with hover scaling

#### **Simplified Interface**
- No learning progress tracking (just pure study)
- Clean, distraction-free design
- Focus on vocabulary recognition and pronunciation

### CSV Format

The application supports two CSV formats:

#### New Format (Recommended)
Use language-specific columns for maximum flexibility:

```csv
id,word_en,word_fr,word_zh,word_ja,times,learned,errors,last_review,spell_errors,notes,stars
1,hello,bonjour,你好,こんにちは,0,0,0,,0,,
2,thank you,merci,谢谢,ありがとう,0,0,0,,0,,
```

**Columns:**
- `id`: Unique identifier (auto-generated if not provided)
- `word_{language}`: Text in specific language (e.g., `word_en`, `word_fr`, `word_zh`)
- `times`: Number of correct attempts
- `learned`: Number of successful learning attempts
- `errors`: Number of incorrect attempts
- `last_review`: Last review date (ISO string)
- `spell_errors`: Number of spelling errors
- `notes`: Optional notes
- `stars`: Star rating from 0-5 (0 means no stars)

**Language Configuration:**
When importing, you'll be prompted to select which language is the source and which is the target.

#### Legacy Format (Supported)
Traditional format with explicit language columns:

```csv
id,lang_src,lang_tgt,text_src,text_tgt,times,errors,last_review,spell_errors,notes
1,en-US,fr-FR,hello,bonjour,0,0,,0,
2,en-US,fr-FR,thank you,merci,0,0,,0,
```

**Columns:**
- `id`: Unique identifier (auto-generated if not provided)
- `lang_src`: Source language (BCP-47 format, e.g., en-US, fr-FR)
- `lang_tgt`: Target language (BCP-47 format)
- `text_src`: Source text
- `text_tgt`: Target text
- `times`: Number of correct attempts
- `errors`: Number of incorrect attempts
- `last_review`: Last review date (ISO string)
- `spell_errors`: Number of spelling errors
- `notes`: Optional notes
- `stars`: Star rating from 0-5 (0 means no stars)

### ⭐ Star Rating System

The app includes a comprehensive star rating system for organizing and prioritizing your vocabulary:

#### **Star Button Features**
- **Click to Cycle**: Click the star button to cycle through ratings (0 → 1 → 2 → 3 → 4 → 5 → 0)
- **Visual Feedback**: Color-coded stars for easy recognition:
  - **0 stars**: No fill (light grey outline)
  - **1 star**: Light blue
  - **2 stars**: Green
  - **3 stars**: Yellow
  - **4 stars**: Orange
  - **5 stars**: Red

#### **Sorting by Stars**
- **Stars (Highest First)**: Shows 5-star words first, then 4-star, etc.
- **Stars (Lowest First)**: Shows 0-star words first, then 1-star, etc.
- **Default Position**: Star sorting options appear first in the sort dropdown

#### **CSV Integration**
- **Import**: Stars column is automatically imported from CSV files
- **Export**: Stars are included in CSV exports for data portability
- **Default Value**: New words start with 0 stars

### Learning Priority Algorithm

Words are prioritized for study based on:

1. **Unlearned words** (times === 0) have highest priority
2. **Error count** (descending - most errors first)
3. **Last review date** (ascending - oldest first)

### Text-to-Speech Setup

#### Web Speech API
- Works out of the box in modern browsers
- No API key required
- Voice selection available in settings

### Data Management

#### Clearing All Data
To start with a fresh, empty word list:

1. **Via UI**: Go to Settings → Click "Clear All Data" button
2. **Via Browser**: Press F12 → Application tab → IndexedDB → Delete "polyglot_words" key
3. **For Development**: Set `VITE_CLEAR_DATA_ON_STARTUP=true` in `.env` file

#### Data Persistence
- All data is stored locally in your browser using IndexedDB
- Data persists between browser sessions and app restarts
- Data is not synced to any external servers (fully offline)

## Project Structure

```
src/
├── components/          # Reusable Vue components
│   ├── AddWordDialog.vue
│   ├── ListView.vue
│   ├── SaveReminder.vue
│   └── TtsSelector.vue
├── views/              # Main application views
│   ├── CardView.vue
│   ├── QuizView.vue
│   └── StatsView.vue
├── stores/             # Pinia stores
│   ├── useWordsStore.ts
│   ├── useSettingsStore.ts
│   └── useQueueStore.ts
├── utils/              # Utility functions
│   ├── csv.ts
│   ├── idb.ts
│   ├── learning.ts
│   ├── normalize.ts
│   └── tts.ts
├── types/              # TypeScript type definitions
│   └── index.ts
├── App.vue
└── main.ts
```

## Data Persistence

The application uses IndexedDB for local data storage:

- **Words**: All vocabulary data
- **Settings**: TTS preferences and voice selections
- **Queue**: Study queue for bulk operations
- **Export History**: Last export timestamps

Data is automatically saved on changes and restored on app startup.

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Vue.js team for the excellent framework
- Vuetify team for the beautiful UI components
- PapaParse for CSV processing
- ECharts for data visualization

## Roadmap

- [ ] Offline PWA support
- [ ] Spaced repetition algorithm improvements
- [ ] Audio recording for pronunciation practice
- [ ] Collaborative word lists
- [ ] Mobile app (React Native)
- [ ] Advanced analytics and insights
- [ ] Integration with language learning APIs
- [ ] Custom study schedules
- [ ] Gamification features

## Support

For issues and questions:

1. Check the GitHub issues page
2. Create a new issue with detailed information
3. Include browser version and error messages

## Changelog

### v1.1.2 - Quiz Configuration Memory
- **NEW**: Quiz configuration is now automatically remembered between sessions
- **NEW**: Last quiz settings (language selection, quiz type, question count, ordering) are preserved
- **ENHANCED**: When opening quiz configuration, your last settings are automatically loaded
- **IMPROVED**: Better user experience - no need to reconfigure quiz settings every time
- **ENHANCED**: Settings are stored in IndexedDB and persist across browser sessions

### v1.1.1 - Spelling Quiz Redesign
- **FIXED**: Spelling quiz now shows correct question text (source language) instead of answer text
- **FIXED**: Text input field now works properly with autofocus and proper event handling
- **REMOVED**: Check Spelling button - answers are now checked automatically on Enter key
- **FIXED**: Space key no longer triggers TTS for wrong words during spelling quiz
- **NEW**: Dedicated SpellingQuiz component with cleaner, more focused design
- **IMPROVED**: Better keyboard handling to prevent TTS interference during typing
- **ENHANCED**: Spelling quiz now follows the same template pattern as choice quizzes
- **IMPROVED**: More intuitive user experience with immediate answer validation

### v1.1.0 - Complete Quiz System Redesign
- **MAJOR**: Completely redesigned quiz system with comprehensive features
- **NEW**: Quiz configuration dialog with language selection (including "All" option)
- **NEW**: Multiple quiz types: Word meaning, sound-to-meaning, and spelling
- **NEW**: Flexible question counts: 10, 15, 20, 25, or 50 questions per quiz
- **NEW**: Advanced ordering options: Random, by last review, by error count, or by stars
- **NEW**: Visual feedback system with check/cross indicators and color-coded answers
- **NEW**: Audio integration with TTS for question and answer playback
- **NEW**: Skip functionality with proper error tracking
- **NEW**: Auto-advance with 5-second delay or space key navigation
- **NEW**: Comprehensive results summary with detailed statistics
- **NEW**: Character-by-character spelling validation with color feedback
- **NEW**: Star rating functionality during quiz sessions
- **ENHANCED**: Proper learned and error count tracking in word store
- **IMPROVED**: Better user experience with intuitive quiz flow
- **ENHANCED**: Support for "All" languages in both question and answer selection
- **IMPROVED**: Smart answer option generation that avoids same-language pairs

### v1.0.9
- **NEW**: Added "learned" column to track successful learning attempts
- **NEW**: Learned column appears in List view table between Stars and Errors columns
- **NEW**: Sort by learned count functionality (most/least learned first)
- **NEW**: CSV import/export support for learned column
- **ENHANCED**: All new words default to 0 learned count
- **IMPROVED**: Better progress tracking with separate learned and error counters
- **ENHANCED**: Updated TypeScript types to include learned field

### v1.0.8
- **NEW**: Added "Download Example" button in List view for easy CSV template access
- **NEW**: Example CSV file with 50 common words in 4 languages (English, French, Chinese, Japanese)
- **ENHANCED**: Users can now quickly get started by downloading the example CSV file
- **IMPROVED**: Better onboarding experience for new users
- **ENHANCED**: Example file includes proper CSV format with all required columns

### v1.0.7
- **NEW**: Group navigation for multiple card mode
- **NEW**: Previous/Next group buttons to navigate through pages of cards
- **NEW**: Keyboard arrow key support (← →) for group navigation in multiple card mode
- **NEW**: Group counter display showing current group and total groups
- **ENHANCED**: Better navigation experience for large word sets in multiple card mode
- **IMPROVED**: More intuitive study flow with clear group boundaries
- **ENHANCED**: Updated UI instructions to show group navigation shortcuts

### v1.0.6
- **NEW**: Auto-flip-back functionality for multiple card mode
- **NEW**: Cards in multiple card mode now automatically flip back to front after 2 seconds
- **ENHANCED**: Improved user experience with automatic card state management
- **ENHANCED**: Better timeout management to prevent conflicts between different card interactions
- **IMPROVED**: More intuitive study flow for multiple card review sessions

### v1.0.5
- **NEW**: Different card styles for single and multiple card modes
- **NEW**: Single card mode features larger text (2.5rem) and full height (300px) for better focus
- **NEW**: Multiple card mode features compact design with smaller text (1.5rem) and height (200px)
- **NEW**: Default cards per page changed to 15 for multiple card mode
- **ENHANCED**: Dynamic styling based on card mode with responsive design
- **IMPROVED**: Better visual hierarchy and readability in both card modes
- **ENHANCED**: Card components now accept cardMode prop for flexible styling

### v1.0.4
- **NEW**: Added comprehensive star rating system for vocabulary organization
- **NEW**: Star button with click-to-cycle functionality (0-5 stars)
- **NEW**: Color-coded star display (0=no fill, 1=light blue, 2=green, 3=yellow, 4=orange, 5=red)
- **NEW**: Sort by stars functionality (highest/lowest first) as first option in sort dropdown
- **NEW**: Stars column in word list table with interactive star buttons
- **NEW**: CSV import/export support for stars column
- **ENHANCED**: Updated TypeScript types to include stars field
- **ENHANCED**: All new words default to 0 stars
- **IMPROVED**: Better visual organization of vocabulary with star-based prioritization

### v1.0.3
- **Fixed**: Tab navigation in the input row now works correctly between language fields
- **Improved**: Added proper tabindex attributes and keyboard event handlers for better UX
- **Enhanced**: Tab navigation now properly moves from language field to language field, then to notes field
- **Fixed**: Resolved issue where first tab press would create a black box instead of moving to next field
- **Added**: Custom tab navigation handler that prevents default behavior and focuses the correct input field
- **Improved**: Better focus management using nextTick to ensure DOM updates before focusing

### v1.0.2
- **MAJOR**: Redesigned data structure to store word rows together instead of separate word pairs
- **Improved**: Each CSV row now creates one WordRow containing all language translations
- **Enhanced**: Better data organization and reduced storage complexity
- **Fixed**: CSV import now creates logical word groups instead of exponential word pairs
- **Improved**: Responsive layout that utilizes full screen width on wide displays
- **Enhanced**: Better mobile and tablet experience with adaptive design
- **Maintained**: Full backward compatibility with existing data and UI components

### v1.0.1
- **Fixed**: Resolved recursive function call errors in settings store and queue store that were causing infinite loops
- **Fixed**: Resolved excessive IndexedDB save operations during CSV import (now uses bulk import)
- **Fixed**: Improved TTS error handling with automatic fallback and voice selection
- **Added**: "Clear All Data" button in settings for easy data reset
- **Removed**: Google Cloud TTS integration (simplified to Web Speech API only)
- **Improved**: Simplified TTS configuration and reduced complexity
- **Updated**: Documentation to reflect TTS changes

### v1.0.0
- Initial release
- Core vocabulary management
- Flashcard and quiz modes
- TTS integration
- CSV import/export
- Statistics and analytics