<template>
  <div class="file-rating-stars" :class="{ editable, 'show-value': showValue }">
    <div class="stars-container" @mouseleave="handleMouseLeave">
      <div
        v-for="star in 5"
        :key="star"
        class="star-wrapper"
        @mouseenter="editable && handleMouseEnter(star)"
        @click="editable && handleClick(star)"
      >
        <!-- Full star -->
        <svg
          v-if="star <= displayRating"
          class="star filled"
          viewBox="0 0 16 16"
          :width="size"
          :height="size"
        >
          <path :d="starPath" :fill="starColor" />
        </svg>
        <!-- Half star -->
        <svg
          v-else-if="star - 0.5 === displayRating"
          class="star half"
          viewBox="0 0 16 16"
          :width="size"
          :height="size"
        >
          <defs>
            <clipPath :id="`half-clip-${star}`">
              <rect x="0" y="0" width="8" height="16" />
            </clipPath>
          </defs>
          <path :d="starPath" fill="#888888" />
          <path :d="starPath" :fill="starColor" :clip-path="`url(#half-clip-${star})`" />
        </svg>
        <!-- Empty star -->
        <svg
          v-else
          class="star empty"
          viewBox="0 0 16 16"
          :width="size"
          :height="size"
        >
          <path :d="starPath" fill="#888888" />
        </svg>
      </div>
    </div>

    <!-- Rating value text -->
    <span v-if="showValue && rating > 0" class="rating-value">
      {{ rating.toFixed(1) }}
    </span>

    <!-- Tooltip -->
    <div v-if="showTooltip && editable" class="rating-tooltip" :style="tooltipStyle">
      {{ tooltipText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface Props {
  rating: number; // 0-5
  editable?: boolean;
  size?: number; // Size in pixels
  showValue?: boolean; // Show numeric rating
  allowHalf?: boolean; // Allow half-star ratings
  color?: string; // Star color
}

const props = withDefaults(defineProps<Props>(), {
  editable: false,
  size: 16,
  showValue: false,
  allowHalf: false,
  color: '#ffcc00',
});

interface Emits {
  (e: 'update:rating', rating: number): void;
}

const emit = defineEmits<Emits>();

const hoverRating = ref(0);
const showTooltip = ref(false);
const tooltipStyle = ref({});

// Pixelated star path (Amiga-style, blocky)
const starPath = `
  M8,1 L10,6 L15,6 L11,9 L13,14 L8,11 L3,14 L5,9 L1,6 L6,6 Z
`;

const displayRating = computed(() => {
  if (props.editable && hoverRating.value > 0) {
    return hoverRating.value;
  }
  return props.rating;
});

const starColor = computed(() => {
  return props.color;
});

const tooltipText = computed(() => {
  const rating = hoverRating.value || props.rating;
  if (rating === 0) return 'No rating';
  if (rating === 1) return '1 star - Poor';
  if (rating === 2) return '2 stars - Fair';
  if (rating === 3) return '3 stars - Good';
  if (rating === 4) return '4 stars - Very Good';
  if (rating === 5) return '5 stars - Excellent';
  return `${rating} stars`;
});

function handleMouseEnter(star: number): void {
  if (!props.editable) return;

  hoverRating.value = star;
  showTooltip.value = true;

  // Position tooltip (simplified for now)
  tooltipStyle.value = {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    marginBottom: '5px',
  };
}

function handleMouseLeave(): void {
  if (!props.editable) return;

  hoverRating.value = 0;
  showTooltip.value = false;
}

function handleClick(star: number): void {
  if (!props.editable) return;

  let newRating = star;

  // If clicking the current rating, remove it
  if (star === props.rating) {
    newRating = 0;
  }

  emit('update:rating', newRating);
}
</script>

<style scoped>
.file-rating-stars {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  position: relative;
  user-select: none;
}

.stars-container {
  display: flex;
  gap: 2px;
}

.star-wrapper {
  display: inline-block;
  line-height: 0;
  position: relative;
}

.star {
  display: block;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
  transition: transform 0.1s;
}

/* Editable stars have hover effects */
.editable .star-wrapper {
  cursor: pointer;
}

.editable .star-wrapper:hover .star {
  transform: scale(1.2);
  filter: drop-shadow(0 0 2px rgba(255, 204, 0, 0.8));
}

.editable .star-wrapper:active .star {
  transform: scale(1.1);
}

/* Star states */
.star.filled {
  filter: drop-shadow(1px 1px 1px rgba(0, 0, 0, 0.3));
}

.star.empty {
  opacity: 0.5;
}

.star.half {
  filter: drop-shadow(1px 1px 1px rgba(0, 0, 0, 0.3));
}

/* Rating value text */
.rating-value {
  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  color: #000000;
  margin-left: 4px;
  text-shadow: 1px 1px 0px #ffffff;
}

/* Tooltip */
.rating-tooltip {
  background: #ffcc00;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 4px 8px;
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  color: #000000;
  white-space: nowrap;
  z-index: 1000;
  pointer-events: none;
  box-shadow: 2px 2px 0px rgba(0, 0, 0, 0.3);
}

/* Animation for rating change */
@keyframes star-pop {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.3);
  }
}

.star-wrapper.just-rated .star {
  animation: star-pop 0.3s ease-in-out;
}

/* Compact mode for small displays */
.file-rating-stars.compact {
  gap: 1px;
}

.file-rating-stars.compact .stars-container {
  gap: 1px;
}

/* Show value mode */
.file-rating-stars.show-value {
  gap: 6px;
}
</style>
