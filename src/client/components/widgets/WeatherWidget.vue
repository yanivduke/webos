<template>
  <div class="widget weather-widget">
    <div class="widget-header">
      <div class="widget-icon">🌤️</div>
      <div class="widget-title">Weather</div>
    </div>
    <div class="widget-content">
      <div v-if="loading" class="widget-loading">Loading...</div>
      <div v-else-if="error" class="widget-error">{{ error }}</div>
      <div v-else-if="weatherData" class="weather-info">
        <div class="weather-location">{{ location }}</div>
        <div class="weather-temp">{{ weatherData.temp }}°{{ units === 'metric' ? 'C' : 'F' }}</div>
        <div class="weather-desc">{{ weatherData.description }}</div>
        <div class="weather-details">
          <span>💧 {{ weatherData.humidity }}%</span>
          <span>💨 {{ weatherData.windSpeed }} {{ units === 'metric' ? 'm/s' : 'mph' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface Props {
  location?: string;
  units?: 'metric' | 'imperial';
}

const props = withDefaults(defineProps<Props>(), {
  location: 'New York',
  units: 'metric'
});

interface WeatherData {
  temp: number;
  description: string;
  humidity: number;
  windSpeed: number;
}

const weatherData = ref<WeatherData | null>(null);
const loading = ref(true);
const error = ref('');

const fetchWeather = async () => {
  try {
    loading.value = true;
    error.value = '';

    const response = await fetch(`/api/widgets/weather?location=${encodeURIComponent(props.location)}&units=${props.units}`);

    if (!response.ok) {
      throw new Error('Failed to fetch weather data');
    }

    const data = await response.json();
    weatherData.value = data;
  } catch (err) {
    console.error('Weather fetch error:', err);
    error.value = 'Unable to load weather';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchWeather();
  // Refresh weather every 10 minutes
  setInterval(fetchWeather, 10 * 60 * 1000);
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

.weather-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.weather-location {
  font-size: 9px;
  color: #0055aa;
  font-weight: bold;
  text-align: center;
}

.weather-temp {
  font-size: 18px;
  color: #000000;
  font-weight: bold;
  text-align: center;
  text-shadow: 1px 1px 0px rgba(255, 255, 255, 0.5);
}

.weather-desc {
  font-size: 8px;
  text-align: center;
  color: #333333;
  text-transform: capitalize;
}

.weather-details {
  display: flex;
  justify-content: space-around;
  font-size: 7px;
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px solid #888888;
}
</style>
