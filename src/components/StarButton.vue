<template>
  <v-btn
    @click="handleClick"
    icon
    size="small"
    :color="starColor"
    variant="text"
    :class="{ 'star-filled': stars > 0 }"
  >
    <v-icon>{{ starIcon }}</v-icon>
  </v-btn>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  stars: number;
}

interface Emits {
  (e: 'update:stars', value: number): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Star icon based on value
const starIcon = computed(() => {
  return props.stars > 0 ? 'mdi-star' : 'mdi-star-outline';
});

// Star color based on value
const starColor = computed(() => {
  switch (props.stars) {
    case 0:
      return 'grey-lighten-1'; // No fill - light grey
    case 1:
      return 'light-blue'; // Light blue
    case 2:
      return 'green'; // Green
    case 3:
      return 'yellow-darken-2'; // Yellow
    case 4:
      return 'orange'; // Orange
    case 5:
      return 'red'; // Red
    default:
      return 'grey-lighten-1';
  }
});

// Handle click - cycle through 0-5
function handleClick() {
  const newValue = props.stars >= 5 ? 0 : props.stars + 1;
  emit('update:stars', newValue);
}
</script>

<style scoped>
.star-filled {
  font-weight: bold;
}
</style>
