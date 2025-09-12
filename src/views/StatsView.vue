<template>
  <div class="stats-view-container">
    <v-container fluid>
      <!-- Overview Cards -->
      <v-row class="mb-4">
      <v-col cols="12" md="3">
        <v-card>
          <v-card-text class="text-center">
            <v-icon size="48" color="primary">mdi-book</v-icon>
            <div class="text-h4 mt-2">{{ wordsStore.totalWords }}</div>
            <div class="text-body-2 text-grey">Total Words</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="3">
        <v-card>
          <v-card-text class="text-center">
            <v-icon size="48" color="success">mdi-check-circle</v-icon>
            <div class="text-h4 mt-2">{{ wordsStore.learnedWords }}</div>
            <div class="text-body-2 text-grey">Learned</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="3">
        <v-card>
          <v-card-text class="text-center">
            <v-icon size="48" color="warning">mdi-alert-circle</v-icon>
            <div class="text-h4 mt-2">{{ Math.round(wordsStore.errorRate) }}%</div>
            <div class="text-body-2 text-grey">Error Rate</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="3">
        <v-card>
          <v-card-text class="text-center">
            <v-icon size="48" color="info">mdi-trending-up</v-icon>
            <div class="text-h4 mt-2">{{ learningProgress }}%</div>
            <div class="text-body-2 text-grey">Progress</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Charts -->
    <v-row>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>
            <v-icon left>mdi-chart-pie</v-icon>
            Language Distribution
          </v-card-title>
          <v-card-text>
            <div ref="languageChart" style="height: 300px;"></div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>
            <v-icon left>mdi-chart-bar</v-icon>
            Learning Progress
          </v-card-title>
          <v-card-text>
            <div ref="progressChart" style="height: 300px;"></div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Detailed Stats -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <v-icon left>mdi-chart-line</v-icon>
            Detailed Statistics
          </v-card-title>
          <v-card-text>
            <v-data-table
              :headers="statsHeaders"
              :items="detailedStats"
              :loading="loading"
              class="elevation-1"
            >
              <template #item.language="{ item }">
                <v-chip :color="getLanguageColor(item.language)">
                  {{ getLanguageDisplayName(item.language) }}
                </v-chip>
              </template>
              
              <template #item.progress="{ item }">
                <v-progress-linear
                  :model-value="item.progress"
                  color="primary"
                  height="8"
                  rounded
                />
                <div class="text-caption text-center mt-1">
                  {{ item.progress }}%
                </div>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Export Section -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <v-icon left>mdi-download</v-icon>
            Export Data
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <v-btn
                  @click="exportCsv"
                  color="primary"
                  prepend-icon="mdi-file-excel"
                  block
                >
                  Export Words as CSV
                </v-btn>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-btn
                  @click="exportStats"
                  color="secondary"
                  prepend-icon="mdi-chart-box"
                  block
                >
                  Export Statistics
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { useWordsStore } from '@/stores/useWordsStore';
import { getLanguageDisplayName } from '@/utils/normalize';
import { downloadCsv } from '@/utils/csv';
import * as echarts from 'echarts';
import type { ECharts } from 'echarts';

const wordsStore = useWordsStore();

// Local state
const loading = ref(false);
const languageChart = ref<HTMLElement>();
const progressChart = ref<HTMLElement>();
let languageChartInstance: ECharts | null = null;
let progressChartInstance: ECharts | null = null;

// Computed
const learningProgress = computed(() => {
  if (wordsStore.totalWords === 0) return 0;
  return Math.round((wordsStore.learnedWords / wordsStore.totalWords) * 100);
});

const detailedStats = computed(() => {
  const languageStats: Record<string, {
    total: number;
    learned: number;
    errors: number;
    times: number;
  }> = {};

  wordsStore.getAllItems().forEach(word => {
    if (!languageStats[word.lang_tgt]) {
      languageStats[word.lang_tgt] = {
        total: 0,
        learned: 0,
        errors: 0,
        times: 0,
      };
    }

    languageStats[word.lang_tgt].total++;
    if (word.times > 0) languageStats[word.lang_tgt].learned++;
    languageStats[word.lang_tgt].errors += word.errors;
    languageStats[word.lang_tgt].times += word.times;
  });

  return Object.entries(languageStats).map(([language, stats]) => ({
    language,
    total: stats.total,
    learned: stats.learned,
    progress: stats.total > 0 ? Math.round((stats.learned / stats.total) * 100) : 0,
    errorRate: stats.times > 0 ? Math.round((stats.errors / stats.times) * 100) : 0,
    avgAttempts: stats.times > 0 ? Math.round(stats.times / stats.learned) : 0,
  }));
});

const statsHeaders = [
  { title: 'Language', key: 'language', sortable: true },
  { title: 'Total Words', key: 'total', sortable: true },
  { title: 'Learned', key: 'learned', sortable: true },
  { title: 'Progress', key: 'progress', sortable: true },
  { title: 'Error Rate', key: 'errorRate', sortable: true },
  { title: 'Avg Attempts', key: 'avgAttempts', sortable: true },
];

// Methods
function getLanguageColor(language: string): string {
  const colors = ['primary', 'success', 'warning', 'error', 'info', 'secondary'];
  const index = language.charCodeAt(0) % colors.length;
  return colors[index];
}

function initCharts() {
  nextTick(() => {
    if (languageChart.value) {
      languageChartInstance = echarts.init(languageChart.value);
      updateLanguageChart();
    }
    
    if (progressChart.value) {
      progressChartInstance = echarts.init(progressChart.value);
      updateProgressChart();
    }
  });
}

function updateLanguageChart() {
  if (!languageChartInstance) return;

  const data = Object.entries(wordsStore.languageDistribution).map(([lang, count]) => ({
    name: getLanguageDisplayName(lang),
    value: count,
  }));

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        name: 'Languages',
        type: 'pie',
        radius: '50%',
        data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  };

  languageChartInstance.setOption(option);
}

function updateProgressChart() {
  if (!progressChartInstance) return;

  // Generate mock progress data for the last 30 days
  const progressData = [];
  const today = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Mock data - in a real app, you'd track this over time
    const learned = Math.floor(Math.random() * 5) + wordsStore.learnedWords - 15;
    const errors = Math.floor(Math.random() * 3);
    
    progressData.push({
      date: date.toISOString().split('T')[0],
      learned: Math.max(0, learned),
      errors,
    });
  }

  const option = {
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['Words Learned', 'Errors'],
    },
    xAxis: {
      type: 'category',
      data: progressData.map(d => d.date),
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: 'Words Learned',
        type: 'line',
        data: progressData.map(d => d.learned),
        smooth: true,
      },
      {
        name: 'Errors',
        type: 'line',
        data: progressData.map(d => d.errors),
        smooth: true,
      },
    ],
  };

  progressChartInstance.setOption(option);
}

function exportCsv() {
  const csvContent = wordsStore.exportCsv();
  const timestamp = new Date().toISOString().split('T')[0];
  downloadCsv(csvContent, `words-${timestamp}.csv`);
}

function exportStats() {
  const statsData = detailedStats.value.map(stat => ({
    language: stat.language,
    language_name: getLanguageDisplayName(stat.language),
    total_words: stat.total,
    learned_words: stat.learned,
    progress_percentage: stat.progress,
    error_rate: stat.errorRate,
    average_attempts: stat.avgAttempts,
  }));

  downloadCsv(JSON.stringify(statsData, null, 2), `stats-${new Date().toISOString().split('T')[0]}.json`);
}

// Lifecycle
onMounted(async () => {
  loading.value = true;
  await wordsStore.restore();
  initCharts();
  loading.value = false;
});

// Watch for data changes
watch(() => wordsStore.rows, () => {
  updateLanguageChart();
  updateProgressChart();
}, { deep: true });
</script>

<style scoped>
.stats-view-container {
  width: 100%;
  max-width: none;
  padding: 16px;
  margin: 0 auto;
}

/* Responsive design for wide screens */
@media (min-width: 1400px) {
  .stats-view-container {
    padding: 24px 48px;
  }
}

@media (min-width: 1920px) {
  .stats-view-container {
    padding: 32px 64px;
  }
}

@media (max-width: 768px) {
  .stats-view-container {
    padding: 8px;
  }
}
</style>
