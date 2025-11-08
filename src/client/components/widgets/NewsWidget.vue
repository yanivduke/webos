<template>
  <div class="widget news-widget">
    <div class="widget-header">
      <div class="widget-icon">📰</div>
      <div class="widget-title">News</div>
    </div>
    <div class="widget-content">
      <div v-if="loading" class="widget-loading">Loading...</div>
      <div v-else-if="error" class="widget-error">{{ error }}</div>
      <div v-else-if="newsItems && newsItems.length > 0" class="news-list">
        <div v-for="(item, index) in newsItems" :key="index" class="news-item">
          <a :href="item.url" target="_blank" class="news-link">{{ item.title }}</a>
          <div class="news-source">{{ item.source }}</div>
        </div>
      </div>
      <div v-else class="widget-loading">No news available</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface Props {
  category?: string;
  maxItems?: number;
}

const props = withDefaults(defineProps<Props>(), {
  category: 'technology',
  maxItems: 5
});

interface NewsItem {
  title: string;
  url: string;
  source: string;
}

const newsItems = ref<NewsItem[]>([]);
const loading = ref(true);
const error = ref('');

const fetchNews = async () => {
  try {
    loading.value = true;
    error.value = '';

    const response = await fetch(`/api/widgets/news?category=${props.category}&maxItems=${props.maxItems}`);

    if (!response.ok) {
      throw new Error('Failed to fetch news');
    }

    const data = await response.json();
    newsItems.value = data.items || [];
  } catch (err) {
    console.error('News fetch error:', err);
    error.value = 'Unable to load news';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchNews();
  // Refresh news every 15 minutes
  setInterval(fetchNews, 15 * 60 * 1000);
});
</script>

<style scoped>
.widget {
  background: #a0a0a0;
  border: 2px solid;
  border-color: #ffffff #000000 #000000 #ffffff;
  padding: 8px;
  margin-bottom: 8px;
  font-family: 'Press Start 2P', monospace;
}

.widget-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid #000000;
}

.widget-icon {
  font-size: 12px;
}

.widget-title {
  font-size: 9px;
  color: #0055aa;
  font-weight: bold;
}

.widget-content {
  font-size: 8px;
  color: #000000;
  max-height: 300px;
  overflow-y: auto;
}

.widget-loading,
.widget-error {
  text-align: center;
  padding: 8px;
  font-size: 8px;
}

.widget-error {
  color: #ff0000;
}

.news-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.news-item {
  padding: 6px;
  background: #ffffff;
  border: 1px solid #000000;
}

.news-link {
  font-size: 7px;
  color: #0055aa;
  text-decoration: none;
  display: block;
  margin-bottom: 2px;
  line-height: 1.3;
}

.news-link:hover {
  text-decoration: underline;
}

.news-source {
  font-size: 6px;
  color: #666666;
  font-style: italic;
}

/* Custom scrollbar for Amiga style */
.widget-content::-webkit-scrollbar {
  width: 12px;
}

.widget-content::-webkit-scrollbar-track {
  background: #888888;
}

.widget-content::-webkit-scrollbar-thumb {
  background: #a0a0a0;
  border: 1px solid #000000;
}

.widget-content::-webkit-scrollbar-thumb:hover {
  background: #b0b0b0;
}
</style>
