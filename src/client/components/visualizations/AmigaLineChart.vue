<template>
  <div class="amiga-line-chart">
    <svg
      :width="width"
      :height="height"
      :viewBox="`0 0 ${width} ${height}`"
      class="line-chart-svg"
      @mousemove="handleMouseMove"
      @mouseleave="handleMouseLeave"
    >
      <!-- Background -->
      <rect
        :width="width"
        :height="height"
        fill="#000000"
        stroke="#ffffff"
        stroke-width="2"
      />

      <!-- Grid lines -->
      <g v-if="showGrid" class="grid-lines">
        <!-- Horizontal grid lines -->
        <line
          v-for="(line, index) in horizontalGridLines"
          :key="`h-${index}`"
          :x1="padding.left"
          :y1="line.y"
          :x2="width - padding.right"
          :y2="line.y"
          stroke="#333333"
          stroke-width="1"
          stroke-dasharray="4,4"
        />
        <!-- Vertical grid lines -->
        <line
          v-for="(line, index) in verticalGridLines"
          :key="`v-${index}`"
          :x1="line.x"
          :y1="padding.top"
          :x2="line.x"
          :y2="height - padding.bottom"
          stroke="#333333"
          stroke-width="1"
          stroke-dasharray="4,4"
        />
      </g>

      <!-- Lines -->
      <g v-for="(series, seriesIndex) in seriesData" :key="`series-${seriesIndex}`">
        <!-- Line path -->
        <path
          :d="series.path"
          :stroke="series.color"
          stroke-width="2"
          fill="none"
          class="line-path"
        />

        <!-- Area fill (optional) -->
        <path
          v-if="fillArea"
          :d="series.areaPath"
          :fill="series.color"
          opacity="0.2"
          class="area-fill"
        />

        <!-- Data points -->
        <circle
          v-for="(point, pointIndex) in series.points"
          :key="`point-${seriesIndex}-${pointIndex}`"
          :cx="point.x"
          :cy="point.y"
          :r="hoveredPoint?.seriesIndex === seriesIndex && hoveredPoint?.pointIndex === pointIndex ? 5 : 3"
          :fill="series.color"
          stroke="#000000"
          stroke-width="1"
          class="data-point"
        />
      </g>

      <!-- Axes -->
      <g class="axes">
        <!-- X axis -->
        <line
          :x1="padding.left"
          :y1="height - padding.bottom"
          :x2="width - padding.right"
          :y2="height - padding.bottom"
          stroke="#ffffff"
          stroke-width="2"
        />
        <!-- Y axis -->
        <line
          :x1="padding.left"
          :y1="padding.top"
          :x2="padding.left"
          :y2="height - padding.bottom"
          stroke="#ffffff"
          stroke-width="2"
        />
      </g>

      <!-- X axis labels -->
      <g v-if="showXLabels" class="x-labels">
        <text
          v-for="(label, index) in xAxisLabels"
          :key="`x-${index}`"
          :x="label.x"
          :y="height - padding.bottom + 20"
          text-anchor="middle"
          class="axis-label"
        >
          {{ label.text }}
        </text>
      </g>

      <!-- Y axis labels -->
      <g v-if="showYLabels" class="y-labels">
        <text
          v-for="(label, index) in yAxisLabels"
          :key="`y-${index}`"
          :x="padding.left - 10"
          :y="label.y"
          text-anchor="end"
          dominant-baseline="middle"
          class="axis-label"
        >
          {{ label.text }}
        </text>
      </g>

      <!-- Hover line -->
      <line
        v-if="hoverX !== null"
        :x1="hoverX"
        :y1="padding.top"
        :x2="hoverX"
        :y2="height - padding.bottom"
        stroke="#ffaa00"
        stroke-width="1"
        stroke-dasharray="4,4"
        class="hover-line"
      />
    </svg>

    <!-- Legend -->
    <div v-if="showLegend && series.length > 1" class="chart-legend">
      <div
        v-for="(s, index) in series"
        :key="`legend-${index}`"
        class="legend-item"
      >
        <div class="legend-color" :style="{ background: s.color || colors[index] }"></div>
        <div class="legend-label">{{ s.label }}</div>
      </div>
    </div>

    <!-- Tooltip -->
    <div
      v-if="hoveredPoint && showTooltip"
      class="chart-tooltip"
      :style="{ left: tooltipX + 'px', top: tooltipY + 'px' }"
    >
      <div class="tooltip-title">{{ series[hoveredPoint.seriesIndex].label }}</div>
      <div class="tooltip-value">
        {{ formatYValue(series[hoveredPoint.seriesIndex].data[hoveredPoint.pointIndex].y) }}
      </div>
      <div class="tooltip-time">
        {{ formatXValue(series[hoveredPoint.seriesIndex].data[hoveredPoint.pointIndex].x) }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, type PropType } from 'vue';

export interface LineChartDataPoint {
  x: number | string;
  y: number;
}

export interface LineChartSeries {
  label: string;
  data: LineChartDataPoint[];
  color?: string;
}

interface Point {
  x: number;
  y: number;
}

interface SeriesData {
  path: string;
  areaPath: string;
  points: Point[];
  color: string;
}

const props = defineProps({
  series: {
    type: Array as PropType<LineChartSeries[]>,
    required: true
  },
  width: {
    type: Number,
    default: 600
  },
  height: {
    type: Number,
    default: 300
  },
  colors: {
    type: Array as PropType<string[]>,
    default: () => ['#00ff00', '#ff6600', '#0099ff', '#ff00ff', '#ffff00']
  },
  padding: {
    type: Object as PropType<{ top: number; right: number; bottom: number; left: number }>,
    default: () => ({ top: 20, right: 20, bottom: 40, left: 60 })
  },
  showGrid: {
    type: Boolean,
    default: true
  },
  showXLabels: {
    type: Boolean,
    default: true
  },
  showYLabels: {
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
  fillArea: {
    type: Boolean,
    default: false
  },
  xAxisFormatter: {
    type: Function as PropType<(value: number | string) => string>,
    default: null
  },
  yAxisFormatter: {
    type: Function as PropType<(value: number) => string>,
    default: null
  }
});

const emit = defineEmits<{
  pointClick: [series: LineChartSeries, point: LineChartDataPoint, index: number];
}>();

const hoverX = ref<number | null>(null);
const hoveredPoint = ref<{ seriesIndex: number; pointIndex: number } | null>(null);
const tooltipX = ref(0);
const tooltipY = ref(0);

const chartWidth = computed(() => props.width - props.padding.left - props.padding.right);
const chartHeight = computed(() => props.height - props.padding.top - props.padding.bottom);

// Calculate min/max values
const allYValues = computed(() => {
  return props.series.flatMap(s => s.data.map(d => d.y));
});

const minY = computed(() => Math.min(0, ...allYValues.value));
const maxY = computed(() => {
  const max = Math.max(...allYValues.value);
  return max === 0 ? 100 : max;
});

// Normalize data points to screen coordinates
const seriesData = computed((): SeriesData[] => {
  return props.series.map((series, seriesIndex) => {
    const points: Point[] = series.data.map((point, index) => {
      const x = props.padding.left + (index / (series.data.length - 1 || 1)) * chartWidth.value;
      const yRatio = (point.y - minY.value) / (maxY.value - minY.value);
      const y = props.height - props.padding.bottom - yRatio * chartHeight.value;

      return { x, y };
    });

    // Create line path
    const path = points.reduce((acc, point, index) => {
      if (index === 0) {
        return `M ${point.x} ${point.y}`;
      }
      return `${acc} L ${point.x} ${point.y}`;
    }, '');

    // Create area path
    const areaPath = points.length > 0
      ? `${path} L ${points[points.length - 1].x} ${props.height - props.padding.bottom} L ${points[0].x} ${props.height - props.padding.bottom} Z`
      : '';

    const color = series.color || props.colors[seriesIndex % props.colors.length];

    return { path, areaPath, points, color };
  });
});

// Grid lines
const horizontalGridLines = computed(() => {
  const lines = [];
  const numLines = 5;

  for (let i = 0; i <= numLines; i++) {
    const y = props.padding.top + (i / numLines) * chartHeight.value;
    lines.push({ y });
  }

  return lines;
});

const verticalGridLines = computed(() => {
  const lines = [];
  const numLines = 6;

  for (let i = 0; i <= numLines; i++) {
    const x = props.padding.left + (i / numLines) * chartWidth.value;
    lines.push({ x });
  }

  return lines;
});

// Axis labels
const yAxisLabels = computed(() => {
  const labels = [];
  const numLabels = 5;

  for (let i = 0; i <= numLabels; i++) {
    const value = maxY.value - (i / numLabels) * (maxY.value - minY.value);
    const y = props.padding.top + (i / numLabels) * chartHeight.value;
    labels.push({
      y,
      text: formatYValue(value)
    });
  }

  return labels;
});

const xAxisLabels = computed(() => {
  if (props.series.length === 0 || props.series[0].data.length === 0) {
    return [];
  }

  const labels = [];
  const data = props.series[0].data;
  const numLabels = Math.min(6, data.length);

  for (let i = 0; i < numLabels; i++) {
    const index = Math.floor((i / (numLabels - 1 || 1)) * (data.length - 1));
    const point = data[index];
    const x = props.padding.left + (index / (data.length - 1 || 1)) * chartWidth.value;
    labels.push({
      x,
      text: formatXValue(point.x)
    });
  }

  return labels;
});

function formatYValue(value: number): string {
  if (props.yAxisFormatter) {
    return props.yAxisFormatter(value);
  }
  return Math.round(value).toString();
}

function formatXValue(value: number | string): string {
  if (props.xAxisFormatter) {
    return props.xAxisFormatter(value);
  }

  if (typeof value === 'number') {
    // Assume timestamp
    const date = new Date(value);
    return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  return String(value);
}

function handleMouseMove(event: MouseEvent): void {
  const svg = event.currentTarget as SVGElement;
  const rect = svg.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  // Check if within chart area
  if (
    x < props.padding.left ||
    x > props.width - props.padding.right ||
    y < props.padding.top ||
    y > props.height - props.padding.bottom
  ) {
    hoverX.value = null;
    hoveredPoint.value = null;
    return;
  }

  hoverX.value = x;

  // Find nearest point
  let nearestPoint: { seriesIndex: number; pointIndex: number; distance: number } | null = null;

  seriesData.value.forEach((series, seriesIndex) => {
    series.points.forEach((point, pointIndex) => {
      const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));

      if (!nearestPoint || distance < nearestPoint.distance) {
        nearestPoint = { seriesIndex, pointIndex, distance };
      }
    });
  });

  if (nearestPoint && nearestPoint.distance < 20) {
    hoveredPoint.value = {
      seriesIndex: nearestPoint.seriesIndex,
      pointIndex: nearestPoint.pointIndex
    };

    tooltipX.value = event.clientX;
    tooltipY.value = event.clientY;
  } else {
    hoveredPoint.value = null;
  }
}

function handleMouseLeave(): void {
  hoverX.value = null;
  hoveredPoint.value = null;
}
</script>

<style scoped>
.amiga-line-chart {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  font-family: 'Press Start 2P', monospace;
}

.line-chart-svg {
  filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3));
}

.line-path {
  stroke-linejoin: round;
  stroke-linecap: round;
}

.data-point {
  cursor: pointer;
  transition: r 0.1s;
}

.data-point:hover {
  r: 6;
}

.axis-label {
  font-size: 8px;
  fill: #ffffff;
  font-family: 'Press Start 2P', monospace;
}

.hover-line {
  pointer-events: none;
}

.chart-legend {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
  background: #000000;
  border: 2px solid #ffffff;
  padding: 8px 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-color {
  width: 16px;
  height: 4px;
  border: 1px solid #000000;
}

.legend-label {
  font-size: 7px;
  color: #ffffff;
}

.chart-tooltip {
  position: fixed;
  background: #000000;
  border: 2px solid #ffaa00;
  padding: 8px;
  pointer-events: none;
  z-index: 10000;
  box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.5);
  transform: translate(-50%, -100%) translateY(-10px);
}

.tooltip-title {
  font-size: 7px;
  color: #ffffff;
  margin-bottom: 4px;
}

.tooltip-value {
  font-size: 10px;
  color: #00ff00;
  font-weight: bold;
  margin-bottom: 2px;
}

.tooltip-time {
  font-size: 7px;
  color: #ffaa00;
}
</style>
