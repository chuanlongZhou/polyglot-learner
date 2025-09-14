import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        title: 'Polyglot Learner - Learn Multiple Languages with Flashcards & Quizzes',
        description: 'Master multiple languages with Polyglot Learner. Practice vocabulary with flashcards, quizzes, and spaced repetition. Support for 20+ languages.',
        keywords: 'language learning, vocabulary, flashcards, quiz, polyglot, multilingual'
      }
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
      meta: {
        title: 'About Polyglot Learner - Language Learning Features',
        description: 'Learn about Polyglot Learner features including flashcards, quizzes, CSV import/export, text-to-speech, and progress tracking.',
        keywords: 'about, features, language learning app, vocabulary trainer'
      }
    },
    {
      path: '/cards',
      name: 'cards',
      component: () => import('../views/CardView.vue'),
      meta: {
        title: 'Flashcards - Study Vocabulary with Interactive Cards',
        description: 'Study vocabulary with interactive flashcards. Choose from single or multiple card modes, practice pronunciation with text-to-speech.',
        keywords: 'flashcards, vocabulary cards, language study, interactive learning'
      }
    },
    {
      path: '/quiz',
      name: 'quiz',
      component: () => import('../views/QuizView.vue'),
      meta: {
        title: 'Language Quiz - Test Your Vocabulary Knowledge',
        description: 'Take vocabulary quizzes with multiple question types: word meaning, sound-to-meaning, and spelling. Track your progress and improve.',
        keywords: 'quiz, vocabulary test, language assessment, learning progress'
      }
    },
    {
      path: '/stats',
      name: 'stats',
      component: () => import('../views/StatsView.vue'),
      meta: {
        title: 'Learning Statistics - Track Your Language Progress',
        description: 'View detailed learning statistics including progress charts, error analysis, and language distribution. Monitor your improvement.',
        keywords: 'statistics, learning progress, charts, analytics, language tracking'
      }
    },
    {
      path: '/list',
      name: 'list',
      component: () => import('../components/ListView.vue'),
      meta: {
        title: 'Word List - Manage Your Vocabulary Collection',
        description: 'Manage your vocabulary collection with advanced filtering, sorting, and editing. Import/export CSV files and organize your words.',
        keywords: 'word list, vocabulary management, CSV import, word editing'
      }
    }
  ],
})

// Update document title and meta tags on route change
router.beforeEach((to, from, next) => {
  // Update document title
  if (to.meta.title) {
    document.title = to.meta.title as string
  }
  
  // Update meta description
  if (to.meta.description) {
    updateMetaTag('description', to.meta.description as string)
  }
  
  // Update meta keywords
  if (to.meta.keywords) {
    updateMetaTag('keywords', to.meta.keywords as string)
  }
  
  next()
})

// Helper function to update meta tags
function updateMetaTag(name: string, content: string) {
  let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = name
    document.head.appendChild(meta)
  }
  meta.content = content
}

export default router
