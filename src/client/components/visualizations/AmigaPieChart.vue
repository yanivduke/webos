<template>
  <div class="amiga-pie-chart">
    <svg
      :width="width"
      :height="height"
      :viewBox="`0 0 ${width} ${height}`"
      class="pie-chart-svg"
    >
      <!-- Chart segments -->
      <g :transform="`translate(${centerX}, ${centerY})`">
        <path
          v-for="(segment, index) in segments"
          :key="index"
          :d="segment.path"
          :fill="segment.color"
          :stroke="hoveredIndex === index ? '#ffffff' : '#000000'"
          :stroke-width="hoveredIndex === index ? 3 : 2"
          class="pie-segment"
          @mouseenter="handleMouseEnter(index)"
          @mouseleave="handleMouseLeave"
          @click="handleClick(segment, index)"
        />

        <!-- Labels -->
        <g v-if="showLabels">
          <text
            v-for="(segment, index) in segments"
            :key="`label-${index}`"
            :x="segment.labelX"
            :y="segment.labelY"
            text-anchor="middle"
            class="segment-label"
            :class="{ 'label-highlighted': hoveredIndex === index }"
          >
            {{ segment.percentage }}%
          </text>
        </g>

        <!-- Center circle (donut mode) -->
        <circle
          v-if="donutMode"
          :r="innerRadius"
          fill="#a0a0a0"
          stroke="#000000"
          stroke-width="2"
        />

        <!-- Center text -->
        <text
          v-if="centerText"
          x="0"
          y="0"
          text-anchor="middle"
          dominant-baseline="middle"
          class="center-text"
        >
          {{ centerText }}
        </text>
      </g>
    </svg>

    <!-- Legend -->
    <div v-if="showLegend" class="chart-legend">
      <div
        v-for="(item, index) in data"
        :key="index"
        class="legend-item"
        :class="{ 'legend-highlighted': hoveredIndex === index }"
        @mouseenter="handleMouseEnter(index)"
        @mouseleave="handleMouseLeave"
        @click="handleClick(segments[index], index)"
      >
        <div class="legend-color" :style="{ background: getColor(index) }"></div>
        <div class="legend-label">{{ item.label }}</div>
        <div class="legend-value">{{ formatValue(item.value) }}</div>
      </div>
    </div>

    <!-- Tooltip -->
    <div
      v-if="hoveredIndex !== null && tooltip"
      class="chart-tooltip"
      :style="{ left: tooltipX + 'px', top: tooltipY + 'px' }"
    >
      <div class="tooltip-label">{{ data[hoveredIndex].label }}</div>
      <div class="tooltip-value">{{ formatValue(data[hoveredIndex].value) }}</div>
      <div class="tooltip-percentage">{{ segments[hoveredIndex].percentage }}%</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, type PropType } from 'vue';

export interface PieChartData {
  label: string;
  value: number;
  color?: string;
}

interface PieSegment {
  startAngle: number;
  endAngle: number;
  path: string;
  color: string;
  percentage: number;
  labelX: number;
  labelY: number;
}

const props = defineProps({
  data: {
    type: Array as PropType<PieChartData[]>,
    required: true
  },
  width: {
    type: Number,
    default: 400
  },
  height: {
    type: Number,
    default: 400
  },
  colors: {
    type: Array as PropType<string[]>,
    default: () => [
      '#FF6B35', '#F7B801', '#00BBF9', '#00F5FF',
      '#9B5DE5', '#F15BB5', '#FEE440', '#00F5D4'
    ]
  },
  donutMode: {
    type: Boolean,
    default: false
  },
  innerRadiusPercent: {
    type: Number,
    default: 50
  },
  showLabels: {
    type: Boolean,
    default: true
  },
  showLegend: {
    type: Boolean,
    default: true
  },
  showTooltip: {
    type: Boolean,
    default: true
  },
  centerText: {
    type: String,
    default: ''
  },
  valueFormatter: {
    type: Function as PropType<(value: number) => string>,
    default: null
  }
});

const emit = defineEmits<{
  segmentClick: [data: PieChartData, index: number];
  segmentHover: [data: PieChartData | null, index: number | null];
}>();

const hoveredIndex = ref<number | null>(null);
const tooltipX = ref(0);
const tooltipY = ref(0);

const centerX = computed(() => props.width / 2);
const centerY = computed(() => props.height / 2);
const radius = computed(() => Math.min(props.width, props.height) / 2 - 40);
const innerRadius = computed(() =>
  props.donutMode ? (radius.value * props.innerRadiusPercent) / 100 : 0
);

const tooltip = computed(() => props.showTooltip && hoveredIndex.value !== null);

const total = computed(() => {
  return props.data.reduce((sum, item) => sum + item.value, 0);
});

const segments = computed((): PieSegment[] => {
  const segs: PieSegment[] = [];
  let currentAngle = -Math.PI / 2; // Start at top

  props.data.forEach((item, index) => {
    const percentage = (item.value / total.value) * 100;
    const angle = (item.value / total.value) * 2 * Math.PI;
    const endAngle = currentAngle + angle;

    const path = createArcPath(
      currentAngle,
      endAngle,
      radius.value,
      innerRadius.value
    );

    // Calculate label position
    const midAngle = currentAngle + angle / 2;
    const labelRadius = props.donutMode
      ? (radius.value + innerRadius.value) / 2
      : radius.value * 0.7;
    const labelX = Math.cos(midAngle) * labelRadius;
    const labelY = Math.sin(midAngle) * labelRadius;

    segs.push({
      startAngle: currentAngle,
      endAngle,
      path,
      color: getColor(index),
      percentage: Math.round(percentage * 10) / 10,
      labelX,
      labelY
    });

    currentAngle = endAngle;
  });

  return segs;
});

function getColor(index: number): string {
  if (props.data[index].color) {
    return props.data[index].color!;
  }
  return props.colors[index % props.colors.length];
}

function createArcPath(
  startAngle: number,
  endAngle: number,
  outerRadius: number,
  innerRadius: number
): string {
  const startX = Math.cos(startAngle) * outerRadius;
  const startY = Math.sin(startAngle) * outerRadius;
  const endX = Math.cos(endAngle) * outerRadius;
  const endY = Math.sin(endAngle) * outerRadius;

  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

  if (innerRadius === 0) {
    // Pie mode
    return `M 0 0 L ${startX} ${startY} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${endX} ${endY} Z`;
  } else {
    // Donut mode
    const innerStartX = Math.cos(startAngle) * innerRadius;
    const innerStartY = Math.sin(startAngle) * innerRadius;
    const innerEndX = Math.cos(endAngle) * innerRadius;
    const innerEndY = Math.sin(endAngle) * innerRadius;

    return `M ${innerStartX} ${innerStartY} L ${startX} ${startY} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${endX} ${endY} L ${innerEndX} ${innerEndY} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStartX} ${innerStartY} Z`;
  }
}

function handleMouseEnter(index: number): void {
  hoveredIndex.value = index;
  emit('segmentHover', props.data[index], index);
}

function handleMouseLeave(): void {
  hoveredIndex.value = null;
  emit('segmentHover', null, null);
}

function handleClick(segment: PieSegment, index: number): void {
  emit('segmentClick', props.data[index], index);
}

function formatValue(value: number): string {
  if (props.valueFormatter) {
    return props.valueFormatter(value);
  }
  return value.toLocaleString();
}
</script>

<style scoped>
.amiga-pie-chart {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  font-family: 'Press Start 2P', monospace;
}

.pie-chart-svg {
  filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3));
}

.pie-segment {
  cursor: pointer;
  transition: all 0.2s;
}

.pie-segment:hover {
  opacity: 0.9;
  filter: brightness(1.1);
}

.segment-label {
  font-size: 10px;
  fill: #000000;
  font-family: 'Press Start 2P', monospace;
  pointer-events: none;
  text-shadow:
    -1px -1px 0 #ffffff,
    1px -1px 0 #ffffff,
    -1px 1px 0 #ffffff,
    1px 1px 0 #ffffff;
}

.label-highlighted {
  font-weight: bold;
  font-size: 11px;
}

.center-text {
  font-size: 12px;
  fill: #000000;
  font-family: 'Press Start 2P', monospace;
  font-weight: bold;
}

.chart-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 300px;
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 12px;
  box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px;
  cursor: pointer;
  transition: all 0.1s;
}

.legend-item:hover,
.legend-highlighted {
  background: rgba(0, 85, 170, 0.2);
}

.legend-color {
  width: 16px;
  height: 16px;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  flex-shrink: 0;
}

.legend-label {
  flex: 1;
  font-size: 8px;
  color: #000000;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.legend-value {
  font-size: 8px;
  color: #0055aa;
  font-weight: bold;
}

.chart-tooltip {
  position: fixed;
  background: #000000;
  border: 2px solid #ffffff;
  padding: 8px;
  pointer-events: none;
  z-index: 10000;
  box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.5);
  transform: translate(-50%, -100%) translateY(-10px);
}

.tooltip-label {
  font-size: 8px;
  color: #ffffff;
  margin-bottom: 4px;
}

.tooltip-value {
  font-size: 10px;
  color: #00ff00;
  font-weight: bold;
  margin-bottom: 2px;
}

.tooltip-percentage {
  font-size: 9px;
  color: #ffaa00;
}
</style>
