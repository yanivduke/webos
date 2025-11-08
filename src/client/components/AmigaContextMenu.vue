<template>
  <div
    v-if="visible"
    class="context-menu"
    :style="menuStyle"
    @click.stop
  >
    <div
      v-for="(item, index) in items"
      :key="index"
      class="context-menu-item"
      :class="{ disabled: item.disabled, separator: item.separator }"
      @click="handleClick(item)"
    >
      <span v-if="!item.separator" class="item-icon">{{ item.icon || '▸' }}</span>
      <span v-if="!item.separator" class="item-label">{{ item.label }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted } from 'vue';

export interface ContextMenuItem {
  label: string;
  action: string;
  icon?: string;
  disabled?: boolean;
  separator?: boolean;
}

interface Props {
  items: ContextMenuItem[];
  x?: number;
  y?: number;
  visible?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  x: 0,
  y: 0,
  visible: false
});

const emit = defineEmits<{
  close: [];
  action: [action: string];
}>();

const menuStyle = computed(() => ({
  left: `${props.x}px`,
  top: `${props.y}px`
}));

const handleClick = (item: ContextMenuItem) => {
  if (item.disabled || item.separator) return;
  emit('action', item.action);
  emit('close');
};

const handleOutsideClick = () => {
  emit('close');
};

onMounted(() => {
  document.addEventListener('click', handleOutsideClick);
});

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick);
});
</script>

<style scoped>
.context-menu {
  position: fixed;
  background: #ffffff;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.5);
  min-width: 180px;
  z-index: 10000;
  font-family: 'Press Start 2P', monospace;
  font-size: 9px;
  padding: 2px;
}

.context-menu-item {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  cursor: pointer;
  color: #000000;
  transition: all 0.05s;
  gap: 8px;
  user-select: none;
}

.context-menu-item:hover:not(.disabled):not(.separator) {
  background: #0055aa;
  color: #ffffff;
}

.context-menu-item.disabled {
  color: #888888;
  cursor: not-allowed;
}

.context-menu-item.separator {
  height: 2px;
  background: #000000;
  margin: 4px 0;
  padding: 0;
  cursor: default;
}

.item-icon {
  width: 12px;
  text-align: center;
  font-size: 8px;
}

.item-label {
  flex: 1;
}
</style>
