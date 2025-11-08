<template>
  <div class="amiga-tree-map">
    <!-- Breadcrumb navigation -->
    <div v-if="showBreadcrumb" class="breadcrumb">
      <div
        v-for="(crumb, index) in breadcrumbs"
        :key="index"
        class="breadcrumb-item"
        @click="navigateToCrumb(index)"
      >
        {{ crumb.name }}
        <span v-if="index < breadcrumbs.length - 1" class="breadcrumb-separator">›</span>
      </div>
    </div>

    <!-- Tree map SVG -->
    <svg
      :width="width"
      :height="height"
      :viewBox="`0 0 ${width} ${height}`"
      class="tree-map-svg"
    >
      <!-- Background -->
      <rect
        :width="width"
        :height="height"
        fill="#000000"
        stroke="#ffffff"
        stroke-width="2"
      />

      <!-- Tree map rectangles -->
      <g
        v-for="(rect, index) in rectangles"
        :key="`rect-${index}`"
        @click="handleRectClick(rect)"
        @mouseenter="handleRectHover(rect)"
        @mouseleave="handleRectLeave"
      >
        <rect
          :x="rect.x"
          :y="rect.y"
          :width="rect.width"
          :height="rect.height"
          :fill="rect.color"
          :stroke="hoveredRect === rect ? '#ffffff' : '#000000'"
          :stroke-width="hoveredRect === rect ? 3 : 1"
          class="tree-rect"
          :class="{ 'rect-clickable': rect.item.type === 'folder' && rect.item.children }"
        />

        <!-- Label -->
        <text
          v-if="rect.width > 40 && rect.height > 20"
          :x="rect.x + rect.width / 2"
          :y="rect.y + rect.height / 2 - 6"
          text-anchor="middle"
          class="rect-label"
          :font-size="getLabelSize(rect)"
        >
          {{ truncateLabel(rect.item.name, rect.width) }}
        </text>

        <!-- Size label -->
        <text
          v-if="rect.width > 60 && rect.height > 35"
          :x="rect.x + rect.width / 2"
          :y="rect.y + rect.height / 2 + 8"
          text-anchor="middle"
          class="rect-size"
          :font-size="getLabelSize(rect) - 1"
        >
          {{ formatSize(rect.item.size) }}
        </text>
      </g>
    </svg>

    <!-- Info panel -->
    <div v-if="showInfo && currentFolder" class="info-panel">
      <div class="info-title">{{ currentFolder.name }}</div>
      <div class="info-stats">
        <div class="stat-item">
          <span class="stat-label">Total Size:</span>
          <span class="stat-value">{{ formatSize(currentFolder.size) }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Items:</span>
          <span class="stat-value">{{ rectangles.length }}</span>
        </div>
      </div>
    </div>

    <!-- Tooltip -->
    <div
      v-if="hoveredRect && showTooltip"
      class="tree-tooltip"
      :style="{ left: tooltipX + 'px', top: tooltipY + 'px' }"
    >
      <div class="tooltip-name">{{ hoveredRect.item.name }}</div>
      <div class="tooltip-type">{{ hoveredRect.item.type }}</div>
      <div class="tooltip-size">{{ formatSize(hoveredRect.item.size) }}</div>
      <div class="tooltip-percentage">
        {{ ((hoveredRect.item.size / totalSize) * 100).toFixed(1) }}% of total
      </div>
      <div v-if="hoveredRect.item.type === 'folder'" class="tooltip-hint">
        Click to drill down
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, type PropType } from 'vue';
import { getFileTypeColor, formatBytes } from '../../utils/disk-analyzer';

export interface TreeMapItem {
  path: string;
  name: string;
  size: number;
  type: 'file' | 'folder';
  extension?: string;
  children?: TreeMapItem[];
  depth: number;
}

interface TreeRect {
  x: number;
  y: number;
  width: number;
  height: number;
  item: TreeMapItem;
  color: string;
}

interface Breadcrumb {
  name: string;
  item: TreeMapItem;
}

const props = defineProps({
  data: {
    type: Object as PropType<TreeMapItem>,
    required: true
  },
  width: {
    type: Number,
    default: 800
  },
  height: {
    type: Number,
    default: 500
  },
  showBreadcrumb: {
    type: Boolean,
    default: true
  },
  showInfo: {
    type: Boolean,
    default: true
  },
  showTooltip: {
    type: Boolean,
    default: true
  },
  minRectSize: {
    type: Number,
    default: 10 // Minimum size in pixels to show a rectangle
  }
});

const emit = defineEmits<{
  itemClick: [item: TreeMapItem];
  itemHover: [item: TreeMapItem | null];
  navigate: [item: TreeMapItem];
}>();

const currentFolder = ref<TreeMapItem>(props.data);
const hoveredRect = ref<TreeRect | null>(null);
const tooltipX = ref(0);
const tooltipY = ref(0);

const breadcrumbs = computed((): Breadcrumb[] => {
  const crumbs: Breadcrumb[] = [];
  let item = currentFolder.value;

  // Build breadcrumb trail from current to root
  const path = item.path.split('/');
  let currentPath = '';

  path.forEach((segment, index) => {
    if (!segment) return;

    currentPath = currentPath ? `${currentPath}/${segment}` : segment;

    // Find the item for this path segment
    if (index === 0) {
      crumbs.push({ name: segment, item: props.data });
    } else {
      // Navigate down to find this segment
      let parent = props.data;
      const segments = currentPath.split('/');

      for (let i = 1; i < segments.length; i++) {
        const found = parent.children?.find(c => c.name === segments[i]);
        if (found) {
          parent = found;
        }
      }

      crumbs.push({ name: segment, item: parent });
    }
  });

  return crumbs;
});

const totalSize = computed(() => currentFolder.value.size);

const rectangles = computed((): TreeRect[] => {
  if (!currentFolder.value.children || currentFolder.value.children.length === 0) {
    return [];
  }

  const items = [...currentFolder.value.children].sort((a, b) => b.size - a.size);

  return squarify(items, 0, 0, props.width, props.height);
});

function squarify(
  items: TreeMapItem[],
  x: number,
  y: number,
  width: number,
  height: number
): TreeRect[] {
  if (items.length === 0) return [];

  const rects: TreeRect[] = [];
  const totalSize = items.reduce((sum, item) => sum + item.size, 0);

  if (totalSize === 0) return [];

  let row: TreeMapItem[] = [];
  let remaining = [...items];
  let currentX = x;
  let currentY = y;
  let remainingWidth = width;
  let remainingHeight = height;

  while (remaining.length > 0) {
    const item = remaining[0];
    const testRow = [...row, item];

    const worstBefore = row.length > 0 ? worst(row, remainingWidth, remainingHeight) : Infinity;
    const worstAfter = worst(testRow, remainingWidth, remainingHeight);

    if (worstAfter > worstBefore && row.length > 0) {
      // Layout current row
      const rowSize = row.reduce((sum, i) => sum + i.size, 0);
      const isVertical = remainingWidth >= remainingHeight;

      if (isVertical) {
        const rowWidth = (rowSize / totalSize) * width;
        layoutRow(row, currentX, currentY, rowWidth, remainingHeight, isVertical, rects);
        currentX += rowWidth;
        remainingWidth -= rowWidth;
      } else {
        const rowHeight = (rowSize / totalSize) * height;
        layoutRow(row, currentX, currentY, remainingWidth, rowHeight, isVertical, rects);
        currentY += rowHeight;
        remainingHeight -= rowHeight;
      }

      row = [];
    } else {
      row.push(item);
      remaining.shift();
    }
  }

  // Layout final row
  if (row.length > 0) {
    const rowSize = row.reduce((sum, i) => sum + i.size, 0);
    const isVertical = remainingWidth >= remainingHeight;

    if (isVertical) {
      const rowWidth = (rowSize / totalSize) * width;
      layoutRow(row, currentX, currentY, rowWidth, remainingHeight, isVertical, rects);
    } else {
      const rowHeight = (rowSize / totalSize) * height;
      layoutRow(row, currentX, currentY, remainingWidth, rowHeight, isVertical, rects);
    }
  }

  return rects.filter(r => r.width >= props.minRectSize && r.height >= props.minRectSize);
}

function layoutRow(
  row: TreeMapItem[],
  x: number,
  y: number,
  width: number,
  height: number,
  isVertical: boolean,
  rects: TreeRect[]
): void {
  const rowTotal = row.reduce((sum, item) => sum + item.size, 0);
  let offset = 0;

  row.forEach(item => {
    const ratio = item.size / rowTotal;
    let rectX, rectY, rectWidth, rectHeight;

    if (isVertical) {
      rectX = x;
      rectY = y + offset;
      rectWidth = width;
      rectHeight = height * ratio;
      offset += rectHeight;
    } else {
      rectX = x + offset;
      rectY = y;
      rectWidth = width * ratio;
      rectHeight = height;
      offset += rectWidth;
    }

    const color = getItemColor(item);

    rects.push({
      x: rectX,
      y: rectY,
      width: rectWidth,
      height: rectHeight,
      item,
      color
    });
  });
}

function worst(row: TreeMapItem[], width: number, height: number): number {
  if (row.length === 0) return Infinity;

  const rowTotal = row.reduce((sum, item) => sum + item.size, 0);
  const shortSide = Math.min(width, height);

  if (shortSide === 0 || rowTotal === 0) return Infinity;

  const sizes = row.map(item => item.size);
  const minSize = Math.min(...sizes);
  const maxSize = Math.max(...sizes);

  const a = (shortSide * shortSide * rowTotal) / (width * height);

  return Math.max(
    (a * a) / (minSize * minSize),
    (maxSize * maxSize) / (a * a)
  );
}

function getItemColor(item: TreeMapItem): string {
  if (item.type === 'file' && item.extension) {
    return getFileTypeColor(item.extension);
  }

  // Folder colors based on depth
  const folderColors = ['#666666', '#888888', '#999999', '#aaaaaa'];
  return folderColors[item.depth % folderColors.length];
}

function getLabelSize(rect: TreeRect): number {
  const area = rect.width * rect.height;
  if (area > 10000) return 10;
  if (area > 5000) return 9;
  if (area > 2000) return 8;
  return 7;
}

function truncateLabel(label: string, width: number): string {
  const maxChars = Math.floor(width / 6);
  if (label.length <= maxChars) return label;

  return label.substring(0, maxChars - 3) + '...';
}

function formatSize(bytes: number): string {
  return formatBytes(bytes);
}

function handleRectClick(rect: TreeRect): void {
  emit('itemClick', rect.item);

  if (rect.item.type === 'folder' && rect.item.children && rect.item.children.length > 0) {
    currentFolder.value = rect.item;
    emit('navigate', rect.item);
  }
}

function handleRectHover(rect: TreeRect): void {
  hoveredRect.value = rect;
  emit('itemHover', rect.item);
}

function handleRectLeave(): void {
  hoveredRect.value = null;
  emit('itemHover', null);
}

function navigateToCrumb(index: number): void {
  const crumb = breadcrumbs.value[index];
  currentFolder.value = crumb.item;
  emit('navigate', crumb.item);
}

// Handle mouse move for tooltip positioning
function handleMouseMove(event: MouseEvent): void {
  tooltipX.value = event.clientX;
  tooltipY.value = event.clientY;
}

// Expose navigate method for parent components
defineExpose({
  navigateToRoot: () => {
    currentFolder.value = props.data;
  },
  navigateToPath: (path: string) => {
    // Find item by path
    const findByPath = (item: TreeMapItem): TreeMapItem | null => {
      if (item.path === path) return item;
      if (item.children) {
        for (const child of item.children) {
          const found = findByPath(child);
          if (found) return found;
        }
      }
      return null;
    };

    const found = findByPath(props.data);
    if (found) {
      currentFolder.value = found;
    }
  }
});
</script>

<style scoped>
.amiga-tree-map {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-family: 'Press Start 2P', monospace;
}

.breadcrumb {
  display: flex;
  gap: 4px;
  align-items: center;
  background: #000000;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 6px 8px;
  overflow-x: auto;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 8px;
  color: #00ff00;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.1s;
}

.breadcrumb-item:hover {
  color: #ffaa00;
  text-decoration: underline;
}

.breadcrumb-separator {
  color: #ffffff;
  margin: 0 2px;
}

.tree-map-svg {
  filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3));
}

.tree-rect {
  cursor: pointer;
  transition: all 0.15s;
}

.tree-rect:hover {
  opacity: 0.9;
}

.rect-clickable:hover {
  filter: brightness(1.2);
}

.rect-label {
  fill: #000000;
  font-family: 'Press Start 2P', monospace;
  font-weight: bold;
  pointer-events: none;
  text-shadow:
    -1px -1px 0 #ffffff,
    1px -1px 0 #ffffff,
    -1px 1px 0 #ffffff,
    1px 1px 0 #ffffff;
}

.rect-size {
  fill: #333333;
  font-family: 'Press Start 2P', monospace;
  pointer-events: none;
}

.info-panel {
  background: #000000;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 8px;
}

.info-title {
  font-size: 9px;
  color: #ffaa00;
  margin-bottom: 6px;
  font-weight: bold;
}

.info-stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  display: flex;
  gap: 4px;
  font-size: 7px;
}

.stat-label {
  color: #ffffff;
}

.stat-value {
  color: #00ff00;
  font-weight: bold;
}

.tree-tooltip {
  position: fixed;
  background: #000000;
  border: 2px solid #ffaa00;
  padding: 8px;
  pointer-events: none;
  z-index: 10000;
  box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.5);
  transform: translate(-50%, -100%) translateY(-10px);
  min-width: 150px;
}

.tooltip-name {
  font-size: 8px;
  color: #ffffff;
  margin-bottom: 4px;
  font-weight: bold;
}

.tooltip-type {
  font-size: 7px;
  color: #888888;
  margin-bottom: 4px;
  text-transform: uppercase;
}

.tooltip-size {
  font-size: 9px;
  color: #00ff00;
  font-weight: bold;
  margin-bottom: 2px;
}

.tooltip-percentage {
  font-size: 7px;
  color: #ffaa00;
  margin-bottom: 4px;
}

.tooltip-hint {
  font-size: 6px;
  color: #666666;
  font-style: italic;
}
</style>
